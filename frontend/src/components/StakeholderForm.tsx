import React, { useState } from 'react';
import { 
  PlusIcon, 
  XMarkIcon,
  UserGroupIcon,
  UsersIcon,
  TruckIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  PercentBadgeIcon
} from '@heroicons/react/24/outline';
import type { StakeholderType } from '../types';
import clsx from 'clsx';

interface StakeholderFormData {
  name: string;
  email: string;
  phone: string;
  // Partner specific
  ownershipPercentage?: string;
  // Doctor specific
  consultationFee?: string;
  commissionRate?: string;
  // Employee specific
  salary?: string;
  department?: string;
  // Distributor specific
  contactPerson?: string;
  address?: string;
  creditBalance?: string;
}

interface StakeholderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StakeholderFormData) => void;
  type: StakeholderType | 'partner';
  editData?: any;
}

const StakeholderForm: React.FC<StakeholderFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  type,
  editData 
}) => {
  const [formData, setFormData] = useState<StakeholderFormData>({
    name: editData?.name || '',
    email: editData?.email || '',
    phone: editData?.phone || '',
    ownershipPercentage: editData?.ownershipPercentage?.toString() || '',
    consultationFee: editData?.consultationFee?.toString() || '',
    commissionRate: editData?.commissionRate?.toString() || '',
    salary: editData?.salary?.toString() || '',
    department: editData?.department || '',
    contactPerson: editData?.contactPerson || '',
    address: editData?.address || '',
    creditBalance: editData?.creditBalance?.toString() || ''
  });

  const getFormConfig = () => {
    switch (type) {
      case 'partner':
        return {
          title: 'Business Partner',
          icon: BuildingOfficeIcon,
          fields: [
            { key: 'name', label: 'Full Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'phone', label: 'Phone', type: 'tel', required: true },
            { key: 'ownershipPercentage', label: 'Ownership Percentage', type: 'number', required: true, min: 0, max: 100 }
          ]
        };
      case 'doctor':
        return {
          title: 'Doctor',
          icon: UserGroupIcon,
          fields: [
            { key: 'name', label: 'Doctor Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'phone', label: 'Phone', type: 'tel', required: true },
            { key: 'consultationFee', label: 'Consultation Fee (PKR)', type: 'number', required: true, min: 0 },
            { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number', required: true, min: 0, max: 100 }
          ]
        };
      case 'employee':
        return {
          title: 'Employee',
          icon: UsersIcon,
          fields: [
            { key: 'name', label: 'Employee Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'phone', label: 'Phone', type: 'tel', required: true },
            { key: 'department', label: 'Department', type: 'select', required: true, 
              options: ['Pharmacy', 'Reception', 'Assistant', 'Accounts', 'Cleaning', 'Security'] },
            { key: 'salary', label: 'Monthly Salary (PKR)', type: 'number', required: true, min: 0 }
          ]
        };
      case 'sales_partner':
        return {
          title: 'Sales Partner',
          icon: UsersIcon,
          fields: [
            { key: 'name', label: 'Company Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'phone', label: 'Phone', type: 'tel', required: true },
            { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number', required: true, min: 0, max: 100 }
          ]
        };
      case 'distributor':
        return {
          title: 'Distributor',
          icon: TruckIcon,
          fields: [
            { key: 'name', label: 'Company Name', type: 'text', required: true },
            { key: 'contactPerson', label: 'Contact Person', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true },
            { key: 'phone', label: 'Phone', type: 'tel', required: true },
            { key: 'address', label: 'Address', type: 'textarea', required: true },
            { key: 'creditBalance', label: 'Initial Credit Balance (PKR)', type: 'number', required: false, min: 0 }
          ]
        };
      default:
        return { title: '', icon: BuildingOfficeIcon, fields: [] };
    }
  };

  const config = getFormConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      ownershipPercentage: '',
      consultationFee: '',
      commissionRate: '',
      salary: '',
      department: '',
      contactPerson: '',
      address: '',
      creditBalance: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <config.icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {editData ? 'Edit' : 'Add'} {config.title}
              </h2>
              <p className="text-xs text-gray-400">
                {editData ? 'Update' : 'Create new'} {config.title.toLowerCase()} information
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 max-h-[calc(90vh-140px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.fields.map(field => (
                <div 
                  key={field.key} 
                  className={field.type === 'textarea' || field.key === 'address' ? 'md:col-span-2' : ''}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {field.label} {field.required && <span className="text-red-400">*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <select
                      value={(formData as any)[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {(field as any).options?.map((option: string) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={(formData as any)[field.key] || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                      rows={3}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  ) : (
                    <div className="relative">
                      {field.key === 'email' && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      {field.key === 'phone' && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <PhoneIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      {(field.key.includes('Fee') || field.key.includes('salary') || field.key.includes('Balance')) && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      {field.key.includes('Rate') || field.key.includes('Percentage') && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <span className="text-gray-400 text-sm">%</span>
                        </div>
                      )}
                      <input
                        type={field.type}
                        value={(formData as any)[field.key] || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className={clsx(
                          "w-full py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors",
                          (field.key === 'email' || field.key === 'phone' || field.key.includes('Fee') || field.key.includes('salary') || field.key.includes('Balance')) ? 'pl-10 pr-3' : 'px-3',
                          (field.key.includes('Rate') || field.key.includes('Percentage')) ? 'pr-10' : ''
                        )}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        required={field.required}
                        min={(field as any).min}
                        max={(field as any).max}
                        step={field.type === 'number' ? '0.01' : undefined}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-3 border-t border-gray-700 bg-gray-750">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              {editData ? 'Update' : 'Add'} {config.title}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StakeholderForm;