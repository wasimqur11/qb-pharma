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
  ArrowDownIcon,
  PencilIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CalculatorIcon
} from '@heroicons/react/24/outline';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../contexts/AuthContext';
// import { useToast } from '../contexts/ToastContext';
import { TRANSACTION_TYPES } from '../constants/transactionTypes';
import type { Transaction, TransactionCategory, StakeholderType } from '../types';
import clsx from 'clsx';

interface TransactionHistoryProps {
  transactions?: Transaction[];
  onEditTransaction?: (transaction: Transaction) => void;
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

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions: propTransactions, onEditTransaction }) => {
  const { transactions } = useTransactions();
  const { doctors, businessPartners, employees, distributors, patients } = useStakeholders();
  const { hasPermission } = useAuth();
  // const { showInfo } = useToast();

  // Helper function to get stakeholder name from transaction
  const getStakeholderName = (transaction: Transaction): string => {
    if (!transaction.stakeholderId || !transaction.stakeholderType) {
      return 'NA';
    }

    let stakeholderList;
    switch (transaction.stakeholderType) {
      case 'doctor':
        stakeholderList = doctors;
        break;
      case 'business_partner':
        stakeholderList = businessPartners;
        break;
      case 'employee':
        stakeholderList = employees;
        break;
      case 'distributor':
        stakeholderList = distributors;
        break;
      case 'patient':
        stakeholderList = patients;
        break;
      default:
        return 'NA';
    }

    const stakeholder = stakeholderList.find(s => s.id === transaction.stakeholderId);
    return stakeholder ? stakeholder.name : 'NA';
  };

  // Helper function to determine cash flow impact
  const getCashFlowImpact = (category: TransactionCategory): { type: 'Revenue' | 'Expense' | 'Distribution' | 'Credit Issued' | 'Credit Received' | 'Credit Reduction', color: string } => {
    const revenueCategories: TransactionCategory[] = ['pharmacy_sale', 'consultation_fee', 'patient_payment'];
    const expenseCategories: TransactionCategory[] = ['distributor_payment', 'doctor_expense', 'employee_payment', 'clinic_expense'];

    if (revenueCategories.includes(category)) {
      return { type: 'Revenue', color: 'text-green-400' };
    } else if (expenseCategories.includes(category)) {
      return { type: 'Expense', color: 'text-red-400' };
    } else if (category === 'sales_profit_distribution') {
      return { type: 'Distribution', color: 'text-purple-400' }; // Profit distribution to partners
    } else if (category === 'patient_credit_sale') {
      return { type: 'Credit Issued', color: 'text-orange-400' }; // We give credit to patient
    } else if (category === 'distributor_credit_purchase') {
      return { type: 'Credit Received', color: 'text-blue-400' }; // We receive credit from distributor
    } else if (category === 'distributor_credit_note') {
      return { type: 'Credit Reduction', color: 'text-indigo-400' }; // We return items, reducing distributor credit
    } else {
      return { type: 'Credit Issued', color: 'text-gray-400' }; // fallback
    }
  };
  
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
  const [selectedPeriod, setSelectedPeriod] = useState('30days');

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
    const transactionType = TRANSACTION_TYPES.find(type => type.id === category);
    return transactionType?.label || category;
  };

  const getCategoryColor = (category: TransactionCategory) => {
    const transactionType = TRANSACTION_TYPES.find(type => type.id === category);
    return transactionType?.color || 'text-gray-400';
  };

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    let fromDate;

    switch (period) {
      case '7days':
        fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6months':
        fromDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        fromDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setFilters(prev => ({
      ...prev,
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    }));
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
    setSelectedPeriod('30days');
  };

  const exportData = async () => {
    try {
      const { exportToPDF, exportToExcel, exportTransactionsToExcel } = await import('../utils/exportUtils');
      
      const exportChoice = window.confirm(
        `Export ${sortedTransactions.length} transactions?\n\nOK for PDF Report\nCancel for Excel Spreadsheet`
      );
      
      if (exportChoice) {
        // Export as PDF
        const summaryData = [
          { label: 'Total Revenue', value: businessMetrics.totalRevenue },
          { label: 'Total Expenses', value: businessMetrics.totalExpenses },
          { label: 'Net Profit', value: businessMetrics.netProfit },
          { label: 'Profit Margin', value: `${businessMetrics.profitMargin.toFixed(1)}%` },
          { label: 'Transaction Count', value: businessMetrics.transactionCount },
          { label: 'Date Range', value: `${new Date(filters.dateFrom).toLocaleDateString()} - ${new Date(filters.dateTo).toLocaleDateString()}` }
        ];
        
        const headers = ['Date', 'Type', 'Description', 'Stakeholder', 'Amount'];
        const data = sortedTransactions.map(t => [
          t.date.toLocaleDateString(),
          getCategoryLabel(t.category),
          t.description,
          getStakeholderName(t),
          formatCurrency(t.amount)
        ]);
        
        await exportToPDF({
          title: 'Transaction History Report',
          subtitle: `${new Date(filters.dateFrom).toLocaleDateString()} - ${new Date(filters.dateTo).toLocaleDateString()}`,
          headers,
          data,
          summary: summaryData
        });
      } else {
        // Export as Excel
        exportTransactionsToExcel(sortedTransactions, 'Transaction History');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const businessMetrics = useMemo(() => {
    // Categorize transactions properly
    const revenueCategories: TransactionCategory[] = ['pharmacy_sale', 'consultation_fee', 'patient_payment'];
    const expenseCategories: TransactionCategory[] = ['distributor_payment', 'doctor_expense', 'employee_payment', 'clinic_expense'];
    
    const totalRevenue = sortedTransactions
      .filter(t => revenueCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = sortedTransactions
      .filter(t => expenseCategories.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    return { 
      totalRevenue, 
      totalExpenses, 
      netProfit, 
      profitMargin,
      transactionCount: sortedTransactions.length 
    };
  }, [sortedTransactions]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Master Business Report</h2>
          <p className="text-gray-400 text-sm">Comprehensive transaction analysis and business intelligence</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(businessMetrics.totalRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">Sales + Consultations + Payments</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(businessMetrics.totalExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">Payments + Salaries + Clinic Costs</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Net Profit</p>
          </div>
          <p className={clsx(
            "text-2xl font-bold",
            businessMetrics.netProfit >= 0 ? "text-blue-400" : "text-red-400"
          )}>
            {formatCurrency(Math.abs(businessMetrics.netProfit))}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {businessMetrics.netProfit >= 0 ? "Profit" : "Loss"} for selected period
          </p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalculatorIcon className="h-4 w-4 text-purple-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Profit Margin</p>
          </div>
          <p className={clsx(
            "text-2xl font-bold",
            businessMetrics.profitMargin >= 0 ? "text-purple-400" : "text-red-400"
          )}>
            {businessMetrics.profitMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {businessMetrics.transactionCount} transactions analyzed
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

        {/* Period Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">Quick Period Selection</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: '90days', label: 'Last 3 Months' },
              { value: '6months', label: 'Last 6 Months' },
              { value: '1year', label: 'Last Year' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => handlePeriodChange(period.value)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  selectedPeriod === period.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
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
              {TRANSACTION_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
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
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Cash Flow Impact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stakeholder</th>
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
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {(() => {
                          const impact = getCashFlowImpact(transaction.category);
                          return (
                            <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full', 
                              impact.type === 'Revenue' ? 'bg-green-900/50 text-green-400' :
                              impact.type === 'Expense' ? 'bg-red-900/50 text-red-400' :
                              impact.type === 'Distribution' ? 'bg-purple-900/50 text-purple-400' :
                              impact.type === 'Credit Issued' ? 'bg-orange-900/50 text-orange-400' :
                              impact.type === 'Credit Received' ? 'bg-blue-900/50 text-blue-400' :
                              impact.type === 'Credit Reduction' ? 'bg-indigo-900/50 text-indigo-400' :
                              'bg-gray-900/50 text-gray-400'
                            )}>
                              {impact.type}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {getStakeholderName(transaction)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-green-400">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedTransaction(transaction)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          {onEditTransaction && (hasPermission('admin') || hasPermission('super_admin')) && (
                            <button
                              onClick={() => onEditTransaction(transaction)}
                              className="text-green-400 hover:text-green-300 p-1"
                              title="Edit transaction (Admin only)"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
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
                <p className="text-sm text-gray-400">Stakeholder</p>
                <p className="text-white">{getStakeholderName(selectedTransaction)}</p>
              </div>
              {selectedTransaction.billNo && (
                <div>
                  <p className="text-sm text-gray-400">Bill No.</p>
                  <p className="text-white">{selectedTransaction.billNo}</p>
                </div>
              )}
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