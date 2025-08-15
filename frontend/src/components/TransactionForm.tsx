import React, { useState } from 'react';
import { 
  PlusIcon, 
  XMarkIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TruckIcon,
  UsersIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import type { TransactionCategory, StakeholderType } from '../types';
import { mockDoctors, mockBusinessPartners, mockEmployees, mockDistributors } from '../data/mockData';
import clsx from 'clsx';

interface TransactionFormData {
  category: TransactionCategory;
  stakeholderId?: string;
  stakeholderType?: StakeholderType;
  amount: string;
  description: string;
  date: string;
}

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<TransactionFormData>({
    category: 'pharmacy_sale',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const transactionTypes = [
    {
      id: 'pharmacy_sale',
      label: 'Pharmacy Sale',
      icon: CurrencyDollarIcon,
      color: 'text-green-400',
      requiresStakeholder: false,
      description: 'Daily pharmacy revenue from medicine sales'
    },
    {
      id: 'consultation_fee',
      label: 'Consultation Fee',
      icon: UserGroupIcon,
      color: 'text-blue-400',
      requiresStakeholder: true,
      stakeholderType: 'doctor',
      description: 'Doctor consultation fees from patients'
    },
    {
      id: 'distributor_payment',
      label: 'Distributor Payment',
      icon: TruckIcon,
      color: 'text-orange-400',
      requiresStakeholder: true,
      stakeholderType: 'distributor',
      description: 'Payments made to medicine distributors'
    },
    {
      id: 'doctor_expense',
      label: 'Doctor Expense',
      icon: UserGroupIcon,
      color: 'text-red-400',
      requiresStakeholder: true,
      stakeholderType: 'doctor',
      description: 'Doctor-related expenses and costs'
    },
    {
      id: 'business_partner_payment',
      label: 'Sales Partner Payment',
      icon: UsersIcon,
      color: 'text-purple-400',
      requiresStakeholder: true,
      stakeholderType: 'business_partner',
      description: 'Commission payments to sales partners'
    },
    {
      id: 'employee_payment',
      label: 'Employee Payment',
      icon: UsersIcon,
      color: 'text-cyan-400',
      requiresStakeholder: true,
      stakeholderType: 'employee',
      description: 'Salary and bonus payments to employees'
    },
    {
      id: 'clinic_expense',
      label: 'Clinic Expense',
      icon: BuildingOfficeIcon,
      color: 'text-yellow-400',
      requiresStakeholder: false,
      description: 'General clinic operational expenses'
    }
  ];

  const getStakeholders = (type: StakeholderType) => {
    switch (type) {
      case 'doctor': return mockDoctors;
      case 'business_partner': return mockBusinessPartners;
      case 'employee': return mockEmployees;
      case 'distributor': return mockDistributors;
      default: return [];
    }
  };

  const selectedType = transactionTypes.find(t => t.id === formData.category);
  const stakeholders = selectedType?.stakeholderType ? getStakeholders(selectedType.stakeholderType as StakeholderType) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType?.requiresStakeholder && !formData.stakeholderId) {
      alert('Please select a stakeholder');
      return;
    }
    if (!formData.amount || !formData.description) {
      alert('Please fill all required fields');
      return;
    }

    onSubmit({
      ...formData,
      stakeholderType: selectedType?.stakeholderType as StakeholderType
    });
    
    // Reset form
    setFormData({
      category: 'pharmacy_sale',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleCategoryChange = (category: TransactionCategory) => {
    setFormData(prev => ({
      ...prev,
      category,
      stakeholderId: undefined,
      stakeholderType: undefined
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <PlusIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Add Transaction</h2>
              <p className="text-xs text-gray-400">Record new financial transaction</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value as TransactionCategory)}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                  required
                >
                  {transactionTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Stakeholder Selection */}
            {selectedType?.requiresStakeholder && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {selectedType.stakeholderType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <select
                  value={formData.stakeholderId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, stakeholderId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Choose {selectedType.stakeholderType?.replace('_', ' ')}</option>
                  {stakeholders.map(stakeholder => (
                    <option key={stakeholder.id} value={stakeholder.id}>
                      {stakeholder.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (INR)</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                rows={3}
                placeholder="Enter transaction details..."
                required
              />
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
              Add Transaction
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;