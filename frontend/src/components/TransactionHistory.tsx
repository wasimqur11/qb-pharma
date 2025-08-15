import React, { useState, useMemo } from 'react';
import {
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  UsersIcon,
  TruckIcon,
  BuildingOfficeIcon,
  EyeIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import type { Transaction, TransactionCategory, StakeholderType } from '../types';
import clsx from 'clsx';

interface TransactionHistoryProps {
  transactions?: Transaction[];
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  category: TransactionCategory | 'all';
  stakeholderType: StakeholderType | 'partner' | 'all';
  stakeholderId: string;
  amountMin: string;
  amountMax: string;
  searchTerm: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions: propTransactions }) => {
  const { transactions } = useTransactions();
  const { doctors, businessPartners, employees, distributors, patients } = useStakeholders();
  
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    category: 'all',
    stakeholderType: 'all',
    stakeholderId: '',
    amountMin: '',
    amountMax: '',
    searchTerm: ''
  });

  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Use context transactions if no prop transactions provided
  const allTransactions = useMemo(() => {
    return propTransactions || transactions;
  }, [propTransactions, transactions]);

  const getAllStakeholders = () => {
    const stakeholders = [
      ...businessPartners.map(p => ({ ...p, type: 'business_partner' as const })),
      ...doctors.map(d => ({ ...d, type: 'doctor' as const })),
      ...employees.map(e => ({ ...e, type: 'employee' as const })),
      ...distributors.map(d => ({ ...d, type: 'distributor' as const })),
      ...patients.map(p => ({ ...p, type: 'patient' as const }))
    ];
    
    if (filters.stakeholderType === 'all') return stakeholders;
    return stakeholders.filter(s => s.type === filters.stakeholderType);
  };

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      
      // Date filter
      if (transactionDate < fromDate || transactionDate > toDate) return false;
      
      // Category filter
      if (filters.category !== 'all' && transaction.category !== filters.category) return false;
      
      // Stakeholder type filter
      if (filters.stakeholderType !== 'all') {
        if (!transaction.stakeholderType) return false;
        if (transaction.stakeholderType !== filters.stakeholderType) return false;
      }
      
      // Specific stakeholder filter
      if (filters.stakeholderId && transaction.stakeholderId !== filters.stakeholderId) return false;
      
      // Amount filters
      if (filters.amountMin && transaction.amount < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && transaction.amount > parseFloat(filters.amountMax)) return false;
      
      // Search term
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return transaction.description.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  }, [allTransactions, filters]);

  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredTransactions, sortField, sortDirection]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const getStakeholderIcon = (type?: StakeholderType | 'partner') => {
    switch (type) {
      case 'doctor': return UserGroupIcon;
      case 'employee': return UsersIcon;
      case 'business_partner': return BuildingOfficeIcon;
      case 'distributor': return TruckIcon;
      case 'patient': return UserGroupIcon;
      case 'partner': return BuildingOfficeIcon;
      default: return CurrencyDollarIcon;
    }
  };

  const getCategoryLabel = (category: TransactionCategory) => {
    const labels = {
      pharmacy_sale: 'Pharmacy Sale',
      consultation_fee: 'Consultation Fee',
      distributor_payment: 'Distributor Payment',
      doctor_expense: 'Doctor Expense',
      business_partner_payment: 'Business Partner Payment',
      employee_payment: 'Employee Payment',
      clinic_expense: 'Clinic Expense',
      patient_credit_sale: 'Patient Credit Sale',
      patient_payment: 'Patient Payment'
    };
    return labels[category];
  };

  const getCategoryColor = (category: TransactionCategory) => {
    const colors = {
      pharmacy_sale: 'text-green-400',
      consultation_fee: 'text-blue-400',
      distributor_payment: 'text-orange-400',
      doctor_expense: 'text-red-400',
      business_partner_payment: 'text-purple-400',
      employee_payment: 'text-cyan-400',
      clinic_expense: 'text-yellow-400',
      patient_credit_sale: 'text-green-300',
      patient_payment: 'text-green-500'
    };
    return colors[category];
  };

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dateTo: new Date().toISOString().split('T')[0],
      category: 'all',
      stakeholderType: 'all',
      stakeholderId: '',
      amountMin: '',
      amountMax: '',
      searchTerm: ''
    });
  };

  const exportData = () => {
    // Mock export functionality
    alert(`Exporting ${sortedTransactions.length} transactions to CSV (demo functionality)`);
  };

  const summaryStats = useMemo(() => {
    const totalAmount = sortedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = sortedTransactions.length > 0 ? totalAmount / sortedTransactions.length : 0;
    const categoryCounts = sortedTransactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<TransactionCategory, number>);
    
    return { totalAmount, avgAmount, categoryCounts, count: sortedTransactions.length };
  }, [sortedTransactions]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Transaction History</h2>
          <p className="text-gray-400 text-sm">View and filter all financial transactions</p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Transactions</p>
          </div>
          <p className="text-2xl font-bold text-white">{summaryStats.count}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Amount</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(summaryStats.totalAmount)}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Average Amount</p>
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(summaryStats.avgAmount)}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Date Range</p>
          </div>
          <p className="text-sm font-bold text-white">
            {new Date(filters.dateFrom).toLocaleDateString()} - {new Date(filters.dateTo).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
          <button
            onClick={clearFilters}
            className="ml-auto text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Clear All Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="pharmacy_sale">Pharmacy Sale</option>
              <option value="consultation_fee">Consultation Fee</option>
              <option value="distributor_payment">Distributor Payment</option>
              <option value="doctor_expense">Doctor Expense</option>
              <option value="business_partner_payment">Business Partner Payment</option>
              <option value="employee_payment">Employee Payment</option>
              <option value="clinic_expense">Clinic Expense</option>
              <option value="patient_credit_sale">Patient Credit Sale</option>
              <option value="patient_payment">Patient Payment</option>
            </select>
          </div>

          {/* Stakeholder Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stakeholder Type</label>
            <select
              value={filters.stakeholderType}
              onChange={(e) => setFilters(prev => ({ ...prev, stakeholderType: e.target.value as any, stakeholderId: '' }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Stakeholders</option>
              <option value="doctor">Doctors</option>
              <option value="employee">Employees</option>
              <option value="business_partner">Business Partners</option>
              <option value="distributor">Distributors</option>
              <option value="patient">Patients</option>
            </select>
          </div>
        </div>

        {/* Second row of filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Specific Stakeholder */}
          {filters.stakeholderType !== 'all' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Specific Stakeholder</label>
              <select
                value={filters.stakeholderId}
                onChange={(e) => setFilters(prev => ({ ...prev, stakeholderId: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">All {filters.stakeholderType.replace('_', ' ')}s</option>
                {getAllStakeholders().map(stakeholder => (
                  <option key={stakeholder.id} value={stakeholder.id}>
                    {stakeholder.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Min Amount</label>
            <input
              type="number"
              value={filters.amountMin}
              onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
              placeholder="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Amount</label>
            <input
              type="number"
              value={filters.amountMax}
              onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
              placeholder="No limit"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search Description</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Search transactions..."
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">
              Transactions ({sortedTransactions.length} results)
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Sort by:</span>
              <button
                onClick={() => handleSort('date')}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded text-sm',
                  sortField === 'date' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
                )}
              >
                Date
                {sortField === 'date' && (
                  sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
                )}
              </button>
              <button
                onClick={() => handleSort('amount')}
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded text-sm',
                  sortField === 'amount' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
                )}
              >
                Amount
                {sortField === 'amount' && (
                  sortDirection === 'asc' ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {sortedTransactions.length > 0 ? (
                sortedTransactions.map((transaction) => {
                  const Icon = getStakeholderIcon(transaction.stakeholderType);
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {transaction.date.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon className={clsx('h-4 w-4', getCategoryColor(transaction.category))} />
                          <span className={clsx('text-sm font-medium', getCategoryColor(transaction.category))}>
                            {getCategoryLabel(transaction.category)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-green-400">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No transactions found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Transaction Details</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-gray-400 hover:text-white"
              >
                <ClockIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Transaction ID</p>
                  <p className="text-white font-medium">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Date</p>
                  <p className="text-white font-medium">{selectedTransaction.date.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Type</p>
                  <p className="text-white font-medium">{getCategoryLabel(selectedTransaction.category)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Amount</p>
                  <p className="text-green-400 font-bold">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-white">{selectedTransaction.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Created By</p>
                <p className="text-white">{selectedTransaction.createdBy}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;