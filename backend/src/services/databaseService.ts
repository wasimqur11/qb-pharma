import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DATABASE_PATH = path.join(__dirname, '../../prisma/data/qb-pharma.db');
const BACKUP_DIR = path.join(__dirname, '../../prisma/data/backups');
const SCHEMA_VERSION = '1.0.0'; // Update this when schema changes

interface BackupInfo {
  id: string;
  filename: string;
  path: string;
  size: number;
  createdAt: Date;
  createdBy?: string;
  schemaVersion?: string;
}

interface SchemaValidationResult {
  compatible: boolean;
  errors: string[];
  warnings: string[];
  currentVersion: string;
  backupVersion: string;
}

/**
 * Database Backup and Restoration Service
 * Handles all database backup/restore operations without schema changes
 */
export class DatabaseService {
  /**
   * Ensure backup directory exists
   */
  private static async ensureBackupDir(): Promise<void> {
    if (!existsSync(BACKUP_DIR)) {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
  }

  /**
   * Generate backup filename with timestamp
   */
  private static generateBackupFilename(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];
    return `qb-pharma-backup-${timestamp}.db`;
  }

  /**
   * Validate backup filename to prevent directory traversal
   */
  private static isValidBackupFilename(filename: string): boolean {
    // Only allow alphanumeric, hyphens, underscores, and .db extension
    const validPattern = /^qb-pharma-backup-[\w-]+\.db$/;
    return validPattern.test(filename) && !filename.includes('..');
  }

  /**
   * Get metadata file path for a backup
   */
  private static getMetadataPath(backupPath: string): string {
    return backupPath.replace('.db', '.meta.json');
  }

  /**
   * Save backup metadata
   */
  private static async saveMetadata(backupPath: string, metadata: { createdBy?: string; schemaVersion?: string }): Promise<void> {
    const metadataPath = this.getMetadataPath(backupPath);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Load backup metadata
   */
  private static async loadMetadata(backupPath: string): Promise<{ createdBy?: string; schemaVersion?: string } | null> {
    try {
      const metadataPath = this.getMetadataPath(backupPath);
      if (!existsSync(metadataPath)) {
        return null;
      }
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get database schema tables using sqlite3 command
   * Falls back gracefully if sqlite3 command is not available
   */
  private static async getSchemaInfo(dbPath: string): Promise<{ tables: string[]; error?: string; unavailable?: boolean }> {
    try {
      // Check if file exists and is readable
      if (!existsSync(dbPath)) {
        return {
          tables: [],
          error: 'Database file does not exist'
        };
      }

      // Try to get file stats to ensure it's readable
      const stats = await fs.stat(dbPath);
      if (stats.size === 0) {
        return {
          tables: [],
          error: 'Database file is empty'
        };
      }

      // Try using sqlite3 command if available
      const command = process.platform === 'win32'
        ? `sqlite3.exe "${dbPath}" ".tables"`
        : `sqlite3 "${dbPath}" ".tables"`;

      const { stdout, stderr } = await execAsync(command, { timeout: 5000 });

      if (stderr) {
        return {
          tables: [],
          error: stderr
        };
      }

      // Parse table names from output
      const tables = stdout
        .trim()
        .split(/\s+/)
        .filter(t => t && !t.startsWith('sqlite_'))
        .sort();

      return { tables };
    } catch (error) {
      // If sqlite3 command is not found, mark as unavailable instead of error
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('not recognized') || errorMessage.includes('command not found') || errorMessage.includes('ENOENT')) {
        return {
          tables: [],
          unavailable: true
        };
      }

      return {
        tables: [],
        error: errorMessage || 'Failed to read database schema'
      };
    }
  }

  /**
   * Validate backup schema compatibility
   */
  static async validateBackupSchema(backupPath: string): Promise<SchemaValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get metadata
      const metadata = await this.loadMetadata(backupPath);
      const backupVersion = metadata?.schemaVersion || 'unknown';

      // Get current database schema
      const currentSchema = await this.getSchemaInfo(DATABASE_PATH);

      // Get backup database schema
      const backupSchema = await this.getSchemaInfo(backupPath);

      // If sqlite3 command is unavailable on system, skip detailed validation
      if (currentSchema.unavailable || backupSchema.unavailable) {
        warnings.push('SQLite3 command-line tool not available - performing basic validation only');

        // Perform basic file checks
        if (backupSchema.error && !backupSchema.unavailable) {
          errors.push(`Backup validation failed: ${backupSchema.error}`);
        }

        // Check schema version
        if (backupVersion === 'unknown') {
          warnings.push('Backup schema version is unknown (created before versioning was implemented)');
        } else if (backupVersion !== SCHEMA_VERSION) {
          warnings.push(`Schema version mismatch: backup is ${backupVersion}, current is ${SCHEMA_VERSION}`);
        }

        return {
          compatible: errors.length === 0,
          errors,
          warnings,
          currentVersion: SCHEMA_VERSION,
          backupVersion
        };
      }

      // Full validation if sqlite3 is available
      if (currentSchema.error) {
        errors.push(`Cannot read current database: ${currentSchema.error}`);
      }

      if (backupSchema.error) {
        errors.push(`Cannot read backup database: ${backupSchema.error}`);
        return {
          compatible: false,
          errors,
          warnings,
          currentVersion: SCHEMA_VERSION,
          backupVersion
        };
      }

      // Check if backup is empty
      if (backupSchema.tables.length === 0) {
        errors.push('Backup database appears to be empty or corrupted');
        return {
          compatible: false,
          errors,
          warnings,
          currentVersion: SCHEMA_VERSION,
          backupVersion
        };
      }

      // Compare table lists
      const currentTables = new Set(currentSchema.tables);
      const backupTables = new Set(backupSchema.tables);

      // Check for missing tables in backup
      const missingTables = [...currentTables].filter(t => !backupTables.has(t));
      if (missingTables.length > 0) {
        warnings.push(`Backup is missing tables: ${missingTables.join(', ')}`);
      }

      // Check for extra tables in backup
      const extraTables = [...backupTables].filter(t => !currentTables.has(t));
      if (extraTables.length > 0) {
        warnings.push(`Backup contains additional tables: ${extraTables.join(', ')}`);
      }

      // Check schema version
      if (backupVersion === 'unknown') {
        warnings.push('Backup schema version is unknown (created before versioning was implemented)');
      } else if (backupVersion !== SCHEMA_VERSION) {
        warnings.push(`Schema version mismatch: backup is ${backupVersion}, current is ${SCHEMA_VERSION}`);
      }

      // Determine compatibility
      const compatible = errors.length === 0;

      return {
        compatible,
        errors,
        warnings,
        currentVersion: SCHEMA_VERSION,
        backupVersion
      };
    } catch (error) {
      errors.push(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        compatible: false,
        errors,
        warnings,
        currentVersion: SCHEMA_VERSION,
        backupVersion: 'unknown'
      };
    }
  }

