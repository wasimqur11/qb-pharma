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
  PercentBadgeIcon,
  CalendarIcon
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
  initialBalanceDate?: string;
}

interface StakeholderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StakeholderFormData) => void;
  type: StakeholderType | 'partner';
  editData?: any;
  existingStakeholders?: any[];
}

const StakeholderForm: React.FC<StakeholderFormProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  type,
  editData,
  existingStakeholders = []
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
    creditBalance: editData?.creditBalance?.toString() || '',
    initialBalanceDate: editData?.initialBalanceDate || ''
  });

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateIndianMobile = (phone: string): boolean => {
    // Remove all spaces, hyphens, and plus signs for validation
    const cleanPhone = phone.replace(/[\s\-\+]/g, '');
    
    // Indian mobile number patterns:
    // 1. 10 digits starting with 6,7,8,9 (without country code)
    // 2. 91 followed by 10 digits starting with 6,7,8,9 (with country code)
    const mobileRegex = /^(?:91)?[6-9]\d{9}$/;
    
    return mobileRegex.test(cleanPhone);
  };

  const formatIndianMobile = (phone: string): string => {
    // Remove all non-numeric characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // If starts with +91, format as +91 XXXXX XXXXX
    if (cleaned.startsWith('+91') && cleaned.length === 13) {
      return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
    }
    // If starts with 91, format as +91 XXXXX XXXXX
    else if (cleaned.startsWith('91') && cleaned.length === 12) {
      return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    // If 10 digits, format as +91 XXXXX XXXXX
    else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    
    return phone; // Return as-is if doesn't match patterns
  };

  const getFormConfig = () => {
    switch (type) {
      case 'partner':
        return {
          title: 'Business Partner',
          icon: BuildingOfficeIcon,
          fields: [
            { key: 'name', label: 'Full Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'partner@example.com' },
            { key: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '9876543210 or +91 98765 43210' },
            { key: 'ownershipPercentage', label: 'Ownership Percentage', type: 'number', required: true, min: 0, max: 100 }
          ]
        };
      case 'doctor':
        return {
          title: 'Doctor',
          icon: UserGroupIcon,
          fields: [
            { key: 'name', label: 'Doctor Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'doctor@clinic.com' },
            { key: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '9876543210 or +91 98765 43210' },
            { key: 'consultationFee', label: 'Consultation Fee (INR)', type: 'number', required: true, min: 0 },
            { key: 'commissionRate', label: 'Commission Rate (%)', type: 'number', required: true, min: 0, max: 100 }
          ]
        };
      case 'employee':
        return {
          title: 'Employee',
          icon: UsersIcon,
          fields: [
            { key: 'name', label: 'Employee Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'employee@qbpharma.com' },
            { key: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '9876543210 or +91 98765 43210' },
            { key: 'department', label: 'Department', type: 'select', required: true, 
              options: ['Pharmacy', 'Reception', 'Assistant', 'Accounts', 'Cleaning', 'Security'] },
            { key: 'salary', label: 'Monthly Salary (INR)', type: 'number', required: true, min: 0 }
          ]
        };
      case 'business_partner':
        return {
          title: 'Business Partner',
          icon: UsersIcon,
          fields: [
            { key: 'name', label: 'Partner Name', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'partner@business.com' },
            { key: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '9876543210 or +91 98765 43210' },
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
            { key: 'email', label: 'Email', type: 'email', required: true, placeholder: 'distributor@company.com' },
            { key: 'phone', label: 'Phone', type: 'tel', required: true, placeholder: '9876543210 or +91 98765 43210' },
            { key: 'address', label: 'Address', type: 'textarea', required: true },
            { key: 'creditBalance', label: 'Initial Credit Balance (INR)', type: 'number', required: false, min: 0, placeholder: 'Optional - for existing balance' },
            { key: 'initialBalanceDate', label: 'Balance As Of Date', type: 'date', required: false, placeholder: 'Optional - when balance was recorded' }
          ]
        };
      default:
        return { title: '', icon: BuildingOfficeIcon, fields: [] };
    }
  };

  const config = getFormConfig();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check all required fields are filled
    const requiredFields = config.fields.filter(field => field.required);
    const emptyRequiredFields = requiredFields.filter(field => {
      const value = (formData as any)[field.key];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    
    if (emptyRequiredFields.length > 0) {
      const fieldNames = emptyRequiredFields.map(field => field.label).join(', ');
      alert(`Please fill in all required fields: ${fieldNames}`);
      return;
    }
    
    // Email validation
    if (formData.email && !validateEmail(formData.email)) {
      alert('Please enter a valid email address (e.g., user@example.com)');
      return;
    }
    
    // Phone validation
    if (formData.phone && !validateIndianMobile(formData.phone)) {
      alert('Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)\nExample: 9876543210 or +91 98765 43210');
      return;
    }
    
    // Conditional validation for distributor: if credit balance is entered, date is required
    if (type === 'distributor' && formData.creditBalance && !formData.initialBalanceDate) {
      alert('Balance As Of Date is required when Initial Credit Balance is entered');
      return;
    }
    
    // Duplicate validation - check for existing name and email
    const nameExists = existingStakeholders.some(stakeholder => 
      stakeholder.name.toLowerCase().trim() === formData.name.toLowerCase().trim() && 
      (!editData || stakeholder.id !== editData.id)
    );
    
    const emailExists = existingStakeholders.some(stakeholder => 
      stakeholder.email.toLowerCase().trim() === formData.email.toLowerCase().trim() && 
      (!editData || stakeholder.id !== editData.id)
    );
    
    if (nameExists) {
      alert(`A ${config.title.toLowerCase()} with the name "${formData.name}" already exists. Please use a different name.`);
      return;
    }
    
    if (emailExists) {
      alert(`A ${config.title.toLowerCase()} with the email "${formData.email}" already exists. Please use a different email.`);
      return;
    }
    
    // Format phone number before submitting
    const submissionData = {
      ...formData,
      phone: formData.phone ? formatIndianMobile(formData.phone) : formData.phone
    };
    
    onSubmit(submissionData);
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
      creditBalance: '',
      initialBalanceDate: ''
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
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="px-5 py-4 max-h-[calc(90vh-140px)] overflow-y-auto flex-1">
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
                      {field.type === 'date' && (
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
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
                          (field.key === 'email' || field.key === 'phone' || field.key.includes('Fee') || field.key.includes('salary') || field.key.includes('Balance') || field.type === 'date') ? 'pl-10 pr-3' : 'px-3',
                          (field.key.includes('Rate') || field.key.includes('Percentage')) ? 'pr-10' : ''
                        )}
                        placeholder={(field as any).placeholder || `Enter ${field.label.toLowerCase()}`}
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
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                {editData ? 'Update' : 'Add'} {config.title}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StakeholderForm;