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
import { getTransactionTypeLabel, getTransactionTypeColor } from '../constants/transactionTypes';
import type { TransactionCategory } from '../types';
import clsx from 'clsx';

interface BusinessTransaction {
  id: string;
  date: Date;
  category: TransactionCategory;
  description: string;
  stakeholderName?: string;
  stakeholderType?: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

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
  const { transactions, getTotalRevenue, getCashPosition } = useTransactions();
  
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
    to: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('90days');

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const generateBusinessTransactions = (): BusinessTransaction[] => {
    const transactions: BusinessTransaction[] = [];
    let runningBalance = 100000; // Starting balance - more realistic
    
    // PHARMACY BUSINESS TRANSACTIONS ONLY
    // Consultation fees and doctor expenses are separate doctor account transactions
    const transactionTemplates = [
      // PHARMACY REVENUE transactions (more frequent, smaller amounts)
      { category: 'pharmacy_sale', description: 'Daily pharmacy sales', credit: 8000, debit: 0, weight: 0.3 },
      { category: 'pharmacy_sale', description: 'Medicine retail sales', credit: 12000, debit: 0, weight: 0.25 },
      { category: 'pharmacy_sale', description: 'OTC medicines sales', credit: 5000, debit: 0, weight: 0.2 },
      
      // PHARMACY EXPENSE transactions (less frequent, larger amounts)
      { category: 'distributor_payment', description: 'Medicine stock purchase', debit: 60000, credit: 0, stakeholder: 'Pharma Solutions Ltd', type: 'distributor', weight: 0.08 },
      { category: 'distributor_payment', description: 'Medical supplies purchase', debit: 35000, credit: 0, stakeholder: 'MedSupply Corporation', type: 'distributor', weight: 0.06 },
      { category: 'employee_payment', description: 'Staff salary payment', debit: 45000, credit: 0, stakeholder: 'Ali Hassan', type: 'employee', weight: 0.03 },
      { category: 'employee_payment', description: 'Pharmacist salary', debit: 40000, credit: 0, stakeholder: 'Ayesha Khan', type: 'employee', weight: 0.03 },
      { category: 'business_partner_payment', description: 'Business partner commission payment', debit: 8000, credit: 0, stakeholder: 'Karachi Business Partners', type: 'business_partner', weight: 0.02 },
      { category: 'clinic_expense', description: 'Rent and utilities', debit: 25000, credit: 0, weight: 0.02 },
      { category: 'clinic_expense', description: 'Equipment maintenance', debit: 8000, credit: 0, weight: 0.01 },
      
      // BUSINESS PARTNER PROFIT DISTRIBUTIONS (quarterly distributions)
      { category: 'partner_profit', description: 'Quarterly profit distribution', debit: 80000, credit: 0, stakeholder: 'Ahmed Khan', type: 'partner', weight: 0.005 },
      { category: 'partner_profit', description: 'Quarterly profit distribution', debit: 70000, credit: 0, stakeholder: 'Sarah Ali', type: 'partner', weight: 0.005 },
      { category: 'partner_profit', description: 'Quarterly profit distribution', debit: 50000, credit: 0, stakeholder: 'Dr. Wasim Qureshi', type: 'partner', weight: 0.005 },
    ];

    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Create weighted template selection
    const weightedTemplates: any[] = [];
    transactionTemplates.forEach(template => {
      const count = Math.round(template.weight * 1000); // Scale weights
      for (let i = 0; i < count; i++) {
        weightedTemplates.push(template);
      }
    });
    
    // Generate transactions for each day
    for (let day = 0; day <= daysDiff; day++) {
      const currentDate = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);
      
      // Generate 1-3 transactions per day (more realistic)
      const dailyTransactions = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < dailyTransactions; i++) {
        const template = weightedTemplates[Math.floor(Math.random() * weightedTemplates.length)];
        const debitAmount = template.debit;
        const creditAmount = template.credit;
        
        runningBalance += creditAmount - debitAmount;
        
        transactions.push({
          id: `bus-${day}-${i}`,
          date: new Date(currentDate.getTime() + i * 3600000), // Spread transactions throughout the day
          category: template.category as TransactionCategory,
          description: template.stakeholder ? `${template.description} - ${template.stakeholder}` : template.description,
          stakeholderName: template.stakeholder,
          stakeholderType: template.type,
          debit: debitAmount,
          credit: creditAmount,
          balance: runningBalance,
          reference: `TXN${day.toString().padStart(3, '0')}${i.toString().padStart(2, '0')}`
        });
      }
    }

    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const allTransactions = useMemo(() => {
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    
    return transactions
      .filter(t => {
        // Filter for pharmacy business transactions only
        const isPharmacyTransaction = [
          'pharmacy_sale', 'distributor_payment', 'sales_profit_distribution',
          'employee_payment', 'clinic_expense', 'patient_payment', 'patient_credit_sale'
        ].includes(t.category);
        
        const transactionDate = new Date(t.date);
        return isPharmacyTransaction && transactionDate >= startDate && transactionDate <= endDate;
      })
      .map(t => {
        const stakeholderName = t.stakeholderId ? 
          (businessPartners.find(bp => bp.id === t.stakeholderId)?.name || 'Unknown Stakeholder') : 
          undefined;
        
        const isCredit = ['pharmacy_sale', 'patient_payment', 'patient_credit_sale'].includes(t.category);
        
        return {
          id: t.id,
          date: t.date,
          category: t.category,
          description: t.description,
          stakeholderName,
          stakeholderType: t.stakeholderType,
          debit: isCredit ? 0 : t.amount,
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
    
    // Calculate running balances
    let runningBalance = 100000; // Starting balance
    return filtered.reverse().map(t => {
      runningBalance += t.credit - t.debit;
      return { ...t, balance: runningBalance };
    }).reverse();
  }, [allTransactions, searchTerm, categoryFilter]);

  const businessSummary = useMemo((): BusinessSummary => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.credit, 0);
    const totalExpenses = filteredTransactions.reduce((sum, t) => sum + t.debit, 0);
    const netProfit = totalRevenue - totalExpenses;
    const cashFlow = netProfit;
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
  }, [filteredTransactions]);

  const partnerProfitSummary = useMemo((): PartnerProfitSummary[] => {
    // Calculate running balance for filtered transactions
    let runningBalance = 100000; // Starting balance
    const transactionsWithBalance = filteredTransactions.map(t => {
      const newBalance = runningBalance + t.credit - t.debit;
      runningBalance = newBalance;
      return { ...t, balance: newBalance };
    }).reverse();
    
    const currentBalance = transactionsWithBalance[transactionsWithBalance.length - 1]?.balance || 100000;
    
    return businessPartners.map(partner => {
      // Calculate partner's share of current business balance
      const shareOfCurrentBalance = (currentBalance * partner.ownershipPercentage) / 100;
      
      // Calculate total withdrawn by this partner (sum of all sales_profit_distribution transactions for this partner)
      const totalWithdrawn = allTransactions
        .filter(t => t.category === 'sales_profit_distribution' && t.stakeholderName === partner.name)
        .reduce((sum, t) => sum + t.debit, 0);
      
      // Profit due = Share of current balance - Total already withdrawn
      const profitDue = shareOfCurrentBalance - totalWithdrawn;
      
      return {
        partnerId: partner.id,
        partnerName: partner.name,
        ownershipPercentage: partner.ownershipPercentage,
        shareOfCurrentBalance,
        totalWithdrawn,
        profitDue
      };
    });
  }, [filteredTransactions, allTransactions]);

  const setCategoryColor = (category: TransactionCategory) => {
    return getTransactionTypeColor(category);
  };

  const getCategoryIcon = (category: TransactionCategory) => {
    const icons = {
      pharmacy_sale: CurrencyDollarIcon,
      consultation_fee: UserGroupIcon,
      distributor_payment: TruckIcon,
      doctor_expense: UserGroupIcon,
      sales_profit_distribution: BanknotesIcon,
      employee_payment: UsersIcon,
      clinic_expense: BuildingOfficeIcon
    };
    return icons[category];
  };

  const getCategoryLabel = (category: TransactionCategory) => {
    return getTransactionTypeLabel(category);
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
              onChange={(e) => setCategoryFilter(e.target.value as any)}
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
              filteredTransactions[0]?.balance >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {formatCurrency(filteredTransactions[0]?.balance || 0)}
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