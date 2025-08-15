import React, { useState } from 'react';
import {
  Cog6ToothIcon,
  BuildingOfficeIcon,
  UsersIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import DepartmentManagement from './DepartmentManagement';
import clsx from 'clsx';

const ConfigurationManagement: React.FC = () => {
  const [activeConfigTab, setActiveConfigTab] = useState<'departments' | 'stakeholder_types' | 'transaction_types' | 'system_settings'>('departments');

  const configTabs = [
    { id: 'departments', label: 'Departments', icon: BuildingOfficeIcon, color: 'text-blue-400' },
    { id: 'stakeholder_types', label: 'Stakeholder Types', icon: UsersIcon, color: 'text-green-400' },
    { id: 'transaction_types', label: 'Transaction Types', icon: CurrencyDollarIcon, color: 'text-purple-400' },
    { id: 'system_settings', label: 'System Settings', icon: Cog6ToothIcon, color: 'text-orange-400' },
  ];

  const renderPlaceholder = (title: string, description: string) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-gray-700 rounded-full">
          <Cog6ToothIcon className="h-8 w-8 text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm max-w-md">{description}</p>
        </div>
        <div className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
          Coming Soon
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">System Configuration</h2>
          <p className="text-gray-400 text-sm">Manage system settings, types, and configurations</p>
        </div>
      </div>

      {/* Configuration Tabs */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-1">
          {configTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveConfigTab(tab.id as any)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeConfigTab === tab.id
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                )}
              >
                <Icon className={clsx('h-4 w-4', activeConfigTab === tab.id ? tab.color : 'text-gray-500')} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Configuration Content */}
      <div className="space-y-6">
        {activeConfigTab === 'departments' && <DepartmentManagement />}
        
        {activeConfigTab === 'stakeholder_types' && renderPlaceholder(
          'Stakeholder Types Configuration',
          'Configure custom stakeholder types beyond the default doctors, employees, business partners, distributors, and patients. Add custom fields and validation rules.'
        )}
        
        {activeConfigTab === 'transaction_types' && renderPlaceholder(
          'Transaction Types Configuration', 
          'Configure custom transaction categories and types. Set up validation rules, default values, and stakeholder associations for different transaction types.'
        )}
        
        {activeConfigTab === 'system_settings' && renderPlaceholder(
          'System Settings',
          'Configure global system settings including currency preferences, tax settings, business information, and operational parameters.'
        )}
      </div>
    </div>
  );
};

export default ConfigurationManagement;