  /**
   * Create a new database backup
   */
  static async createBackup(createdBy?: string): Promise<BackupInfo> {
    try {
      await this.ensureBackupDir();

      // Check if source database exists
      if (!existsSync(DATABASE_PATH)) {
        throw new Error('Source database file not found');
      }

      const filename = this.generateBackupFilename();
      const backupPath = path.join(BACKUP_DIR, filename);

      // Copy database file
      await fs.copyFile(DATABASE_PATH, backupPath);

      // Save metadata with schema version
      await this.saveMetadata(backupPath, {
        createdBy,
        schemaVersion: SCHEMA_VERSION
      });

      // Get file stats
      const stats = await fs.stat(backupPath);

      const backupInfo: BackupInfo = {
        id: filename.replace('.db', ''),
        filename,
        path: backupPath,
        size: stats.size,
        createdAt: stats.mtime,
        createdBy,
        schemaVersion: SCHEMA_VERSION
      };

      console.log(`✅ Database backup created: ${filename} (${stats.size} bytes) [Schema v${SCHEMA_VERSION}]`);
      return backupInfo;
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all available backups
   */
  static async listBackups(): Promise<BackupInfo[]> {
    try {
      await this.ensureBackupDir();

      const files = await fs.readdir(BACKUP_DIR);
      const backups: BackupInfo[] = [];

      for (const filename of files) {
        if (filename.endsWith('.db') && this.isValidBackupFilename(filename)) {
          const backupPath = path.join(BACKUP_DIR, filename);
          const stats = await fs.stat(backupPath);

          // Load metadata
          const metadata = await this.loadMetadata(backupPath);

          backups.push({
            id: filename.replace('.db', ''),
            filename,
            path: backupPath,
            size: stats.size,
            createdAt: stats.mtime,
            createdBy: metadata?.createdBy,
            schemaVersion: metadata?.schemaVersion
          });
        }
      }

      // Sort by creation date (newest first)
      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      throw new Error(`Failed to list backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get backup by ID
   */
  static async getBackup(backupId: string): Promise<BackupInfo | null> {
    try {
      const backups = await this.listBackups();
      return backups.find((b) => b.id === backupId) || null;
    } catch (error) {
      console.error('❌ Failed to get backup:', error);
      return null;
    }
  }

  /**
   * Restore database from backup
   * Creates a safety backup before restoration
   */
  static async restoreBackup(backupId: string, restoredBy?: string, skipValidation: boolean = false): Promise<void> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      if (!existsSync(backup.path)) {
        throw new Error('Backup file not found on disk');
      }

      // Validate schema compatibility
      if (!skipValidation) {
        console.log('🔍 Validating backup schema compatibility...');
        const validation = await this.validateBackupSchema(backup.path);

        if (!validation.compatible) {
          const errorMessage = [
            'Schema validation failed:',
            ...validation.errors,
            '',
            'To force restore despite errors, use skipValidation=true'
          ].join('\n');
          throw new Error(errorMessage);
        }

        if (validation.warnings.length > 0) {
          console.warn('⚠️  Schema validation warnings:');
          validation.warnings.forEach(w => console.warn(`   - ${w}`));
        } else {
          console.log('✅ Schema validation passed');
        }
      } else {
        console.warn('⚠️  Skipping schema validation (forced restore)');
      }

      // Create safety backup of current database
      console.log('📦 Creating safety backup before restoration...');
      const safetyBackup = await this.createBackup(`system-pre-restore-${restoredBy || 'unknown'}`);
      console.log(`✅ Safety backup created: ${safetyBackup.filename}`);

      // Restore from backup
      console.log(`🔄 Restoring database from backup: ${backup.filename}`);
      await fs.copyFile(backup.path, DATABASE_PATH);

      console.log(`✅ Database restored successfully from ${backup.filename}`);
      console.log(`💾 Safety backup available at: ${safetyBackup.filename}`);
    } catch (error) {
      console.error('❌ Database restoration failed:', error);
      throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a backup file
   */
  static async deleteBackup(backupId: string): Promise<void> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      // Prevent deletion of database file (only backups)
      if (backup.path === DATABASE_PATH) {
        throw new Error('Cannot delete active database');
      }

      // Delete backup file
      await fs.unlink(backup.path);

      // Delete metadata file if exists
      const metadataPath = this.getMetadataPath(backup.path);
      if (existsSync(metadataPath)) {
        await fs.unlink(metadataPath);
      }

      console.log(`✅ Backup deleted: ${backup.filename}`);
    } catch (error) {
      console.error('❌ Failed to delete backup:', error);
      throw new Error(`Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download backup file (get file buffer)
   */
  static async downloadBackup(backupId: string): Promise<Buffer> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      return await fs.readFile(backup.path);
    } catch (error) {
      console.error('❌ Failed to download backup:', error);
      throw new Error(`Failed to download backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload and restore backup from file
   */
  static async uploadBackup(fileBuffer: Buffer, originalName: string, uploadedBy?: string): Promise<BackupInfo> {
    try {
      await this.ensureBackupDir();

      // Validate file extension
      if (!originalName.endsWith('.db')) {
        throw new Error('Invalid file type. Only .db files are allowed');
      }

      // Generate safe filename
      const filename = this.generateBackupFilename();
      const backupPath = path.join(BACKUP_DIR, filename);

      // Save uploaded file
      await fs.writeFile(backupPath, fileBuffer);

      // Try to detect schema version from the uploaded file
      let detectedVersion: string | undefined;
      try {
        const schemaInfo = await this.getSchemaInfo(backupPath);
        if (schemaInfo.tables.length > 0) {
          // File is readable and has tables
          detectedVersion = 'uploaded';
        }
      } catch (error) {
        console.warn('Could not detect schema from uploaded file');
      }

      // Save metadata
      await this.saveMetadata(backupPath, {
        createdBy: uploadedBy,
        schemaVersion: detectedVersion
      });

      // Get file stats
      const stats = await fs.stat(backupPath);

      const backupInfo: BackupInfo = {
        id: filename.replace('.db', ''),
        filename,
        path: backupPath,
        size: stats.size,
        createdAt: stats.mtime,
        createdBy: uploadedBy,
        schemaVersion: detectedVersion
      };

      console.log(`✅ Backup uploaded: ${filename} (${stats.size} bytes)`);
      return backupInfo;
    } catch (error) {
      console.error('❌ Failed to upload backup:', error);
      throw new Error(`Failed to upload backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up old backups, keeping only the specified number
   */
  static async cleanupOldBackups(keepCount: number = 10): Promise<number> {
    try {
      const backups = await this.listBackups();

      if (backups.length <= keepCount) {
        return 0;
      }

      // Delete oldest backups beyond keepCount
      const toDelete = backups.slice(keepCount);
      let deletedCount = 0;

      for (const backup of toDelete) {
        // Skip system-generated safety backups
        if (!backup.filename.includes('system-pre-restore')) {
          await this.deleteBackup(backup.id);
          deletedCount++;
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} old backups`);
      return deletedCount;
    } catch (error) {
      console.error('❌ Failed to cleanup old backups:', error);
      throw new Error(`Failed to cleanup backups: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get database file size
   */
  static async getDatabaseSize(): Promise<number> {
    try {
      if (!existsSync(DATABASE_PATH)) {
        return 0;
      }
      const stats = await fs.stat(DATABASE_PATH);
      return stats.size;
    } catch (error) {
      console.error('❌ Failed to get database size:', error);
      return 0;
    }
  }

  /**
   * Get total backup storage size
   */
  static async getBackupStorageSize(): Promise<number> {
    try {
      const backups = await this.listBackups();
      return backups.reduce((total, backup) => total + backup.size, 0);
    } catch (error) {
      console.error('❌ Failed to get backup storage size:', error);
      return 0;
    }
  }
}
