import React, { useState, useMemo } from 'react';
import {
  CreditCardIcon,
  BanknotesIcon,
  UserGroupIcon,
  UsersIcon,
  TruckIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import type { StakeholderType } from '../types';
import clsx from 'clsx';

interface PaymentProcessorProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessPayments: (payments: PaymentBatch) => void;
}

interface PaymentItem {
  id: string;
  stakeholderId: string;
  stakeholderName: string;
  stakeholderType: StakeholderType;
  amount: number;
  description: string;
  selected: boolean;
}

interface PaymentBatch {
  items: PaymentItem[];
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'check';
  reference: string;
  totalAmount: number;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({ isOpen, onClose, onProcessPayments }) => {
  const { doctors, businessPartners, employees, distributors } = useStakeholders();
  const { getDoctorPayables, getBusinessPartnerPayables, getEmployeeSalaryDue, getDistributorCredits } = useTransactions();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'batch' | 'process'>('pending');
  const [selectedPayments, setSelectedPayments] = useState<PaymentItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'check'>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stakeholderFilter, setStakeholderFilter] = useState<StakeholderType | 'all'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const generatePendingPayments = (): PaymentItem[] => {
    const payments: PaymentItem[] = [];
    
    // Get real payables data from contexts
    const doctorPayables = getDoctorPayables();
    const businessPartnerPayables = getBusinessPartnerPayables();
    const employeePayables = getEmployeeSalaryDue();
    const distributorCredits = getDistributorCredits();
    
    // Convert doctor payables to payment items
    doctorPayables.forEach(payable => {
      payments.push({
        id: `doctor-${payable.stakeholderId}`,
        stakeholderId: payable.stakeholderId,
        stakeholderName: payable.stakeholderName,
        stakeholderType: 'doctor',
        amount: payable.netPayable,
        description: 'Outstanding consultation fees',
        selected: false
      });
    });
    
    // Convert business partner payables to payment items
    businessPartnerPayables.forEach(payable => {
      payments.push({
        id: `partner-${payable.stakeholderId}`,
        stakeholderId: payable.stakeholderId,
        stakeholderName: payable.stakeholderName,
        stakeholderType: 'business_partner',
        amount: payable.netPayable,
        description: 'Commission payment due',
        selected: false
      });
    });
    
    // Convert employee payables to payment items
    employeePayables.forEach(payable => {
      payments.push({
        id: `employee-${payable.stakeholderId}`,
        stakeholderId: payable.stakeholderId,
        stakeholderName: payable.stakeholderName,
        stakeholderType: 'employee',
        amount: payable.netPayable,
        description: 'Salary payment due',
        selected: false
      });
    });
    
    // Convert distributor credits to payment items (amounts we owe them)
    distributorCredits.forEach(credit => {
      payments.push({
        id: `distributor-${credit.id}`,
        stakeholderId: credit.id,
        stakeholderName: credit.name,
        stakeholderType: 'distributor',
        amount: credit.creditBalance,
        description: 'Outstanding invoice payment',
        selected: false
      });
    });

    return payments;
  };

  const pendingPayments = useMemo(() => generatePendingPayments(), [
    getDoctorPayables, getBusinessPartnerPayables, getEmployeeSalaryDue, getDistributorCredits
  ]);

