import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { DatabaseService } from '../services/databaseService';
import multer from 'multer';

const router = express.Router();

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.db')) {
      cb(null, true);
    } else {
      cb(new Error('Only .db files are allowed'));
    }
  },
});

/**
 * Middleware to check super admin role
 */
const requireSuperAdmin = (req: Request, res: Response, next: express.NextFunction) => {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Only super administrators can manage database backups',
    });
  }
  next();
};

/**
 * GET /api/database/info
 * Get database information (size, backup count, storage)
 */
router.get('/info', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const [databaseSize, backups, backupStorageSize] = await Promise.all([
      DatabaseService.getDatabaseSize(),
      DatabaseService.listBackups(),
      DatabaseService.getBackupStorageSize(),
    ]);

    res.json({
      database: {
        size: databaseSize,
        path: 'prisma/data/qb-pharma.db',
      },
      backups: {
        count: backups.length,
        totalSize: backupStorageSize,
        latest: backups[0] || null,
      },
    });
  } catch (error) {
    console.error('Failed to get database info:', error);
    res.status(500).json({
      error: 'Failed to get database information',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/database/backup
 * Create a new database backup
 */
router.post('/backup', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const createdBy = req.user?.username;
    const backup = await DatabaseService.createBackup(createdBy);

    res.status(201).json({
      message: 'Backup created successfully',
      backup: {
        id: backup.id,
        filename: backup.filename,
        size: backup.size,
        createdAt: backup.createdAt,
        createdBy: backup.createdBy,
      },
    });
  } catch (error) {
    console.error('Backup creation failed:', error);
    res.status(500).json({
      error: 'Failed to create backup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/database/backups
 * List all available backups
 */
router.get('/backups', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const backups = await DatabaseService.listBackups();

    res.json({
      backups: backups.map((backup) => ({
        id: backup.id,
        filename: backup.filename,
        size: backup.size,
        createdAt: backup.createdAt,
        createdBy: backup.createdBy,
      })),
      total: backups.length,
    });
  } catch (error) {
    console.error('Failed to list backups:', error);
    res.status(500).json({
      error: 'Failed to list backups',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/database/backups/:backupId
 * Get backup details
 */
router.get('/backups/:backupId', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    const backup = await DatabaseService.getBackup(backupId);

    if (!backup) {
      return res.status(404).json({
        error: 'Backup not found',
        message: `No backup found with ID: ${backupId}`,
      });
    }

    res.json({
      backup: {
        id: backup.id,
        filename: backup.filename,
        size: backup.size,
        createdAt: backup.createdAt,
        createdBy: backup.createdBy,
      },
    });
  } catch (error) {
    console.error('Failed to get backup:', error);
    res.status(500).json({
      error: 'Failed to get backup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/database/backups/:backupId/validate
 * Validate backup schema compatibility
 */
router.get('/backups/:backupId/validate', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    const backup = await DatabaseService.getBackup(backupId);

    if (!backup) {
      return res.status(404).json({
        error: 'Backup not found',
        message: `No backup found with ID: ${backupId}`,
      });
    }

    const validation = await DatabaseService.validateBackupSchema(backup.path);

    res.json({
      validation,
      backup: {
        id: backup.id,
        filename: backup.filename,
        schemaVersion: backup.schemaVersion
      }
    });
  } catch (error) {
    console.error('Failed to validate backup:', error);
    res.status(500).json({
      error: 'Failed to validate backup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/database/restore/:backupId
 * Restore database from backup
 */
router.post('/restore/:backupId', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    const { skipValidation } = req.body;
    const restoredBy = req.user?.username;

    await DatabaseService.restoreBackup(backupId, restoredBy, skipValidation || false);

    res.json({
      message: 'Database restored successfully',
      restoredFrom: backupId,
      restoredBy,
      note: 'A safety backup was created before restoration',
    });
  } catch (error) {
    console.error('Database restoration failed:', error);
    res.status(500).json({
      error: 'Failed to restore database',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * DELETE /api/database/backups/:backupId
 * Delete a backup
 */
router.delete('/backups/:backupId', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;

    await DatabaseService.deleteBackup(backupId);

    res.json({
      message: 'Backup deleted successfully',
      deletedBackupId: backupId,
    });
  } catch (error) {
    console.error('Failed to delete backup:', error);
    res.status(500).json({
      error: 'Failed to delete backup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/database/backups/:backupId/download
 * Download a backup file
 */
router.get('/backups/:backupId/download', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { backupId } = req.params;
    const backup = await DatabaseService.getBackup(backupId);

    if (!backup) {
      return res.status(404).json({
        error: 'Backup not found',
        message: `No backup found with ID: ${backupId}`,
      });
    }

    const fileBuffer = await DatabaseService.downloadBackup(backupId);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
    res.setHeader('Content-Length', fileBuffer.length);

    res.send(fileBuffer);
  } catch (error) {
    console.error('Failed to download backup:', error);
    res.status(500).json({
      error: 'Failed to download backup',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/database/backups/upload
 * Upload and save a backup file
 */
router.post(
  '/backups/upload',
  authenticateToken,
  requireSuperAdmin,
  upload.single('backup'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please provide a .db file to upload',
        });
      }

      const uploadedBy = req.user?.username;
      const backup = await DatabaseService.uploadBackup(req.file.buffer, req.file.originalname, uploadedBy);

      res.status(201).json({
        message: 'Backup uploaded successfully',
        backup: {
          id: backup.id,
          filename: backup.filename,
          size: backup.size,
          createdAt: backup.createdAt,
          createdBy: backup.createdBy,
        },
      });
    } catch (error) {
      console.error('Failed to upload backup:', error);
      res.status(500).json({
        error: 'Failed to upload backup',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/database/cleanup
 * Clean up old backups (keep last N backups)
 */
router.post('/cleanup', authenticateToken, requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { keepCount = 10 } = req.body;

    if (typeof keepCount !== 'number' || keepCount < 1) {
      return res.status(400).json({
        error: 'Invalid keepCount',
        message: 'keepCount must be a positive number',
      });
    }

    const deletedCount = await DatabaseService.cleanupOldBackups(keepCount);

    res.json({
      message: `Cleanup completed. ${deletedCount} old backup(s) deleted`,
      deletedCount,
      kept: keepCount,
    });
  } catch (error) {
    console.error('Failed to cleanup backups:', error);
    res.status(500).json({
      error: 'Failed to cleanup backups',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
