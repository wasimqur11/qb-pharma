import React, { useState, useMemo } from 'react';
import {
  UserGroupIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import { SYSTEM_CONFIG, getDefaultDateRange } from '../constants/systemConfig';
import type { TransactionCategory } from '../types';
import clsx from 'clsx';

interface DoctorTransaction {
  id: string;
  date: Date;
  category: 'consultation_fee' | 'doctor_expense';
  description: string;
  doctorId: string;
  doctorName: string;
  debit: number;
  credit: number;
  balance: number;
  reference?: string;
}

interface DoctorSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  avgTransactionValue: number;
}

const DoctorAccountStatement: React.FC = () => {
  const { doctors } = useStakeholders();
  const { transactions, getDoctorRevenue, getDoctorExpenses } = useTransactions();
  
  const [dateRange, setDateRange] = useState(getDefaultDateRange('doctor'));
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'consultation_fee' | 'doctor_expense' | 'all'>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState('90days');

  const formatCurrency = (amount: number) => `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString()}`;


  const allTransactions = useMemo(() => {
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    
    return transactions
      .filter(t => {
        // Filter for doctor-specific transactions only
        const isDoctorTransaction = ['consultation_fee', 'doctor_expense'].includes(t.category);
        const transactionDate = new Date(t.date);
        return isDoctorTransaction && transactionDate >= startDate && transactionDate <= endDate;
      })
      .map(t => {
        const doctor = doctors.find(d => d.id === t.stakeholderId);
        const isCredit = t.category === 'consultation_fee';
        
        return {
          id: t.id,
          date: t.date,
          category: t.category as 'consultation_fee' | 'doctor_expense',
          description: t.description,
          doctorId: t.stakeholderId || 'unknown',
          doctorName: doctor?.name || 'Unknown Doctor',
          debit: isCredit ? 0 : t.amount,
          credit: isCredit ? t.amount : 0,
          balance: 0, // Will be calculated below
          reference: `DOC${t.id.slice(-6)}`
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [dateRange, transactions, doctors]);

  const filteredTransactions = useMemo(() => {
    // Use real transactions from allTransactions instead of mock data
    const filtered = allTransactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
      const matchesDoctor = doctorFilter === 'all' || transaction.doctorId === doctorFilter;
      return matchesSearch && matchesCategory && matchesDoctor;
    });
    
    // Calculate running balances chronologically
    const chronological = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Start with configurable opening balance
    let runningBalance = SYSTEM_CONFIG.DEFAULT_DOCTOR_OPENING_BALANCE;
    
    const withBalances = chronological.map(t => {
      runningBalance += t.credit - t.debit;
      return { ...t, balance: runningBalance };
    });
    
    // Return in reverse chronological order (newest first) for display
    return withBalances.reverse();
  }, [allTransactions, searchTerm, categoryFilter, doctorFilter]);

  const doctorSummary = useMemo((): DoctorSummary => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.credit, 0);
    const totalExpenses = filteredTransactions.reduce((sum, t) => sum + t.debit, 0);
    const netIncome = totalRevenue - totalExpenses;
    const transactionCount = filteredTransactions.length;
    const avgTransactionValue = transactionCount > 0 ? (totalRevenue + totalExpenses) / transactionCount : 0;

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      transactionCount,
      avgTransactionValue
    };
  }, [filteredTransactions]);

  const getCategoryColor = (category: 'consultation_fee' | 'doctor_expense') => {
    return category === 'consultation_fee' ? 'text-blue-400' : 'text-red-400';
  };

  const getCategoryLabel = (category: 'consultation_fee' | 'doctor_expense') => {
    return category === 'consultation_fee' ? 'Consultation Fee' : 'Doctor Expense';
  };

  // Helper function to determine cash flow impact
  const getCashFlowImpact = (category: 'consultation_fee' | 'doctor_expense'): { type: 'Revenue' | 'Expense', color: string } => {
    if (category === 'consultation_fee') {
      return { type: 'Revenue', color: 'text-green-400' };
    } else {
      return { type: 'Expense', color: 'text-red-400' };
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
    alert(`Exporting doctor account statement (${filteredTransactions.length} transactions) - Demo functionality`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Doctor Account Statement</h2>
          <p className="text-gray-400 text-sm">Doctor consultation fees and expenses (Independent from pharmacy business)</p>
        </div>
        <button
          onClick={exportStatement}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Export Statement
        </button>
      </div>

      {/* Doctor Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingUpIcon className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Consultation Revenue</p>
          </div>
          <p className="text-xl font-bold text-blue-400">{formatCurrency(doctorSummary.totalRevenue)}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Doctor Expenses</p>
          </div>
          <p className="text-xl font-bold text-red-400">{formatCurrency(doctorSummary.totalExpenses)}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-4 w-4 text-green-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Net Income</p>
          </div>
          <p className={clsx(
            "text-xl font-bold",
            doctorSummary.netIncome >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {formatCurrency(doctorSummary.netIncome)}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CurrencyDollarIcon className="h-4 w-4 text-cyan-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Transactions</p>
          </div>
          <p className="text-xl font-bold text-white">{doctorSummary.transactionCount}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ChartBarIcon className="h-4 w-4 text-orange-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Avg Transaction</p>
          </div>
          <p className="text-xl font-bold text-white">{formatCurrency(doctorSummary.avgTransactionValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Filters & Period</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          {/* Transaction Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Doctor Transactions</option>
              <option value="consultation_fee">Consultation Fees (Revenue)</option>
              <option value="doctor_expense">Doctor Expenses</option>
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Specific Doctor</label>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions, doctors, or references..."
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
              <UserGroupIcon className="h-5 w-5 text-blue-400" />
              QB Pharmacy - Doctor Account Statement (Doctor Operations Only)
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Statement Period: {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
            </p>
            <p className="text-gray-400 text-sm">
              Generated on: {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Current Doctor Balance</p>
            <p className={clsx(
              "text-2xl font-bold",
              (getDoctorRevenue() - getDoctorExpenses()) >= 0 ? "text-green-400" : "text-red-400"
            )}>
              {formatCurrency(getDoctorRevenue() - getDoctorExpenses())}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">
            Doctor Transactions ({filteredTransactions.length} entries)
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
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                      {transaction.date.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                      {transaction.reference}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserGroupIcon className={clsx('h-4 w-4', getCategoryColor(transaction.category))} />
                        <span className={clsx('text-xs font-medium', getCategoryColor(transaction.category))}>
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
                        <p className="text-xs text-gray-500 mt-0.5">Dr. {transaction.doctorName}</p>
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
                        <span className="text-blue-400 font-semibold">{formatCurrency(transaction.credit)}</span>
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
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    No doctor transactions found for the selected criteria
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

export default DoctorAccountStatement;