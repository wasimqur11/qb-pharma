import React, { useState, useEffect, useMemo } from 'react';
import {
  PlusIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TruckIcon,
  UsersIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { TransactionCategory, StakeholderType } from '../types';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
// import { useToast } from '../contexts/ToastContext';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import SearchableSelect from './SearchableSelect';
import type { SearchableSelectOption } from './SearchableSelect';
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
  onSubmit: (data: TransactionFormData) => void | Promise<void>;
  defaultCategory?: TransactionCategory;
}

const DRAFT_KEY = 'qb-pharma-transaction-draft';

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit, defaultCategory }) => {
  const { doctors, businessPartners, employees, distributors, patients } = useStakeholders();
  const { transactions, getCashPosition, getPharmacyCashPosition } = useTransactions();
  // const { showError } = useToast();
  const [formData, setFormData] = useState<TransactionFormData>({
    category: 'pharmacy_sale',
    amount: '',
    description: '',
    billNo: '',
    date: new Date().toISOString().split('T')[0]
  });

  // State for duplicate confirmation dialog
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<TransactionFormData | null>(null);

  // Track if user has made any changes to the form
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [initialFormData] = useState<TransactionFormData>({
    category: 'pharmacy_sale',
    amount: '',
    description: '',
    billNo: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [draftRestored, setDraftRestored] = useState(false);

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

  // Convert stakeholders to SearchableSelectOption format
  const stakeholderOptions: SearchableSelectOption[] = useMemo(() => {
    return stakeholders.map(stakeholder => ({
      value: stakeholder.id,
      label: stakeholder.name,
      sublabel: 'phone' in stakeholder && stakeholder.phone ? stakeholder.phone : undefined
    }));
  }, [stakeholders]);

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

  // Check for potential duplicate transactions (for warning, not blocking)
  const checkForDuplicates = (data: TransactionFormData): boolean => {
    // Skip duplicate check for categories with daily limits (they have their own logic)
    const dailyLimitCategories = ['pharmacy_sale', 'consultation_fee'];
    if (dailyLimitCategories.includes(data.category)) {
      return false;
    }

    const amount = parseFloat(data.amount);
    const selectedDate = new Date(data.date).toDateString();
    
    const duplicateTransaction = transactions.find(t => 
      t.category === data.category &&
      t.amount === amount &&
      t.date.toDateString() === selectedDate &&
      (data.stakeholderId ? t.stakeholderId === data.stakeholderId : true)
    );

    return !!duplicateTransaction;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submissionData = {
      ...formData,
      stakeholderType: selectedType?.stakeholderType as StakeholderType
    };

    // Perform basic validations first
    if (!performBasicValidations(submissionData)) {
      return;
    }

    // Check for duplicates (only for non-daily-limit categories)
    if (checkForDuplicates(submissionData)) {
      setPendingSubmission(submissionData);
      setShowDuplicateWarning(true);
      return;
    }

    // Proceed with submission
    submitTransaction(submissionData);
  };

  // Extract validation logic for reuse
  const performBasicValidations = (data: TransactionFormData): boolean => {
    // Validate that date is not in the future
    const transactionDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    transactionDate.setHours(0, 0, 0, 0);

    if (transactionDate > today) {
      alert('Invalid Date: Future-dated transactions are not allowed. Please select today or an earlier date.');
      return false;
    }

    // Special validation for Settlement Point (Pharmacy only)
    if (data.category === 'settlement_point') {
      // Calculate pharmacy cash position UP TO the selected date (not current total)
      const selectedDate = new Date(data.date);
      const transactionsUpToDate = transactions.filter(t => t.date <= selectedDate);

      const pharmacyRevenue = transactionsUpToDate
        .filter(t => t.category === 'pharmacy_sale' || t.category === 'patient_payment')
        .reduce((sum, t) => sum + t.amount, 0);

      const pharmacyExpenses = transactionsUpToDate
        .filter(t => ['distributor_payment', 'sales_profit_distribution', 'employee_payment', 'clinic_expense', 'patient_credit_sale'].includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);

      const pharmacyCash = pharmacyRevenue - pharmacyExpenses;

      // Debug info
      console.log('Pharmacy Settlement Point Validation:', {
        selectedDate: data.date,
        pharmacyRevenue,
        pharmacyExpenses,
        pharmacyCash,
        absoluteCash: Math.abs(pharmacyCash),
        amount: data.amount,
        parsedAmount: parseFloat(data.amount)
      });

      // Allow Settlement Point only if pharmacy cash is within ±₹50 of zero
      if (Math.abs(pharmacyCash) > 50) {
        alert(`Pharmacy Settlement Point can only be created when pharmacy cash position is close to zero.\n\nPharmacy Cash as of ${selectedDate.toLocaleDateString()}: ₹${pharmacyCash.toLocaleString()}\nTolerance: ±₹50\n\nNote: Doctor transactions are tracked separately.`);
        return false;
      }

      // Force amount to be 0 for Settlement Point
      if (parseFloat(data.amount) !== 0) {
        alert('Settlement Point amount must be ₹0');
        return false;
      }
    } else {
      // Regular validation for non-Settlement Point transactions
      if (!data.amount || parseFloat(data.amount) <= 0) {
        alert('Please enter a valid amount greater than 0');
        return false;
      }
    }
    
    if (selectedType?.requiresStakeholder && !data.stakeholderId) {
      alert('Missing Stakeholder: Please select a stakeholder for this transaction type.');
      return false;
    }
    if (!data.description) {
      alert('Missing Required Fields: Please provide a description for this transaction.');
      return false;
    }

    // Check daily entry limit for specific transaction types
    if (!checkDailyEntryLimit(data.category, data.date)) {
      const categoryLabel = selectedType?.label || data.category;
      const selectedDate = new Date(data.date).toLocaleDateString();
      alert(`Daily Limit Exceeded: Only one ${categoryLabel} entry is allowed per day. An entry already exists for ${selectedDate}.`);
      return false;
    }

    return true;
  };

  // Submit transaction after all validations
  const submitTransaction = (data: TransactionFormData) => {
    onSubmit(data);
    resetForm();
  };

  // Handle duplicate confirmation
  const handleDuplicateConfirm = () => {
    if (pendingSubmission) {
      submitTransaction(pendingSubmission);
    }
    setShowDuplicateWarning(false);
    setPendingSubmission(null);
  };

  // Handle duplicate cancellation
  const handleDuplicateCancel = () => {
    setShowDuplicateWarning(false);
    setPendingSubmission(null);
  };

  const handleCategoryChange = (category: TransactionCategory) => {
    setFormData(prev => ({
      ...prev,
      category,
      stakeholderId: undefined,
      stakeholderType: undefined,
      // Auto-fill amount to 0 for Settlement Point
      amount: category === 'settlement_point' ? '0' : prev.amount,
      // Auto-fill description for Settlement Point
      description: category === 'settlement_point'
        ? `Pharmacy Settlement Point - ${new Date().toLocaleDateString()}`
        : prev.description
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

  // Save draft to sessionStorage whenever form content changes (while open)
  useEffect(() => {
    if (!isOpen) return;
    const isEmpty =
      formData.category === 'pharmacy_sale' &&
      formData.amount === '' &&
      formData.description === '' &&
      !formData.billNo &&
      !formData.stakeholderId;
    if (!isEmpty) {
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formData)); } catch {}
    }
  }, [formData, isOpen]);

  // Restore draft when form opens (skip if opened with a preset category via keyboard shortcut)
  useEffect(() => {
    if (!isOpen || defaultCategory) return;
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TransactionFormData;
        setFormData(parsed);
        setDraftRestored(true);
        setTimeout(() => setDraftRestored(false), 4000);
      }
    } catch {}
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Set default category when form opens with a preset category
  useEffect(() => {
    if (isOpen && defaultCategory) {
      handleCategoryChange(defaultCategory);
    }
  }, [isOpen, defaultCategory]);

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

  // Reset form to initial state and clear any saved draft
  const resetForm = () => {
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
    setFormData({
      category: 'pharmacy_sale',
      amount: '',
      description: '',
      billNo: '',
      date: new Date().toISOString().split('T')[0]
    });
    setHasUnsavedChanges(false);
    setDraftRestored(false);
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
                    {selectedType?.id === 'settlement_point' && <CheckBadgeIcon className="h-3.5 w-3.5 text-emerald-400" />}
                    {!['pharmacy_sale', 'consultation_fee', 'distributor_payment', 'employee_payment', 'sales_profit_distribution', 'settlement_point'].includes(selectedType?.id || '') && <CreditCardIcon className="h-3.5 w-3.5 text-gray-400" />}
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
                <SearchableSelect
                  options={stakeholderOptions}
                  value={formData.stakeholderId || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, stakeholderId: value }))}
                  placeholder={`Select ${selectedType.stakeholderType?.replace('_', ' ')}`}
                  label={selectedType.stakeholderType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  required
                />
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
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Amount {formData.category === 'settlement_point' && <span className="text-emerald-400">(Auto: ₹0)</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">₹</span>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className={clsx(
                      "w-full pl-6 pr-2 py-1.5 border rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 text-xs",
                      formData.category === 'settlement_point'
                        ? "bg-gray-600 border-emerald-600 text-emerald-400 cursor-not-allowed"
                        : "bg-gray-700 border-gray-600 focus:ring-blue-500"
                    )}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    readOnly={formData.category === 'settlement_point'}
                    title={formData.category === 'settlement_point' ? 'Settlement Point amount is automatically set to ₹0' : ''}
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  max={new Date().toISOString().split('T')[0]}
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
              {draftRestored && <span className="text-emerald-400"> • Draft restored</span>}
              {!draftRestored && hasUnsavedChanges && <span className="text-amber-400"> • Unsaved changes</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Duplicate Warning Dialog */}
      {showDuplicateWarning && pendingSubmission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-gray-800 border border-yellow-600/50 rounded-lg w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700 bg-yellow-600/10">
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-white">Potential Duplicate Transaction</h3>
            </div>

            {/* Content */}
            <div className="px-4 py-4">
              <p className="text-gray-300 mb-4">
                A similar transaction already exists with the same amount, type, and date. 
                Are you sure you want to add this transaction?
              </p>
              
              <div className="bg-gray-900/50 p-3 rounded border border-gray-600">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{selectedType?.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">₹{parseFloat(pendingSubmission.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{new Date(pendingSubmission.date).toLocaleDateString()}</span>
                  </div>
                  {pendingSubmission.stakeholderId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stakeholder:</span>
                      <span className="text-white">
                        {stakeholders.find(s => s.id === pendingSubmission.stakeholderId)?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-gray-700 bg-gray-750">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDuplicateCancel}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateConfirm}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Add Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;