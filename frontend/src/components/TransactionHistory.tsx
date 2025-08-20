import React, { useState, useMemo, useEffect } from 'react';
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
  CalculatorIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useAuth } from '../contexts/AuthContext';
// import { useToast } from '../contexts/ToastContext';
import { TRANSACTION_TYPES, REVENUE_CATEGORIES, EXPENSE_CATEGORIES, PHARMACY_REVENUE_CATEGORIES, PHARMACY_EXPENSE_CATEGORIES, getCashFlowImpact } from '../constants/transactionTypes';
import { SYSTEM_CONFIG, getDefaultDateRange } from '../constants/systemConfig';
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
  const { transactions, getDashboardStats } = useTransactions();
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

  
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: getDefaultDateRange('transaction').from,
    dateTo: getDefaultDateRange('transaction').to,
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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Use context transactions if no prop transactions provided
  const allTransactions = useMemo(() => {
    return propTransactions || transactions;
  }, [propTransactions, transactions]);

  // Get dashboard stats for payables data
  const dashboardStats = useMemo(() => getDashboardStats(), [getDashboardStats]);

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
    // If transactions are passed as props, they're already filtered by parent component
    if (propTransactions) {
      return propTransactions;
    }
    
    // Otherwise, apply local filtering (for standalone usage)
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
  }, [allTransactions, filters, propTransactions]);

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

  // Pagination logic
  const totalTransactions = sortedTransactions.length;
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortDirection]);

  const formatCurrency = (amount: number) => `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString()}`;
  
  // Helper function to round up currency values while maintaining total accuracy
  const formatCurrencyRounded = (amount: number) => `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${Math.ceil(amount).toLocaleString()}`;
  
  // Function to distribute rounded amounts that sum to the exact total
  const distributeRoundedAmounts = (amounts: number[], exactTotal: number) => {
    // Round up all individual amounts
    const roundedAmounts = amounts.map(amount => Math.ceil(amount));
    const roundedTotal = roundedAmounts.reduce((sum, amount) => sum + amount, 0);
    
    // Calculate the difference
    const difference = roundedTotal - exactTotal;
    
    // If there's a difference, adjust the largest amounts downward
    if (difference > 0) {
      // Create array of indices sorted by original amount (descending)
      const sortedIndices = amounts
        .map((amount, index) => ({ amount, index }))
        .sort((a, b) => b.amount - a.amount)
        .map(item => item.index);
      
      // Reduce the largest amounts by 1 until we match the exact total
      let remaining = difference;
      for (const index of sortedIndices) {
        if (remaining <= 0) break;
        if (roundedAmounts[index] > amounts[index]) {
          roundedAmounts[index]--;
          remaining--;
        }
      }
    }
    
    return roundedAmounts;
  };

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
      case 'all':
        // Set a very old date to show all transactions
        fromDate = new Date(2020, 0, 1); // January 1, 2020
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
    const defaultRange = getDefaultDateRange('transaction');
    setFilters({
      dateFrom: defaultRange.from,
      dateTo: defaultRange.to,
      category: 'all',
      stakeholderType: 'all',
      stakeholderId: '',
      amountMin: '',
      amountMax: '',
      searchTerm: ''
    });
    setSelectedPeriod('30days');
  };

  const exportTransactions = async (format: 'excel' | 'pdf') => {
    try {
      const { exportToPDF, exportTransactionsToExcel } = await import('../utils/exportUtils');
      
      const dateRange = {
        from: filters.dateFrom,
        to: filters.dateTo
      };
      
      if (format === 'excel') {
        // Export as Professional Excel
        await exportTransactionsToExcel(
          sortedTransactions, 
          'Transaction History Report',
          dateRange,
          { ...businessMetrics, filteredSummary }
        );
      } else {
        // Export as Professional PDF
        const summaryData = [
          { label: 'Total Revenue', value: businessMetrics.totalRevenue },
          { label: 'Total Expenses', value: businessMetrics.totalExpenses },
          { label: 'Net Profit', value: businessMetrics.netProfit },
          { label: 'Profit Margin', value: `${businessMetrics.profitMargin.toFixed(1)}%` },
          { label: 'Transaction Count', value: businessMetrics.transactionCount },
          { label: 'Filtered Revenue Sum', value: filteredSummary.revenueSum },
          { label: 'Filtered Expense Sum', value: filteredSummary.expenseSum },
          { label: 'Filtered Total Sum', value: filteredSummary.totalSum },
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
      }
      
      // Show success message
      const toast = document.createElement('div');
      toast.textContent = `Successfully exported ${sortedTransactions.length} transactions as ${format.toUpperCase()}`;
      toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const businessMetrics = useMemo(() => {
    // Total Revenue: Pharmacy sales + Patient payments only
    const pharmacySales = sortedTransactions
      .filter(t => t.category === 'pharmacy_sale')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const patientPayments = sortedTransactions
      .filter(t => t.category === 'patient_payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalRevenue = pharmacySales + patientPayments;
    
    // Expense breakdown for calculations
    const distributorPayments = sortedTransactions
      .filter(t => t.category === 'distributor_payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const salesProfitDistribution = sortedTransactions
      .filter(t => t.category === 'sales_profit_distribution')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const otherPharmacyExpenses = sortedTransactions
      .filter(t => ['employee_payment', 'clinic_expense', 'patient_credit_sale'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Total Expenses: Distributor payments + Other expenses (exclude Sales profit distribution)
    const totalExpenses = distributorPayments + otherPharmacyExpenses;
    
    // Net Profit: Total Pharmacy sale - Distributor payments - Other expenses (exclude Sales profit distribution)
    const netProfit = pharmacySales - distributorPayments - otherPharmacyExpenses;
    const profitMargin = pharmacySales > 0 ? (netProfit / pharmacySales) * 100 : 0;
    
    return { 
      totalRevenue, 
      totalExpenses, 
      distributorPayments,
      salesProfitDistribution,
      otherPharmacyExpenses,
      netProfit, 
      profitMargin,
      pharmacySales,
      patientPayments,
      transactionCount: sortedTransactions.filter(t => 
        PHARMACY_REVENUE_CATEGORIES.includes(t.category) || 
        PHARMACY_EXPENSE_CATEGORIES.includes(t.category)
      ).length 
    };
  }, [sortedTransactions]);

  // Calculate sum and breakdown of filtered transactions (pharmacy-only)
  const filteredSummary = useMemo(() => {
    const pharmacyTransactions = sortedTransactions.filter(t => 
      PHARMACY_REVENUE_CATEGORIES.includes(t.category) || 
      PHARMACY_EXPENSE_CATEGORIES.includes(t.category)
    );
    const totalSum = pharmacyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const revenueSum = sortedTransactions
      .filter(t => PHARMACY_REVENUE_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    const expenseSum = sortedTransactions
      .filter(t => PHARMACY_EXPENSE_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { totalSum, revenueSum, expenseSum };
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
            onClick={() => exportTransactions('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Excel
          </button>
          <button
            onClick={() => exportTransactions('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export PDF
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
          <p className="text-xs text-gray-500 mt-1">Sales + Patient Payments</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(businessMetrics.totalExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">Distributor + Other expenses</p>
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
            Sales - Distributor - Other expenses
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

      {/* Financial Management Section */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <BanknotesIcon className="h-5 w-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">Financial Management</h3>
          <p className="text-xs text-gray-400 ml-auto">Outstanding payables and credits</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Employee Salary Due */}
          <div className="bg-gray-750 border border-gray-600 rounded p-3">
            <div className="flex items-center gap-2 mb-3">
              <UsersIcon className="h-4 w-4 text-blue-400" />
              <h4 className="text-sm font-medium text-white">Employee Salary Due</h4>
            </div>
            {dashboardStats.employeeSalaryDue.length > 0 ? (
              <div className="space-y-2">
                {dashboardStats.employeeSalaryDue.slice(0, 3).map(payable => (
                  <div key={payable.stakeholderId} className="flex justify-between items-center">
                    <span className="text-xs text-gray-300 truncate">{payable.stakeholderName}</span>
                    <span className="text-xs font-medium text-blue-400">{formatCurrency(payable.netPayable)}</span>
                  </div>
                ))}
                {dashboardStats.employeeSalaryDue.length > 3 && (
                  <p className="text-xs text-gray-500">+{dashboardStats.employeeSalaryDue.length - 3} more</p>
                )}
                <div className="pt-2 border-t border-gray-600">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-300">Total Due:</span>
                    <span className="text-xs font-bold text-blue-400">
                      {formatCurrency(dashboardStats.employeeSalaryDue.reduce((sum, p) => sum + p.netPayable, 0))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No outstanding salaries</p>
            )}
          </div>

          {/* Business Partner Outstanding */}
          <div className="bg-gray-750 border border-gray-600 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <BuildingOfficeIcon className="h-4 w-4 text-green-400" />
              <h4 className="text-sm font-medium text-white">Partner Outstanding</h4>
            </div>
            
            {/* Key Metrics Section */}
            <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-gray-800 rounded text-xs">
              <div className="text-center">
                <div className="text-gray-400">Cash in Hand</div>
                <div className="font-semibold text-cyan-400">{formatCurrencyRounded(dashboardStats.pharmacyCashPosition)}</div>
              </div>
              <div className="text-center border-l border-r border-gray-600">
                <div className="text-gray-400">Paid Advance</div>
                <div className="font-semibold text-orange-400">
                  {formatCurrencyRounded(dashboardStats.businessPartnerPayables.reduce((sum, p) => sum + p.totalPaid, 0))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Total Profit</div>
                <div className="font-semibold text-yellow-400">
                  {formatCurrencyRounded(dashboardStats.pharmacyCashPosition + dashboardStats.businessPartnerPayables.reduce((sum, p) => sum + p.totalPaid, 0))}
                </div>
              </div>
            </div>

            {dashboardStats.businessPartnerPayables.length > 0 ? (() => {
              // Calculate exact totals
              const exactTotalEarned = dashboardStats.businessPartnerPayables.reduce((sum, p) => sum + p.totalEarned, 0);
              const exactTotalPaid = dashboardStats.businessPartnerPayables.reduce((sum, p) => sum + p.totalPaid, 0);
              const exactTotalDue = dashboardStats.businessPartnerPayables.reduce((sum, p) => sum + p.netPayable, 0);
              
              // Get amounts for distribution
              const displayedPayables = dashboardStats.businessPartnerPayables.slice(0, 4);
              const earnedAmounts = displayedPayables.map(p => p.totalEarned);
              const paidAmounts = displayedPayables.map(p => p.totalPaid);
              const dueAmounts = displayedPayables.map(p => p.netPayable);
              
              // Distribute rounded amounts that sum to exact totals
              const roundedEarned = distributeRoundedAmounts(earnedAmounts, Math.ceil(exactTotalEarned));
              const roundedPaid = distributeRoundedAmounts(paidAmounts, Math.ceil(exactTotalPaid));
              const roundedDue = distributeRoundedAmounts(dueAmounts, Math.ceil(exactTotalDue));
              
              return (
                <div className="space-y-1">
                  {/* Column Headers */}
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 border-b border-gray-600 pb-1 mb-1">
                    <span>Partner</span>
                    <span className="text-right">Earned</span>
                    <span className="text-right">Paid</span>
                    <span className="text-right">Due</span>
                  </div>
                  
                  {displayedPayables.map((payable, index) => (
                    <div key={payable.stakeholderId} className="grid grid-cols-4 gap-2 items-center py-1 text-xs">
                      <span className="text-gray-200 font-medium truncate">{payable.stakeholderName}</span>
                      <span className="text-blue-400 text-right">{formatCurrency(roundedEarned[index])}</span>
                      <span className="text-orange-400 text-right">{formatCurrency(roundedPaid[index])}</span>
                      <span className="text-green-400 text-right font-medium">{formatCurrency(roundedDue[index])}</span>
                    </div>
                  ))}
                  
                  {dashboardStats.businessPartnerPayables.length > 4 && (
                    <div className="text-xs text-gray-500 text-center py-0.5">
                      +{dashboardStats.businessPartnerPayables.length - 4} more
                    </div>
                  )}
                  
                  {/* Totals */}
                  <div className="grid grid-cols-4 gap-2 text-xs bg-gray-800 rounded p-1.5 font-bold border-t border-gray-600 mt-1">
                    <span className="text-gray-200">TOTALS</span>
                    <span className="text-blue-400 text-right">{formatCurrencyRounded(exactTotalEarned)}</span>
                    <span className="text-orange-400 text-right">{formatCurrencyRounded(exactTotalPaid)}</span>
                    <span className="text-green-400 text-right">{formatCurrencyRounded(exactTotalDue)}</span>
                  </div>
                </div>
              );
            })() : (
              <p className="text-xs text-gray-500 text-center py-2">No outstanding payments</p>
            )}
          </div>

          {/* Doctor Outstanding Payments */}
          <div className="bg-gray-750 border border-gray-600 rounded p-3">
            <div className="flex items-center gap-2 mb-3">
              <UserGroupIcon className="h-4 w-4 text-purple-400" />
              <h4 className="text-sm font-medium text-white">Doctor Outstanding</h4>
            </div>
            {dashboardStats.doctorPayables.length > 0 ? (
              <div className="space-y-2">
                {dashboardStats.doctorPayables.slice(0, 3).map(payable => (
                  <div key={payable.stakeholderId} className="flex justify-between items-center">
                    <span className="text-xs text-gray-300 truncate">{payable.stakeholderName}</span>
                    <span className="text-xs font-medium text-purple-400">{formatCurrency(payable.netPayable)}</span>
                  </div>
                ))}
                {dashboardStats.doctorPayables.length > 3 && (
                  <p className="text-xs text-gray-500">+{dashboardStats.doctorPayables.length - 3} more</p>
                )}
                <div className="pt-2 border-t border-gray-600">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-300">Total Due:</span>
                    <span className="text-xs font-bold text-purple-400">
                      {formatCurrency(dashboardStats.doctorPayables.reduce((sum, p) => sum + p.netPayable, 0))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No outstanding payments</p>
            )}
          </div>

          {/* Distributor Credits */}
          <div className="bg-gray-750 border border-gray-600 rounded p-3">
            <div className="flex items-center gap-2 mb-3">
              <TruckIcon className="h-4 w-4 text-orange-400" />
              <h4 className="text-sm font-medium text-white">Distributor Credits</h4>
            </div>
            {dashboardStats.distributorCredits.length > 0 ? (
              <div className="space-y-2">
                {dashboardStats.distributorCredits.slice(0, 3).map(credit => (
                  <div key={credit.id} className="flex justify-between items-center">
                    <span className="text-xs text-gray-300 truncate">{credit.name}</span>
                    <span className="text-xs font-medium text-orange-400">{formatCurrency(credit.creditBalance)}</span>
                  </div>
                ))}
                {dashboardStats.distributorCredits.length > 3 && (
                  <p className="text-xs text-gray-500">+{dashboardStats.distributorCredits.length - 3} more</p>
                )}
                <div className="pt-2 border-t border-gray-600">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-gray-300">Total Credits:</span>
                    <span className="text-xs font-bold text-orange-400">
                      {formatCurrency(dashboardStats.distributorCredits.reduce((sum, c) => sum + c.creditBalance, 0))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">No outstanding credits</p>
            )}
          </div>
        </div>
      </div>


      {/* Transactions Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">
                Transactions ({totalTransactions} results - Page {currentPage} of {totalPages})
              </h3>
              <div className="flex items-center gap-4 mt-1 text-sm">
                <span className="text-green-400 font-medium">
                  Revenue: {formatCurrency(filteredSummary.revenueSum)}
                </span>
                <span className="text-red-400 font-medium">
                  Expenses: {formatCurrency(filteredSummary.expenseSum)}
                </span>
                <span className="text-blue-400 font-medium">
                  Total: {formatCurrency(filteredSummary.totalSum)}
                </span>
              </div>
            </div>
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
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((transaction) => {
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-700 bg-gray-750">
            <div className="flex items-center justify-between">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <span className="text-sm text-gray-400">per page</span>
              </div>

              {/* Page info and navigation */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalTransactions)} of {totalTransactions}
                </span>
                
                {/* Page navigation */}
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-gray-300"
                    title="First page"
                  >
                    ««
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 text-sm rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-gray-300"
                    title="Previous page"
                  >
                    «
                  </button>
                  
                  {/* Page numbers */}
                  {(() => {
                    const maxVisiblePages = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    if (endPage - startPage < maxVisiblePages - 1) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }
                    
                    const pages = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i)}
                          className={clsx(
                            'px-3 py-1 text-sm rounded border',
                            currentPage === i
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-600 text-gray-300 hover:bg-gray-600'
                          )}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-gray-300"
                    title="Next page"
                  >
                    »
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 text-sm rounded border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-gray-300"
                    title="Last page"
                  >
                    »»
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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