import React, { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  XMarkIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TruckIcon,
  UsersIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import type { Transaction, TransactionCategory, StakeholderType } from '../types';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
// import { useToast } from '../contexts/ToastContext';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import clsx from 'clsx';

interface EditTransactionFormProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSubmit: (transactionId: string, updatedData: Partial<Transaction>) => void;
}

const EditTransactionForm: React.FC<EditTransactionFormProps> = ({ 
  isOpen, 
  transaction, 
  onClose, 
  onSubmit 
}) => {
  const { doctors, businessPartners, employees, distributors, patients } = useStakeholders();
  const { transactions } = useTransactions();
  // const { showError } = useToast();
  
  const [formData, setFormData] = useState({
    category: '' as TransactionCategory,
    stakeholderId: '',
    stakeholderType: '' as StakeholderType,
    amount: '',
    description: '',
    billNo: '',
    date: ''
  });

  const [originalData, setOriginalData] = useState<Transaction | null>(null);

  const transactionTypes = TRANSACTION_TYPES;

  // Initialize form when transaction changes
  useEffect(() => {
    if (transaction) {
      setOriginalData(transaction);
      setFormData({
        category: transaction.category,
        stakeholderId: transaction.stakeholderId || '',
        stakeholderType: transaction.stakeholderType || '' as StakeholderType,
        amount: transaction.amount.toString(),
        description: transaction.description,
        billNo: (transaction as any).billNo || '',
        date: transaction.date.toISOString().split('T')[0]
      });
    }
  }, [transaction]);

  const getStakeholders = (type: StakeholderType) => {
    switch (type) {
      case 'doctor': return doctors;
      case 'business_partner': return businessPartners;
      case 'employee': return employees;
      case 'distributor': return distributors;
      case 'patient': return patients.filter(p => p.isActive);
      default: return [];
    }
  };

  const selectedType = transactionTypes.find(t => t.id === formData.category);
  const stakeholders = selectedType?.stakeholderType ? getStakeholders(selectedType.stakeholderType as StakeholderType) : [];

  // Check if editing this transaction would violate daily entry limits
  const checkDailyEntryLimit = (category: TransactionCategory, date: string, currentTransactionId: string): boolean => {
    const dailyLimitCategories = ['pharmacy_sale', 'consultation_fee'];
    
    if (!dailyLimitCategories.includes(category)) {
      return true; // No limit for other categories
    }

    const selectedDate = new Date(date).toDateString();
    const existingEntry = transactions.find(t => 
      t.category === category && 
      t.date.toDateString() === selectedDate &&
      t.id !== currentTransactionId // Exclude current transaction being edited
    );

    return !existingEntry;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction) return;

    if (selectedType?.requiresStakeholder && !formData.stakeholderId) {
      alert('Missing Stakeholder: Please select a stakeholder for this transaction type.');
      return;
    }
    if (!formData.amount || !formData.description) {
      alert('Missing Required Fields: Please fill in all required fields including amount and description.');
      return;
    }

    // Check daily entry limit for specific transaction types (excluding current transaction)
    if (!checkDailyEntryLimit(formData.category, formData.date, transaction.id)) {
      const categoryLabel = selectedType?.label || formData.category;
      const selectedDate = new Date(formData.date).toLocaleDateString();
      alert(`Daily Limit Conflict: Only one ${categoryLabel} entry is allowed per day. Another entry already exists for ${selectedDate}.`);
      return;
    }

    const updatedData: Partial<Transaction> = {
      category: formData.category,
      stakeholderId: formData.stakeholderId || undefined,
      stakeholderType: formData.stakeholderType || undefined,
      amount: parseFloat(formData.amount),
      description: formData.description,
      date: new Date(formData.date),
      ...(formData.billNo && { billNo: formData.billNo })
    };

    onSubmit(transaction.id, updatedData);
    onClose();
  };

  const handleCategoryChange = (category: TransactionCategory) => {
    setFormData(prev => ({
      ...prev,
      category,
      stakeholderId: '',
      stakeholderType: '' as StakeholderType
    }));
  };

  // Get daily entry status for current selection
  const dailyEntryExists = transaction ? !checkDailyEntryLimit(formData.category, formData.date, transaction.id) : false;
  const isDailyLimitCategory = ['pharmacy_sale', 'consultation_fee'].includes(formData.category);

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg shadow-lg">
              <PencilIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Edit Transaction</h2>
              <p className="text-xs text-gray-400">Modify transaction details</p>
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
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors appearance-none cursor-pointer"
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

            {/* Daily Entry Warning */}
            {isDailyLimitCategory && dailyEntryExists && (
              <div className="bg-amber-900/50 border border-amber-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-amber-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-300">Daily Entry Conflict</p>
                    <p className="text-xs text-amber-400">
                      Another {selectedType?.label} entry exists for {new Date(formData.date).toLocaleDateString()}. 
                      Only one entry per day is allowed for this transaction type.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stakeholder Selection */}
            {selectedType?.requiresStakeholder && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {selectedType.stakeholderType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <select
                  value={formData.stakeholderId || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, stakeholderId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-colors"
                rows={3}
                placeholder="Enter transaction details..."
                required
              />
            </div>

            {/* Bill No. - Only for Distributor Credit Purchase */}
            {formData.category === 'distributor_credit_purchase' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bill No.</label>
                <input
                  type="text"
                  value={formData.billNo || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, billNo: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Enter bill/invoice number..."
                />
              </div>
            )}
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
              disabled={isDailyLimitCategory && dailyEntryExists}
              className={clsx(
                "flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-sm",
                isDailyLimitCategory && dailyEntryExists
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {isDailyLimitCategory && dailyEntryExists ? "Cannot Save - Conflict" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTransactionForm;