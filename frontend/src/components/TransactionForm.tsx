import React, { useState, useEffect } from 'react';
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
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
// import { useToast } from '../contexts/ToastContext';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import clsx from 'clsx';

interface TransactionFormData {
  category: TransactionCategory;
  stakeholderId?: string;
  stakeholderType?: StakeholderType;
  amount: string;
  description: string;
  billNo?: string;
  date: string;
}

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { doctors, businessPartners, employees, distributors, patients } = useStakeholders();
  const { transactions } = useTransactions();
  // const { showError } = useToast();
  const [formData, setFormData] = useState<TransactionFormData>({
    category: 'pharmacy_sale',
    amount: '',
    description: '',
    billNo: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Track if user has made any changes to the form
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData] = useState<TransactionFormData>({
    category: 'pharmacy_sale',
    amount: '',
    description: '',
    billNo: '',
    date: new Date().toISOString().split('T')[0]
  });

  const transactionTypes = TRANSACTION_TYPES;

  const getStakeholders = (type: StakeholderType) => {
    switch (type) {
      case 'doctor': return doctors;
      case 'business_partner': return businessPartners;
      case 'employee': return employees;
      case 'distributor': return distributors;
      case 'patient': return patients.filter(p => p.isActive); // Only active patients
      default: return [];
    }
  };

  const selectedType = transactionTypes.find(t => t.id === formData.category);
  const stakeholders = selectedType?.stakeholderType ? getStakeholders(selectedType.stakeholderType as StakeholderType) : [];

  // Check if daily entry already exists for specific transaction types
  const checkDailyEntryLimit = (category: TransactionCategory, date: string): boolean => {
    const dailyLimitCategories = ['pharmacy_sale', 'consultation_fee'];
    
    if (!dailyLimitCategories.includes(category)) {
      return true; // No limit for other categories
    }

    const selectedDate = new Date(date).toDateString();
    const existingEntry = transactions.find(t => 
      t.category === category && 
      t.date.toDateString() === selectedDate
    );

    return !existingEntry; // Return true if no existing entry (allowed), false if entry exists (not allowed)
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedType?.requiresStakeholder && !formData.stakeholderId) {
      alert('Missing Stakeholder: Please select a stakeholder for this transaction type.');
      return;
    }
    if (!formData.amount || !formData.description) {
      alert('Missing Required Fields: Please fill in all required fields including amount and description.');
      return;
    }

    // Check daily entry limit for specific transaction types
    if (!checkDailyEntryLimit(formData.category, formData.date)) {
      const categoryLabel = selectedType?.label || formData.category;
      const selectedDate = new Date(formData.date).toLocaleDateString();
      alert(`Daily Limit Exceeded: Only one ${categoryLabel} entry is allowed per day. An entry already exists for ${selectedDate}.`);
      return;
    }

    onSubmit({
      ...formData,
      stakeholderType: selectedType?.stakeholderType as StakeholderType
    });
    
    // Reset form after successful submission
    resetForm();
  };

  const handleCategoryChange = (category: TransactionCategory) => {
    setFormData(prev => ({
      ...prev,
      category,
      stakeholderId: undefined,
      stakeholderType: undefined
    }));
  };

  // Check if form has unsaved changes
  useEffect(() => {
    const hasChanges = 
      formData.category !== initialFormData.category ||
      formData.amount !== initialFormData.amount ||
      formData.description !== initialFormData.description ||
      formData.billNo !== initialFormData.billNo ||
      formData.date !== initialFormData.date ||
      formData.stakeholderId !== initialFormData.stakeholderId;
    
    setHasUnsavedChanges(hasChanges);
  }, [formData, initialFormData]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, hasUnsavedChanges]);

  // Smart close handler with confirmation
  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (confirmClose) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      category: 'pharmacy_sale',
      amount: '',
      description: '',
      billNo: '',
      date: new Date().toISOString().split('T')[0]
    });
    setHasUnsavedChanges(false);
  };

  // Get daily entry status for current selection
  const dailyEntryExists = !checkDailyEntryLimit(formData.category, formData.date);
  const isDailyLimitCategory = ['pharmacy_sale', 'consultation_fee'].includes(formData.category);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-xl shadow-2xl">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-white">Add Transaction</h2>
          <button 
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            
            {/* Transaction Type with inline stakeholder */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Transaction Type</label>
                <div className="relative">
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    {selectedType?.id === 'pharmacy_sale' && <CurrencyDollarIcon className="h-3.5 w-3.5 text-gray-400" />}
                    {selectedType?.id === 'consultation_fee' && <UserGroupIcon className="h-3.5 w-3.5 text-gray-400" />}
                    {selectedType?.id === 'distributor_payment' && <TruckIcon className="h-3.5 w-3.5 text-gray-400" />}
                    {selectedType?.id === 'employee_payment' && <UsersIcon className="h-3.5 w-3.5 text-gray-400" />}
                    {selectedType?.id === 'sales_profit_distribution' && <BuildingOfficeIcon className="h-3.5 w-3.5 text-gray-400" />}
                    {!['pharmacy_sale', 'consultation_fee', 'distributor_payment', 'employee_payment', 'sales_profit_distribution'].includes(selectedType?.id || '') && <CreditCardIcon className="h-3.5 w-3.5 text-gray-400" />}
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value as TransactionCategory)}
                    className="w-full pl-8 pr-8 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs appearance-none"
                    required
                  >
                    {transactionTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Inline Stakeholder Selection */}
              {selectedType?.requiresStakeholder && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    {selectedType.stakeholderType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                  <select
                    value={formData.stakeholderId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, stakeholderId: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    required
                  >
                    <option value="">Select {selectedType.stakeholderType?.replace('_', ' ')}</option>
                    {stakeholders.map(stakeholder => (
                      <option key={stakeholder.id} value={stakeholder.id}>
                        {stakeholder.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Inline Validation Message */}
            {isDailyLimitCategory && dailyEntryExists && (
              <div className="bg-amber-900/30 border border-amber-600/50 rounded p-2">
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-amber-300">
                    {selectedType?.label} entry exists for {new Date(formData.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Amount, Date, and Bill No in 3 columns */}
            <div className={clsx(
              "grid gap-3",
              formData.category === 'distributor_credit_purchase' ? "grid-cols-3" : "grid-cols-2"
            )}>
              {/* Amount */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">₹</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-6 pr-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                  required
                />
              </div>

              {/* Bill No. - Only for Distributor Credit Purchase */}
              {formData.category === 'distributor_credit_purchase' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Bill No.</label>
                  <input
                    type="text"
                    value={formData.billNo || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, billNo: e.target.value }))}
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    placeholder="Bill #"
                  />
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none text-xs"
                rows={2}
                placeholder="Transaction details..."
                required
              />
            </div>
          </form>
        </div>

        {/* Compact Action Buttons */}
        <div className="px-4 py-2.5 border-t border-gray-700 bg-gray-750">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isDailyLimitCategory && dailyEntryExists}
              className={clsx(
                "flex-1 px-3 py-1.5 rounded transition-colors text-xs font-medium",
                isDailyLimitCategory && dailyEntryExists
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isDailyLimitCategory && dailyEntryExists ? "Entry Exists" : "Add Transaction"}
            </button>
          </div>
          {/* Keyboard shortcut hint */}
          <div className="mt-1.5 text-center">
            <span className="text-xs text-gray-500">
              Press Ctrl+Enter to add • ESC to close
              {hasUnsavedChanges && <span className="text-amber-400"> • Unsaved changes</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;