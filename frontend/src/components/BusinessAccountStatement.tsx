import React, { useState, useMemo } from 'react';
import {
  BuildingOfficeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  UsersIcon,
  TruckIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import { 
  getTransactionTypeLabel, 
  getTransactionTypeColor,
  PHARMACY_REVENUE_CATEGORIES,
  PHARMACY_EXPENSE_CATEGORIES,
  isPharmacyCreditTransaction,
  isPharmacyDebitTransaction,
  getCashFlowImpact
} from '../constants/transactionTypes';
import { SYSTEM_CONFIG, getDefaultDateRange } from '../constants/systemConfig';
import type { TransactionCategory } from '../types';
import clsx from 'clsx';


interface BusinessSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashFlow: number;
  transactionCount: number;
  avgTransactionValue: number;
}

interface PartnerProfitSummary {
  partnerId: string;
  partnerName: string;
  ownershipPercentage: number;
  shareOfCurrentBalance: number;
  totalWithdrawn: number;
  profitDue: number;
}

const BusinessAccountStatement: React.FC = () => {
  const { businessPartners } = useStakeholders();
  const { transactions, getCashPosition, getPeriodFilteredStats, getBusinessPartnerPayables } = useTransactions();
  
  const [dateRange, setDateRange] = useState(getDefaultDateRange('business'));
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('90days');

  const formatCurrency = (amount: number) => `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString()}`;

  // Use real transaction data instead of generated mock data

  const allTransactions = useMemo(() => {
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    
    return transactions
      .filter(t => {
        // Filter for pharmacy business transactions only (excluding doctor-specific transactions)
        const allPharmacyCategories = [...PHARMACY_REVENUE_CATEGORIES, ...PHARMACY_EXPENSE_CATEGORIES, 'distributor_credit_purchase'];
        const isPharmacyTransaction = allPharmacyCategories.includes(t.category);
        
        const transactionDate = new Date(t.date);
        return isPharmacyTransaction && transactionDate >= startDate && transactionDate <= endDate;
      })
      .map(t => {
        // Get stakeholder name from the appropriate context
        let stakeholderName = '';
        if (t.stakeholderId) {
          if (t.stakeholderType === 'business_partner') {
            stakeholderName = businessPartners.find(bp => bp.id === t.stakeholderId)?.name || 'Unknown Business Partner';
          } else if (t.stakeholderType === 'employee') {
            stakeholderName = t.stakeholderId; // For now, using ID as name - could be enhanced with employee context
          } else if (t.stakeholderType === 'distributor') {
            stakeholderName = t.stakeholderId; // For now, using ID as name - could be enhanced with distributor context
          } else if (t.stakeholderType === 'patient') {
            stakeholderName = t.stakeholderId; // For now, using ID as name - could be enhanced with patient context
          } else if (t.stakeholderType === 'doctor') {
            stakeholderName = t.stakeholderId; // For now, using ID as name - could be enhanced with doctor context
          } else {
            stakeholderName = 'Internal';
          }
        } else {
          stakeholderName = 'Internal';
        }
        
        // Use centralized classification logic
        const isCredit = isPharmacyCreditTransaction(t.category);
        const isDebit = isPharmacyDebitTransaction(t.category);
        
        return {
          id: t.id,
          date: t.date,
          category: t.category,
          description: t.description,
          stakeholderName,
          stakeholderType: t.stakeholderType,
          debit: isDebit ? t.amount : 0,
          credit: isCredit ? t.amount : 0,
          balance: 0, // Will be calculated below
          reference: `TXN${t.id.slice(-6)}`
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [dateRange, transactions, businessPartners]);

  const filteredTransactions = useMemo(() => {
    const filtered = allTransactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (transaction.stakeholderName && transaction.stakeholderName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
    
    // Sort transactions chronologically (oldest first) for proper balance calculation
    const chronological = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate running balances properly using period-based approach
    let runningBalance = 0;
    
    // For proper balance calculation, we need to know the opening balance at the start of the period
    if (chronological.length > 0) {
      // Get period stats to understand the starting position
      const periodStartDate = new Date(dateRange.from);
      const periodEndDate = new Date(dateRange.to);
      
      // Calculate cumulative balance up to the period start using all transactions (not just filtered ones)
      const allPharmacyCategories = [...PHARMACY_REVENUE_CATEGORIES, ...PHARMACY_EXPENSE_CATEGORIES, 'distributor_credit_purchase'];
      const allBusinessTransactions = transactions
        .filter(t => allPharmacyCategories.includes(t.category))
        .map(t => {
          const isCredit = PHARMACY_REVENUE_CATEGORIES.includes(t.category);
          const isDebit = PHARMACY_EXPENSE_CATEGORIES.includes(t.category);
          
          return {
            date: t.date,
            credit: isCredit ? t.amount : 0,
            debit: isDebit ? t.amount : 0
          };
        });
      
      const transactionsBeforePeriod = allBusinessTransactions.filter(t => new Date(t.date) < periodStartDate);
      const openingBalance = transactionsBeforePeriod.reduce((balance, t) => {
        return balance + t.credit - t.debit;
      }, 0);
      
      runningBalance = openingBalance;
    }
    
    // Calculate running balances chronologically
    const withBalances = chronological.map(t => {
      runningBalance += t.credit - t.debit;
      return { ...t, balance: runningBalance };
    });
    
    // Return in reverse chronological order (newest first) for display
    return withBalances.reverse();
  }, [allTransactions, searchTerm, categoryFilter, getCashPosition]);

  const businessSummary = useMemo((): BusinessSummary => {
    // Use actual TransactionContext methods for consistent calculations
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const periodStats = getPeriodFilteredStats(startDate, endDate);
    
    // For pharmacy business statement, use pharmacy-specific metrics
    const totalRevenue = periodStats.pharmacyRevenue;
    const totalExpenses = periodStats.pharmacyExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const cashFlow = periodStats.pharmacyCashPosition;
    const transactionCount = filteredTransactions.length;
    const avgTransactionValue = transactionCount > 0 ? (totalRevenue + totalExpenses) / transactionCount : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      cashFlow,
      transactionCount,
      avgTransactionValue
    };
  }, [filteredTransactions, dateRange, getPeriodFilteredStats]);

  const partnerProfitSummary = useMemo((): PartnerProfitSummary[] => {
    // Use period-filtered business partner payables for accurate calculations
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const periodPayables = getBusinessPartnerPayables(startDate, endDate);
    
    return businessPartners.map(partner => {
      const payable = periodPayables.find(p => p.stakeholderId === partner.id);
      
      if (payable) {
        return {
          partnerId: partner.id,
          partnerName: partner.name,
          ownershipPercentage: partner.ownershipPercentage,
          shareOfCurrentBalance: payable.totalEarned,
          totalWithdrawn: payable.totalPaid,
          profitDue: payable.netPayable
        };
      } else {
        // If no payable found, partner has no earnings in this period
        return {
          partnerId: partner.id,
          partnerName: partner.name,
          ownershipPercentage: partner.ownershipPercentage,
          shareOfCurrentBalance: 0,
          totalWithdrawn: 0,
          profitDue: 0
        };
      }
    });
  }, [businessPartners, dateRange, getBusinessPartnerPayables]);

  const setCategoryColor = (category: TransactionCategory) => {
    return getTransactionTypeColor(category);
  };

  const getCategoryIcon = (category: TransactionCategory) => {
    const iconMap = {
      pharmacy_sale: CurrencyDollarIcon,
      consultation_fee: UserGroupIcon,
      distributor_payment: TruckIcon,
      doctor_expense: UserGroupIcon,
      sales_profit_distribution: BanknotesIcon,
      employee_payment: UsersIcon,
      clinic_expense: BuildingOfficeIcon,
      patient_payment: CurrencyDollarIcon,
      patient_credit_sale: CurrencyDollarIcon,
      distributor_credit_purchase: TruckIcon,
      distributor_credit_note: TruckIcon
    } as const;
    return iconMap[category] || CurrencyDollarIcon;
  };

  const getCategoryLabel = (category: TransactionCategory) => {
    return getTransactionTypeLabel(category);
  };


  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    let fromDate;

    switch (period) {
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
        fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    setDateRange({
      from: fromDate.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
  };

  const exportStatement = () => {
    alert(`Exporting business account statement (${filteredTransactions.length} transactions) - Demo functionality`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Pharmacy Business Account Statement</h2>
          <p className="text-gray-400 text-sm">Pharmacy business financial overview (Doctor accounts are separate)</p>
        </div>
        <button
          onClick={exportStatement}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export Statement
        </button>
      </div>

      {/* Business Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Total Revenue</p>
          </div>
          <p className="text-xl font-bold text-green-400">{formatCurrency(businessSummary.totalRevenue)}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Total Expenses</p>
          </div>
          <p className="text-xl font-bold text-red-400">{formatCurrency(businessSummary.totalExpenses)}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Net Profit</p>
          </div>
          <p className={clsx(
            "text-xl font-bold",
            businessSummary.netProfit >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {formatCurrency(businessSummary.netProfit)}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BanknotesIcon className="h-4 w-4 text-purple-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Cash Flow</p>
          </div>
          <p className={clsx(
            "text-xl font-bold",
            businessSummary.cashFlow >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {formatCurrency(businessSummary.cashFlow)}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="h-4 w-4 text-cyan-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Transactions</p>
          </div>
          <p className="text-xl font-bold text-white">{businessSummary.transactionCount}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-4 w-4 text-orange-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Avg Transaction</p>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(businessSummary.avgTransactionValue)}</p>
        </div>
      </div>

      {/* Partner Profit Summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <UserGroupIcon className="h-5 w-5 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">Business Owner Profit Due Summary</h3>
          <p className="text-gray-400 text-sm ml-auto">Based on current business balance and ownership percentages</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {partnerProfitSummary.map(partner => (
            <div key={partner.partnerId} className="bg-gray-750 border border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-base font-semibold text-white">{partner.partnerName}</h4>
                  <p className="text-sm text-gray-400">{partner.ownershipPercentage}% Ownership</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Profit Due</p>
                  <p className={clsx(
                    "text-lg font-bold",
                    partner.profitDue >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {formatCurrency(Math.abs(partner.profitDue))}
                  </p>
                  {partner.profitDue < 0 && (
                    <p className="text-xs text-red-400">Overpaid</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Share of Balance:</span>
                  <span className="text-blue-400">{formatCurrency(partner.shareOfCurrentBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Withdrawn:</span>
                  <span className="text-orange-400">{formatCurrency(partner.totalWithdrawn)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-600">
                  <span className="text-gray-300 font-medium">Net Due:</span>
                  <span className={clsx(
                    "font-semibold",
                    partner.profitDue >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {partner.profitDue >= 0 ? '+' : '-'}{formatCurrency(Math.abs(partner.profitDue))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium">Total Profit Due to All Business Owners:</span>
            <span className="text-xl font-bold text-green-400">
              {formatCurrency(partnerProfitSummary.reduce((sum, p) => sum + Math.max(0, p.profitDue), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Filters & Period</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Quick Period Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last 1 Year</option>
            </select>
          </div>

          {/* Custom Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TransactionCategory | 'all')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Pharmacy Business Types</option>
              <option value="pharmacy_sale">Pharmacy Sales (Revenue)</option>
              <option value="distributor_payment">Distributor Payments (Expense)</option>
              <option value="sales_profit_distribution">Sales Profit Distributions (Distribution)</option>
              <option value="employee_payment">Employee Payments (Expense)</option>
              <option value="clinic_expense">Clinic Expenses (Expense)</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions, stakeholders, or references..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full"
            />
          </div>
        </div>
      </div>

      {/* Statement Period Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BuildingOfficeIcon className="h-5 w-5 text-blue-400" />
              QB Pharmacy - Business Account Statement (Pharmacy Operations Only)
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Statement Period: {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
            </p>
            <p className="text-gray-400 text-sm">
              Generated on: {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Current Balance</p>
            <p className={clsx(
              "text-2xl font-bold",
              getCashPosition() >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {formatCurrency(getCashPosition())}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">
            Business Transactions ({filteredTransactions.length} entries)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Cash Flow Impact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Debit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Credit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  const Icon = getCategoryIcon(transaction.category);
                  
                  return (
                    <tr key={transaction.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                        {transaction.date.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                        {transaction.reference}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Icon className={clsx('h-4 w-4', setCategoryColor(transaction.category))} />
                          <span className={clsx('text-xs font-medium', setCategoryColor(transaction.category))}>
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
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs">
                        <div>
                          <p className="truncate">{transaction.description}</p>
                          {transaction.stakeholderName && (
                            <p className="text-xs text-gray-500 mt-0.5">{transaction.stakeholderName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        {transaction.debit > 0 ? (
                          <span className="text-red-400 font-semibold">{formatCurrency(transaction.debit)}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        {transaction.credit > 0 ? (
                          <span className="text-green-400 font-semibold">{formatCurrency(transaction.credit)}</span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <span className={clsx(
                          'font-semibold',
                          transaction.balance >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {formatCurrency(Math.abs(transaction.balance))}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No transactions found for the selected criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessAccountStatement;