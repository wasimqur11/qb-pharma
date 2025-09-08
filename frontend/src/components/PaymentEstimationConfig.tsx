import React, { useState, useEffect } from 'react';
import { SYSTEM_CONFIG } from '../constants/systemConfig';
import { ConfigurationService } from '../utils/paymentEstimationUtils';
import { Cog6ToothIcon, CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface PaymentEstimationConfigProps {
  onConfigChange?: (config: {
    profitPercentage: number;
    distributorPercentage: number;
    maxPaymentPercentage: number;
  }) => void;
}

const PaymentEstimationConfig: React.FC<PaymentEstimationConfigProps> = ({ onConfigChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<{
    profitPercentage: number;
    distributorPercentage: number;
    maxPaymentPercentage: number;
  }>({
    profitPercentage: 25, // Default fallback
    distributorPercentage: 75, // Default fallback
    maxPaymentPercentage: 10 // Default fallback
  });

  const [tempConfig, setTempConfig] = useState(config);
  const configService = ConfigurationService.getInstance();

  // Load configuration from database on component mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      const dbConfig = await configService.getPaymentEstimationConfig();
      setConfig(dbConfig);
      setTempConfig(dbConfig);
    } catch (error) {
      console.error('Failed to load configuration:', error);
      setError('Failed to load configuration from database');
      // Keep using default/fallback values
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate that profit + distributor = 100%
    if (tempConfig.profitPercentage + tempConfig.distributorPercentage !== 100) {
      setError('Profit percentage + Distributor percentage must equal 100%');
      return;
    }

    if (tempConfig.maxPaymentPercentage < 1 || tempConfig.maxPaymentPercentage > 100) {
      setError('Maximum payment percentage must be between 1% and 100%');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Update each configuration in the database
      await configService.updateConfiguration('payment_estimation', 'profit_allocation_percentage', tempConfig.profitPercentage.toString());
      await configService.updateConfiguration('payment_estimation', 'distributor_allocation_percentage', tempConfig.distributorPercentage.toString());
      await configService.updateConfiguration('payment_estimation', 'max_distributor_payment_percentage', tempConfig.maxPaymentPercentage.toString());

      // Update local state
      setConfig(tempConfig);
      onConfigChange?.(tempConfig);
      setIsEditing(false);

    } catch (error) {
      console.error('Failed to save configuration:', error);
      setError('Failed to save configuration to database');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTempConfig(config);
    setIsEditing(false);
    setError(null);
  };

  const currentConfig = isEditing ? tempConfig : config;

  if (loading) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
        <div className="p-4">
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-300">Loading payment configuration...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg mb-4 sm:mb-6">
      <div className="p-3 sm:p-4">
        {/* Error Message */}
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-300 text-xs sm:text-sm">{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3">
          <div className="flex items-center">
            <Cog6ToothIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2" />
            <h3 className="text-base sm:text-lg font-semibold text-white">
              Payment Configuration
            </h3>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors self-start sm:self-auto"
            >
              Edit Settings
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
            <label className="block text-xs sm:text-sm font-medium text-yellow-400 mb-2">
              Profit Allocation %
            </label>
            {isEditing ? (
              <input
                type="number"
                min="0"
                max="100"
                value={tempConfig.profitPercentage}
                onChange={(e) => setTempConfig({
                  ...tempConfig,
                  profitPercentage: parseInt(e.target.value) || 0,
                  distributorPercentage: 100 - (parseInt(e.target.value) || 0)
                })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-sm"
              />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-yellow-300">
                {currentConfig.profitPercentage}%
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              For profit and expenses
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
            <label className="block text-xs sm:text-sm font-medium text-purple-400 mb-2">
              Distributor Allocation %
            </label>
            {isEditing ? (
              <input
                type="number"
                min="0"
                max="100"
                value={tempConfig.distributorPercentage}
                onChange={(e) => setTempConfig({
                  ...tempConfig,
                  distributorPercentage: parseInt(e.target.value) || 0,
                  profitPercentage: 100 - (parseInt(e.target.value) || 0)
                })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
              />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-purple-300">
                {currentConfig.distributorPercentage}%
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              For distributor payments
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3 sm:col-span-2 lg:col-span-1">
            <label className="block text-xs sm:text-sm font-medium text-blue-400 mb-2">
              Max Payment Cap %
            </label>
            {isEditing ? (
              <input
                type="number"
                min="1"
                max="100"
                value={tempConfig.maxPaymentPercentage}
                onChange={(e) => setTempConfig({
                  ...tempConfig,
                  maxPaymentPercentage: parseInt(e.target.value) || 0
                })}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-blue-300">
                {currentConfig.maxPaymentPercentage}%
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              Of distributor credit balance
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <div className="text-xs sm:text-sm text-blue-300">
              <strong>Note:</strong> Profit % + Distributor % must equal 100%. 
              The system will automatically adjust one when you change the other.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentEstimationConfig;