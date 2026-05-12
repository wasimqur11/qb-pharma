import React, { useState, useEffect } from 'react';
import { Database, Download, Trash2, Upload, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';

interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  createdBy?: string;
}

interface DatabaseInfo {
  database: {
    size: number;
    path: string;
  };
  backups: {
    count: number;
    totalSize: number;
    latest: BackupInfo | null;
  };
}

export const DatabaseManagement: React.FC = () => {
  const { user } = useAuth();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if user is super admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">Only super administrators can manage database backups.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [infoRes, backupsRes] = await Promise.all([
        apiClient.get<DatabaseInfo>('/api/database/info'),
        apiClient.get<{ backups: BackupInfo[] }>('/api/database/backups')
      ]);
      if (infoRes.success && infoRes.data) {
        setDbInfo(infoRes.data);
      }
      if (backupsRes.success && backupsRes.data) {
        setBackups(backupsRes.data.backups);
      }
    } catch (error) {
      console.error('Failed to load database info:', error);
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await apiClient.post('/api/database/backup', {});
      if (response.success) {
        setMessage({ type: 'success', text: 'Backup created successfully!' });
        await loadData();
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to create backup' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create backup' });
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will replace the current database. A safety backup will be created first.')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await apiClient.post(`/api/database/restore/${backupId}`, {});
      if (response.success) {
        setMessage({ type: 'success', text: 'Database restored successfully! Please refresh the page.' });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to restore backup' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to restore backup' });
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await apiClient.delete(`/api/database/backups/${backupId}`);
      if (response.success) {
        setMessage({ type: 'success', text: 'Backup deleted successfully!' });
        await loadData();
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to delete backup' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete backup' });
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async (backupId: string, filename: string) => {
    try {
      const response = await apiClient.get(`/api/database/backups/${backupId}/download`, {
        responseType: 'blob'
      });

      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to download backup' });
    }
  };

  const uploadBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.db')) {
      setMessage({ type: 'error', text: 'Please select a valid .db file' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('backup', file);

      const response = await apiClient.post('/api/database/backups/upload', formData);

      if (response.success) {
        setMessage({ type: 'success', text: 'Backup uploaded successfully!' });
        await loadData();
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to upload backup' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload backup' });
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="w-7 h-7" />
            Database Management
          </h1>
          <p className="text-gray-400 mt-1 text-sm">Backup and restore your database</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 border ${
          message.type === 'success'
            ? 'bg-green-900/30 text-green-300 border-green-600/50'
            : 'bg-red-900/30 text-red-300 border-red-600/50'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Database Info */}
      {dbInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors">
            <p className="text-gray-400 text-sm mb-1">Database Size</p>
            <p className="text-2xl font-bold text-white">{formatBytes(dbInfo.database.size)}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors">
            <p className="text-gray-400 text-sm mb-1">Total Backups</p>
            <p className="text-2xl font-bold text-white">{dbInfo.backups.count}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors">
            <p className="text-gray-400 text-sm mb-1">Backup Storage</p>
            <p className="text-2xl font-bold text-white">{formatBytes(dbInfo.backups.totalSize)}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={createBackup}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors font-medium text-sm"
        >
          <Database className="w-4 h-4" />
          Create Backup
        </button>

        <label className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors font-medium text-sm cursor-pointer">
          <Upload className="w-4 h-4" />
          Upload Backup
          <input
            type="file"
            accept=".db"
            onChange={uploadBackup}
            disabled={loading}
            className="hidden"
          />
        </label>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors font-medium text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Backups Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Available Backups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Filename</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created By</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No backups available. Create your first backup to get started.
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-white font-mono">{backup.filename}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{formatBytes(backup.size)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{backup.createdBy || 'Unknown'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => restoreBackup(backup.id)}
                          disabled={loading}
                          className="p-2 text-green-400 hover:bg-green-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Restore"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadBackup(backup.id, backup.filename)}
                          className="p-2 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBackup(backup.id)}
                          disabled={loading}
                          className="p-2 text-red-400 hover:bg-red-900/30 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagement;
