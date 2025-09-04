import React, { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw, AlertCircle, CheckCircle, Edit3 } from 'lucide-react';
import { ConfigurationService } from '../utils/paymentEstimationUtils';

interface Configuration {
  id: string;
  category: string;
  key: string;
  value: string;
  dataType: 'number' | 'string' | 'boolean' | 'json';
  description?: string;
  isEditable: boolean;
  updatedAt: string;
  parsedValue: any;
}

interface ConfigurationUpdate {
  key: string;
  value: string;
  originalValue: string;
  dataType: string;
}

export default function SystemConfigurationManager() {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [filteredConfigurations, setFilteredConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, ConfigurationUpdate>>({});

  const configService = ConfigurationService.getInstance();

  useEffect(() => {
    fetchConfigurations();
  }, []);

  useEffect(() => {
    filterConfigurations();
  }, [configurations, selectedCategory]);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/configurations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }

      const data = await response.json();
      setConfigurations(data.configurations || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(data.configurations.map((c: Configuration) => c.category))];
      setCategories(uniqueCategories);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  };

  const filterConfigurations = () => {
    if (selectedCategory === 'all') {
      setFilteredConfigurations(configurations);
    } else {
      setFilteredConfigurations(configurations.filter(config => config.category === selectedCategory));
    }
  };

  const handleValueChange = (configId: string, key: string, newValue: string, originalValue: string, dataType: string) => {
    setEditingValues(prev => ({
      ...prev,
      [configId]: newValue
    }));

    if (newValue !== originalValue) {
      setPendingUpdates(prev => ({
        ...prev,
        [configId]: { key, value: newValue, originalValue, dataType }
      }));
    } else {
      setPendingUpdates(prev => {
        const { [configId]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateValue = (value: string, dataType: string): boolean => {
    switch (dataType) {
      case 'number':
        return !isNaN(parseFloat(value)) && isFinite(parseFloat(value));
      case 'boolean':
        return ['true', 'false'].includes(value.toLowerCase());
      case 'json':
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      default:
        return true;
    }
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updates = Object.entries(pendingUpdates);
      if (updates.length === 0) {
        setSuccess('No changes to save');
        return;
      }

      // Validate all values first
      for (const [configId, update] of updates) {
        if (!validateValue(update.value, update.dataType)) {
          throw new Error(`Invalid value for ${update.key}: ${update.value} (expected ${update.dataType})`);
        }
      }

      // Save all configurations
      for (const [configId, update] of updates) {
        const config = configurations.find(c => c.id === configId);
        if (config) {
          await configService.updateConfiguration(config.category, config.key, update.value);
        }
      }

      // Clear pending updates and refresh
      setPendingUpdates({});
      setEditingValues({});
      await fetchConfigurations();
      
      setSuccess(`Successfully updated ${updates.length} configuration(s)`);
      
      // Auto-clear success message
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save configurations');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setPendingUpdates({});
    setEditingValues({});
    setError(null);
    setSuccess(null);
  };

  const formatValue = (value: any, dataType: string): string => {
    if (dataType === 'json' && typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getCategoryDisplayName = (category: string): string => {
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <span className="ml-3 text-gray-300">Loading configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">System Configuration Manager</h2>
        </div>
        <div className="flex items-center space-x-3">
          {Object.keys(pendingUpdates).length > 0 && (
            <>
              <button
                onClick={resetChanges}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-green-300">{success}</span>
        </div>
      )}

      {/* Pending Changes Indicator */}
      {Object.keys(pendingUpdates).length > 0 && (
        <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-500 rounded-lg">
          <div className="flex items-center space-x-2">
            <Edit3 className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-300 font-medium">
              {Object.keys(pendingUpdates).length} unsaved change(s)
            </span>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Filter by Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full max-w-xs px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {getCategoryDisplayName(category)}
            </option>
          ))}
        </select>
      </div>

      {/* Configurations Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700">
            <tr>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Setting</th>
              <th className="px-6 py-3">Value</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {filteredConfigurations.map((config) => {
              const isEditing = config.id in editingValues;
              const currentValue = isEditing ? editingValues[config.id] : config.value;
              const hasChanges = config.id in pendingUpdates;
              const isValid = validateValue(currentValue, config.dataType);

              return (
                <tr 
                  key={config.id} 
                  className={`border-b border-gray-700 ${hasChanges ? 'bg-blue-900/20' : 'hover:bg-gray-700/50'}`}
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-600 text-gray-300 rounded">
                      {getCategoryDisplayName(config.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {config.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4">
                    {config.isEditable ? (
                      <div className="flex items-center space-x-2">
                        {config.dataType === 'boolean' ? (
                          <select
                            value={currentValue}
                            onChange={(e) => handleValueChange(config.id, config.key, e.target.value, config.value, config.dataType)}
                            className={`px-3 py-1 bg-gray-700 border rounded text-white focus:outline-none focus:ring-2 ${
                              isValid ? 'border-gray-600 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                            }`}
                          >
                            <option value="true">True</option>
                            <option value="false">False</option>
                          </select>
                        ) : (
                          <input
                            type={config.dataType === 'number' ? 'number' : 'text'}
                            value={currentValue}
                            onChange={(e) => handleValueChange(config.id, config.key, e.target.value, config.value, config.dataType)}
                            className={`px-3 py-1 bg-gray-700 border rounded text-white focus:outline-none focus:ring-2 ${
                              isValid ? 'border-gray-600 focus:ring-blue-500' : 'border-red-500 focus:ring-red-500'
                            }`}
                            step={config.dataType === 'number' ? 'any' : undefined}
                          />
                        )}
                        {hasChanges && (
                          <span className="text-blue-400 text-xs">•</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        {formatValue(config.parsedValue, config.dataType)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      config.dataType === 'number' ? 'bg-blue-600 text-blue-100' :
                      config.dataType === 'boolean' ? 'bg-green-600 text-green-100' :
                      config.dataType === 'json' ? 'bg-purple-600 text-purple-100' :
                      'bg-gray-600 text-gray-100'
                    }`}>
                      {config.dataType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 max-w-xs truncate">
                    {config.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(config.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredConfigurations.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No configurations found for the selected category.
        </div>
      )}
    </div>
  );
}