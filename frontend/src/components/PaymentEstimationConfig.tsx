import React, { useState } from 'react';
import { SYSTEM_CONFIG } from '../constants/systemConfig';
import { Cog6ToothIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface PaymentEstimationConfigProps {
  onConfigChange?: (config: {
    profitPercentage: number;
    distributorPercentage: number;
    maxPaymentPercentage: number;
  }) => void;
}

const PaymentEstimationConfig: React.FC<PaymentEstimationConfigProps> = ({ onConfigChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState<{
    profitPercentage: number;
    distributorPercentage: number;
    maxPaymentPercentage: number;
  }>({
    profitPercentage: SYSTEM_CONFIG.PROFIT_ALLOCATION_PERCENTAGE,
    distributorPercentage: SYSTEM_CONFIG.DISTRIBUTOR_ALLOCATION_PERCENTAGE,
    maxPaymentPercentage: SYSTEM_CONFIG.MAX_DISTRIBUTOR_PAYMENT_PERCENTAGE
  });

  const [tempConfig, setTempConfig] = useState(config);

  const handleSave = () => {
    // Validate that profit + distributor = 100%
    if (tempConfig.profitPercentage + tempConfig.distributorPercentage !== 100) {
      alert('Profit percentage + Distributor percentage must equal 100%');
      return;
    }

    setConfig(tempConfig);
    setIsEditing(false);
    
    if (onConfigChange) {
      onConfigChange(tempConfig);
    }
    
    // In a real app, this would save to backend/localStorage
    alert('Configuration saved! Note: This is temporary and will reset on page refresh.');
  };

  const handleCancel = () => {
    setTempConfig(config);
    setIsEditing(false);
  };

  const currentConfig = isEditing ? tempConfig : config;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Cog6ToothIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-white">
              Payment Configuration
            </h3>
          </div>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Settings
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckIcon className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3">
            <label className="block text-sm font-medium text-yellow-400 mb-2">
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
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            ) : (
              <div className="text-2xl font-bold text-yellow-300">
                {currentConfig.profitPercentage}%
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              For profit and expenses
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3">
            <label className="block text-sm font-medium text-purple-400 mb-2">
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
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            ) : (
              <div className="text-2xl font-bold text-purple-300">
                {currentConfig.distributorPercentage}%
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              For distributor payments
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-600 rounded-lg p-3">
            <label className="block text-sm font-medium text-blue-400 mb-2">
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
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="text-2xl font-bold text-blue-300">
                {currentConfig.maxPaymentPercentage}%
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              Of distributor credit balance
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
            <div className="text-sm text-blue-300">
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