  const filteredPayments = useMemo(() => {
    return pendingPayments.filter(payment => {
      const matchesSearch = payment.stakeholderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          payment.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = stakeholderFilter === 'all' || payment.stakeholderType === stakeholderFilter;
      return matchesSearch && matchesFilter;
    });
  }, [pendingPayments, searchTerm, stakeholderFilter]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const getStakeholderIcon = (type: StakeholderType) => {
    switch (type) {
      case 'doctor': return UserGroupIcon;
      case 'employee': return UsersIcon;
      case 'business_partner': return BuildingOfficeIcon;
      case 'distributor': return TruckIcon;
      case 'patient': return UserGroupIcon;
      default: return UserGroupIcon;
    }
  };

  const getStakeholderColor = (type: StakeholderType) => {
    switch (type) {
      case 'doctor': return 'text-green-400';
      case 'employee': return 'text-purple-400';
      case 'business_partner': return 'text-blue-400';
      case 'distributor': return 'text-cyan-400';
      case 'patient': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const handlePaymentSelect = (payment: PaymentItem) => {
    setSelectedPayments(prev => {
      const exists = prev.find(p => p.id === payment.id);
      if (exists) {
        return prev.filter(p => p.id !== payment.id);
      } else {
        return [...prev, { ...payment, selected: true }];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === filteredPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(filteredPayments.map(p => ({ ...p, selected: true })));
    }
  };

  const totalSelectedAmount = selectedPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const handleProcessPayments = async () => {
    if (selectedPayments.length === 0) {
      alert('Please select at least one payment to process');
      return;
    }

    if (!reference.trim()) {
      alert('Please enter a payment reference');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const batch: PaymentBatch = {
      items: selectedPayments,
      paymentDate,
      paymentMethod,
      reference,
      totalAmount: totalSelectedAmount
    };

    onProcessPayments(batch);
    setIsProcessing(false);
    setActiveTab('pending');
    setSelectedPayments([]);
    setReference('');
    
    alert(`Successfully processed ${selectedPayments.length} payments totaling ${formatCurrency(totalSelectedAmount)}`);
    onClose();
  };

  const stakeholderTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'doctor', label: 'Doctors' },
    { value: 'employee', label: 'Employees' },
    { value: 'business_partner', label: 'Business Partners' },
    { value: 'distributor', label: 'Distributors' },
    { value: 'partner', label: 'Partners' }
  ];

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer', icon: CreditCardIcon },
    { value: 'cash', label: 'Cash Payment', icon: BanknotesIcon },
    { value: 'check', label: 'Check Payment', icon: DocumentTextIcon }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <CreditCardIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Payment Processor</h2>
              <p className="text-sm text-gray-400">Process bulk payments to stakeholders</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="flex px-6">
            {[
              { id: 'pending', label: 'Pending Payments', count: pendingPayments.length },
              { id: 'batch', label: 'Payment Batch', count: selectedPayments.length },
              { id: 'process', label: 'Process Payments' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-green-500 text-green-400 bg-gray-800/50'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                )}
              >
                {tab.label}
                {'count' in tab && (
                  <span className="ml-1 px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Pending Payments Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search stakeholders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-4 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full"
                  />
                </div>
                <select
                  value={stakeholderFilter}
                  onChange={(e) => setStakeholderFilter(e.target.value as any)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                >
                  {stakeholderTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  {selectedPayments.length === filteredPayments.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Payments Table */}
              <div className="bg-gray-750 border border-gray-600 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Select</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stakeholder</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredPayments.map(payment => {
                      const Icon = getStakeholderIcon(payment.stakeholderType);
                      const isSelected = selectedPayments.some(p => p.id === payment.id);
                      
                      return (
                        <tr 
                          key={payment.id} 
                          className={clsx(
                            'hover:bg-gray-700 transition-colors cursor-pointer',
                            isSelected && 'bg-green-900/20'
                          )}
                          onClick={() => handlePaymentSelect(payment)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handlePaymentSelect(payment)}
                              className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Icon className={clsx('h-5 w-5', getStakeholderColor(payment.stakeholderType))} />
                              <span className="text-white font-medium">{payment.stakeholderName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize text-gray-300">
                              {payment.stakeholderType.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{payment.description}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-green-400 font-semibold">
                              {formatCurrency(payment.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedPayments.length > 0 && (
                <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 font-medium">
                        {selectedPayments.length} payments selected
                      </p>
                      <p className="text-sm text-gray-300">
                        Total amount: {formatCurrency(totalSelectedAmount)}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('batch')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Review Batch
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Batch Tab */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="bg-gray-750 border border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Batch Summary</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{selectedPayments.length}</p>
                    <p className="text-sm text-gray-400">Total Payments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalSelectedAmount)}</p>
                    <p className="text-sm text-gray-400">Total Amount</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">
                      {new Set(selectedPayments.map(p => p.stakeholderType)).size}
                    </p>
                    <p className="text-sm text-gray-400">Stakeholder Types</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-750 border border-gray-600 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stakeholder</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {selectedPayments.map(payment => {
                      const Icon = getStakeholderIcon(payment.stakeholderType);
                      
                      return (
                        <tr key={payment.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Icon className={clsx('h-5 w-5', getStakeholderColor(payment.stakeholderType))} />
                              <span className="text-white font-medium">{payment.stakeholderName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize text-gray-300">
                              {payment.stakeholderType.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{payment.description}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-green-400 font-semibold">
                              {formatCurrency(payment.amount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handlePaymentSelect(payment)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Remove from batch"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('pending')}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Back to Pending
                </button>
                <button
                  onClick={() => setActiveTab('process')}
                  disabled={selectedPayments.length === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Proceed to Process
                </button>
              </div>
            </div>
          )}

          {/* Process Payments Tab */}
          {activeTab === 'process' && (
            <div className="space-y-6">
              <div className="bg-gray-750 border border-gray-600 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
                    <div className="space-y-2">
                      {paymentMethods.map(method => {
                        const Icon = method.icon;
                        return (
                          <label key={method.value} className="flex items-center gap-3 p-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-650 transition-colors">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.value}
                              checked={paymentMethod === method.value}
                              onChange={(e) => setPaymentMethod(e.target.value as any)}
                              className="text-green-600 focus:ring-green-500"
                            />
                            <Icon className="h-5 w-5 text-gray-400" />
                            <span className="text-white">{method.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Date & Reference */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Payment Date</label>
                      <div className="relative">
                        <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Payment Reference</label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Enter batch reference number"
                        className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-green-400 mb-4">Payment Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{selectedPayments.length}</p>
                    <p className="text-sm text-gray-400">Total Payments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(totalSelectedAmount)}</p>
                    <p className="text-sm text-gray-400">Total Amount</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-white capitalize">{paymentMethod.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-400">Payment Method</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-white">{new Date(paymentDate).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-400">Payment Date</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab('batch')}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Back to Batch
                </button>
                <button
                  onClick={handleProcessPayments}
                  disabled={isProcessing || !reference.trim()}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Process {selectedPayments.length} Payments
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessor;