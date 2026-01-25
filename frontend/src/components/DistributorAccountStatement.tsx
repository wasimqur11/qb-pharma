import React, { useState, useMemo } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  CalendarIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import type { AccountStatementEntry } from '../types';
import clsx from 'clsx';

interface DistributorStatementEntry extends AccountStatementEntry {
  creditBalanceChange?: number;
  newCreditBalance?: number;
  billNo?: string;
}

const DistributorAccountStatement: React.FC = () => {
  const { distributors } = useStakeholders();
  const { transactions, getStakeholderTransactions, calculateDistributorCurrentBalance } = useTransactions();
  
  const [selectedDistributor, setSelectedDistributor] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreditTransactions, setShowCreditTransactions] = useState(true);
  const [showPayments, setShowPayments] = useState(true);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  // Helper function to determine cash flow impact for distributor transactions
  const getCashFlowImpact = (category: string): { type: 'Expense' | 'Credit Received' | 'Credit Reduction', color: string } => {
    if (category === 'distributor_payment') {
      return { type: 'Expense', color: 'text-red-400' }; // We pay distributor
    } else if (category === 'distributor_credit_purchase') {
      return { type: 'Credit Received', color: 'text-blue-400' }; // We receive credit from distributor
    } else if (category === 'distributor_credit_note') {
      return { type: 'Credit Reduction', color: 'text-indigo-400' }; // We return items, reducing distributor credit
    } else {
      return { type: 'Credit Received', color: 'text-gray-400' }; // fallback
    }
  };

  // Helper function to get transaction type label
  const getTransactionTypeLabel = (category: string): string => {
    switch (category) {
      case 'distributor_credit_purchase':
        return 'Credit Purchase';
      case 'distributor_credit_note':
        return 'Credit Note';
      case 'distributor_payment':
        return 'Payment';
      default:
        return category;
    }
  };

  const generateDistributorStatement = (distributorId: string): DistributorStatementEntry[] => {
    const distributor = distributors.find(d => d.id === distributorId);
    if (!distributor) return [];

    const distributorTransactions = getStakeholderTransactions(distributorId);
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    // Filter transactions by date range
    const filteredTransactions = distributorTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Sort by date
    const sortedTransactions = filteredTransactions.sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Convert to statement entries with running balance and credit tracking
    const statements: DistributorStatementEntry[] = [];
    let runningBalance = 0;

    // Calculate opening balance: Start with initial creditBalance, then add all transactions before the date range
    let startingCreditBalance = distributor.creditBalance; // Initial balance from offline ledger

    // Get all transactions before the selected date range
    const transactionsBeforePeriod = distributorTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate < startDate;
    });

    // Apply all transactions before the period to get the opening balance
    transactionsBeforePeriod.forEach(transaction => {
      if (transaction.category === 'distributor_credit_purchase') {
        startingCreditBalance += transaction.amount; // Credit purchase increases what we owe
      } else if (transaction.category === 'distributor_credit_note') {
        startingCreditBalance -= transaction.amount; // Credit note decreases what we owe
      } else if (transaction.category === 'distributor_payment') {
        startingCreditBalance -= transaction.amount; // Payment decreases what we owe
      }
    });
    
    let currentCreditBalance = startingCreditBalance;

    // Always add opening balance entry to show the starting position
    // Use the distributor's initialBalanceDate if available, otherwise day before start date
    const openingBalanceDate = distributor.initialBalanceDate
      ? new Date(distributor.initialBalanceDate)
      : (() => {
          const date = new Date(startDate);
          date.setDate(date.getDate() - 1);
          return date;
        })();

    statements.push({
      id: 'opening-balance',
      date: openingBalanceDate,
      description: 'Initial Balance (From Offline Ledger)',
      category: 'distributor_credit_purchase',
      debit: 0,
      credit: 0,
      balance: 0,
      creditBalanceChange: distributor.creditBalance, // Show initial balance as credit purchase
      newCreditBalance: startingCreditBalance
    });
    
    sortedTransactions.forEach((transaction) => {
      let debit = 0;
      let credit = 0;
      let creditBalanceChange = 0;
      
      if (transaction.category === 'distributor_credit_purchase') {
        // Credit purchase increases their credit balance (money we owe them)
        // This is internal tracking and doesn't affect business cash flow
        creditBalanceChange = transaction.amount;
        currentCreditBalance += creditBalanceChange;
      } else if (transaction.category === 'distributor_credit_note') {
        // Credit note decreases their credit balance (returned items reduce what we owe them)
        // Show in Payment column since it reduces what we owe (like a payment)
        debit = transaction.amount;
        creditBalanceChange = -transaction.amount;
        currentCreditBalance = Math.max(0, currentCreditBalance - transaction.amount);
      } else if (transaction.category === 'distributor_payment') {
        // Payment to distributor - decreases what we owe them and is a business expense
        debit = transaction.amount;
        creditBalanceChange = -transaction.amount;
        currentCreditBalance = Math.max(0, currentCreditBalance - transaction.amount);
        runningBalance -= debit;
      }
      
      statements.push({
        id: transaction.id,
        date: new Date(transaction.date),
        description: transaction.description,
        billNo: transaction.billNo,
        category: transaction.category,
        debit,
        credit,
        balance: runningBalance,
        creditBalanceChange,
        newCreditBalance: currentCreditBalance
      });
    });
    
    // Sort all statements by date to ensure proper chronological order
    return statements.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const selectedDistributorData = useMemo(() => {
    if (!selectedDistributor) return null;
    return distributors.find(d => d.id === selectedDistributor);
  }, [selectedDistributor, distributors]);

  const statementEntries = useMemo(() => {
    if (!selectedDistributor) return [];
    return generateDistributorStatement(selectedDistributor);
  }, [selectedDistributor, dateRange, transactions, distributors]);

  const filteredEntries = useMemo(() => {
    // Always keep the opening balance entry, filter the rest
    const openingBalanceEntry = statementEntries.find(entry => entry.id === 'opening-balance');

    let entries = statementEntries.filter(entry => {
      // Always keep opening balance
      if (entry.id === 'opening-balance') return true;

      // Apply search filter to other entries
      return entry.description.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Apply transaction type filters
    if (!showCreditTransactions) {
      // Filter out credit purchases but keep opening balance
      entries = entries.filter(entry =>
        entry.id === 'opening-balance' ||
        !entry.creditBalanceChange ||
        entry.creditBalanceChange <= 0
      );
    }
    if (!showPayments) {
      // Filter out payment entries but keep opening balance
      entries = entries.filter(entry =>
        entry.id === 'opening-balance' ||
        entry.debit === 0
      );
    }

    return entries;
  }, [statementEntries, searchTerm, showCreditTransactions, showPayments]);

  const summaryStats = useMemo(() => {
    if (!selectedDistributorData) {
      return {
        initialBalance: 0,
        totalPayments: 0,
        totalCreditPurchases: 0,
        currentBalance: 0,
        transactionCount: 0
      };
    }

    // Initial balance from offline ledger (treat as credit purchase)
    const initialBalance = selectedDistributorData.creditBalance;

    // Calculate totals excluding the opening balance entry
    const transactionsOnly = filteredEntries.filter(entry => entry.id !== 'opening-balance');
    const totalPayments = transactionsOnly.reduce((sum, entry) => sum + entry.debit, 0);

    // Credit purchases from transactions only (not including initial balance)
    const creditPurchasesFromTransactions = transactionsOnly.reduce((sum, entry) =>
      sum + (entry.creditBalanceChange && entry.creditBalanceChange > 0 ? entry.creditBalanceChange : 0), 0);

    // Total credit purchases = Initial balance + Credit purchase transactions
    const totalCreditPurchases = initialBalance + creditPurchasesFromTransactions;

    const currentBalance = calculateDistributorCurrentBalance(selectedDistributorData.id);

    return {
      initialBalance,
      totalPayments,
      totalCreditPurchases,
      creditPurchasesFromTransactions,
      currentBalance,
      transactionCount: transactionsOnly.length
    };
  }, [statementEntries, filteredEntries, selectedDistributorData, calculateDistributorCurrentBalance]);

  const exportStatement = () => {
    if (!selectedDistributorData || filteredEntries.length === 0) return;
    
    // Create CSV content
    const headers = ['Date', 'Description', 'Bill No.', 'Credit Purchase', 'Payment', 'Credit Balance'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.date.toLocaleDateString(),
        `"${entry.description}"`,
        `"${entry.billNo || ''}"`,
        entry.creditBalanceChange && entry.creditBalanceChange > 0 ? entry.creditBalanceChange : '',
        entry.debit || '',
        entry.newCreditBalance || ''
      ].join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDistributorData.name}_account_statement_${dateRange.from}_to_${dateRange.to}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600 rounded-lg">
            <TruckIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Distributor Account Statements</h2>
            <p className="text-gray-400 text-sm">Track credit purchases and payments for each distributor</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Distributor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Distributor</label>
            <select
              value={selectedDistributor}
              onChange={(e) => setSelectedDistributor(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Choose a distributor...</option>
              {distributors.map(distributor => (
                <option key={distributor.id} value={distributor.id}>
                  {distributor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search Transactions</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Transaction Type Filters */}
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCreditTransactions}
              onChange={(e) => setShowCreditTransactions(e.target.checked)}
              className="text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-300">Show Credit Purchases</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPayments}
              onChange={(e) => setShowPayments(e.target.checked)}
              className="text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-300">Show Payments</span>
          </label>
        </div>
      </div>

      {selectedDistributorData && (
        <>
          {/* Distributor Info & Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distributor Details */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Distributor Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Company:</span>
                  <span className="text-white font-medium">{selectedDistributorData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Contact Person:</span>
                  <span className="text-white">{selectedDistributorData.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Credit Balance:</span>
                  <span className="text-orange-400 font-bold">{formatCurrency(calculateDistributorCurrentBalance(selectedDistributorData.id))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Schedule:</span>
                  <span className="text-white">{selectedDistributorData.paymentSchedule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Payment Percentage:</span>
                  <span className="text-white">{selectedDistributorData.paymentPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Next Payment Due:</span>
                  <span className="text-white">{new Date(selectedDistributorData.nextPaymentDue).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Statement Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-indigo-900/30 border border-indigo-600/50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-gray-300 font-medium">Initial Balance</span>
                    <span className="text-xs text-gray-500">From offline ledger</span>
                  </div>
                  <span className="text-indigo-400 font-bold">{formatCurrency(summaryStats.initialBalance)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-gray-400">Credit Purchases</span>
                    <span className="text-xs text-gray-500">Transactions only</span>
                  </div>
                  <span className="text-orange-400 font-bold">{formatCurrency(summaryStats.creditPurchasesFromTransactions)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-900/30 border border-orange-600/50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-gray-300 font-medium">Total Credit Purchases</span>
                    <span className="text-xs text-gray-500">Initial + Transactions</span>
                  </div>
                  <span className="text-orange-400 font-bold text-lg">{formatCurrency(summaryStats.totalCreditPurchases)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                  <span className="text-gray-400">Total Payments Made</span>
                  <span className="text-green-400 font-bold">{formatCurrency(summaryStats.totalPayments)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-900/30 border border-yellow-600/50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-gray-300 font-medium">Current Balance</span>
                    <span className="text-xs text-gray-500">Total Purchases - Payments</span>
                  </div>
                  <span className="text-yellow-400 font-bold text-lg">{formatCurrency(summaryStats.currentBalance)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                  <span className="text-gray-400">Total Transactions</span>
                  <span className="text-white font-bold">{summaryStats.transactionCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                Showing {filteredEntries.length} transaction{filteredEntries.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={exportStatement}
              disabled={filteredEntries.length === 0}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors",
                filteredEntries.length === 0
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              )}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export Statement
            </button>
          </div>

          {/* Statement Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bill No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction Type</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Cash Flow Impact</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Credit Purchase</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Credit Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                        {selectedDistributor 
                          ? "No transactions found for the selected criteria" 
                          : "Select a distributor to view their account statement"
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, index) => {
                      const isOpeningBalance = entry.id === 'opening-balance';
                      return (
                      <tr key={entry.id} className={clsx(
                        "transition-colors",
                        isOpeningBalance
                          ? "bg-indigo-900/20 border-t-2 border-b-2 border-indigo-600/50 font-semibold"
                          : "hover:bg-gray-750"
                      )}>
                        <td className={clsx("px-4 py-3 text-sm", isOpeningBalance ? "text-indigo-300 font-bold" : "text-gray-300")}>
                          {entry.date.toLocaleDateString()}
                        </td>
                        <td className={clsx("px-4 py-3 text-sm", isOpeningBalance ? "text-indigo-200 font-bold" : "text-white")}>
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {entry.billNo || '-'}
                        </td>
                        <td className={clsx("px-4 py-3 text-sm font-medium", isOpeningBalance ? "text-indigo-200" : "text-white")}>
                          {isOpeningBalance ? 'Initial Balance' : getTransactionTypeLabel(entry.category)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {isOpeningBalance ? (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-900/50 text-indigo-400">
                              Initial Balance
                            </span>
                          ) : (
                            (() => {
                              const impact = getCashFlowImpact(entry.category);
                              return (
                                <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full',
                                  impact.type === 'Expense' ? 'bg-red-900/50 text-red-400' :
                                  impact.type === 'Credit Received' ? 'bg-blue-900/50 text-blue-400' :
                                  impact.type === 'Credit Reduction' ? 'bg-indigo-900/50 text-indigo-400' :
                                  'bg-gray-900/50 text-gray-400'
                                )}>
                                  {impact.type}
                                </span>
                              );
                            })()
                          )}
                        </td>
                        <td className={clsx(
                          "px-4 py-3 text-sm text-right font-medium",
                          isOpeningBalance ? "text-indigo-400 font-bold" : "text-orange-400"
                        )}>
                          {entry.creditBalanceChange && entry.creditBalanceChange > 0
                            ? formatCurrency(entry.creditBalanceChange)
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-400 font-medium">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className={clsx(
                          "px-4 py-3 text-sm text-right font-bold",
                          isOpeningBalance ? "text-indigo-400 text-base" : "text-white font-medium"
                        )}>
                          {entry.newCreditBalance !== undefined
                            ? formatCurrency(entry.newCreditBalance)
                            : '-'
                          }
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DistributorAccountStatement;