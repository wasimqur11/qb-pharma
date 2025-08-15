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
}

const DistributorAccountStatement: React.FC = () => {
  const { distributors } = useStakeholders();
  const { transactions, getStakeholderTransactions } = useTransactions();
  
  const [selectedDistributor, setSelectedDistributor] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreditTransactions, setShowCreditTransactions] = useState(true);
  const [showPayments, setShowPayments] = useState(true);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

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
    let currentCreditBalance = distributor.creditBalance;
    
    // Calculate the starting credit balance for the selected date range
    let startingCreditBalance = 0;
    const allTransactions = getStakeholderTransactions(distributorId);
    
    // Calculate the proper starting credit balance for the selected date range
    if (distributor.initialBalanceDate) {
      const initialBalanceDate = new Date(distributor.initialBalanceDate);
      
      // If initial balance date is within the selected range, show it as first entry
      // This should always show regardless of whether there are other transactions
      if (initialBalanceDate >= startDate && initialBalanceDate <= new Date(dateRange.to)) {
        statements.push({
          id: 'initial-balance',
          date: initialBalanceDate,
          description: 'Initial Credit Balance',
          debit: 0,
          credit: 0,
          balance: 0,
          creditBalanceChange: distributor.creditBalance,
          newCreditBalance: distributor.creditBalance
        });
        startingCreditBalance = distributor.creditBalance;
      } else if (initialBalanceDate < startDate) {
        // Initial balance is before our date range, calculate balance at start of range
        startingCreditBalance = distributor.creditBalance;
        
        // Adjust for transactions that happened after initial balance but before the date range
        const transactionsBeforeRange = allTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate > initialBalanceDate && transactionDate < startDate;
        });
        
        transactionsBeforeRange.forEach(transaction => {
          if (transaction.category === 'distributor_credit_purchase') {
            startingCreditBalance += transaction.amount;
          } else if (transaction.category === 'distributor_payment') {
            startingCreditBalance = Math.max(0, startingCreditBalance - transaction.amount);
          }
        });
      } else {
        // Initial balance is after our date range, calculate from zero
        startingCreditBalance = 0;
        const transactionsBeforeRange = allTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate < startDate;
        });
        
        transactionsBeforeRange.forEach(transaction => {
          if (transaction.category === 'distributor_credit_purchase') {
            startingCreditBalance += transaction.amount;
          } else if (transaction.category === 'distributor_payment') {
            startingCreditBalance = Math.max(0, startingCreditBalance - transaction.amount);
          }
        });
      }
    } else {
      // No initial balance date, calculate from all transactions before the date range
      startingCreditBalance = 0;
      const transactionsBeforeRange = allTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate < startDate;
      });
      
      transactionsBeforeRange.forEach(transaction => {
        if (transaction.category === 'distributor_credit_purchase') {
          startingCreditBalance += transaction.amount;
        } else if (transaction.category === 'distributor_payment') {
          startingCreditBalance = Math.max(0, startingCreditBalance - transaction.amount);
        }
      });
    }
    
    // Add opening balance entry if we have transactions, no initial balance entry was added, and we have a starting balance
    if (sortedTransactions.length > 0 && statements.length === 0 && startingCreditBalance > 0) {
      statements.push({
        id: 'opening-balance',
        date: startDate,
        description: 'Opening Balance',
        debit: 0,
        credit: 0,
        balance: 0,
        creditBalanceChange: 0,
        newCreditBalance: startingCreditBalance
      });
    }
    
    currentCreditBalance = startingCreditBalance;
    
    sortedTransactions.forEach((transaction) => {
      let debit = 0;
      let credit = 0;
      let creditBalanceChange = 0;
      
      if (transaction.category === 'distributor_credit_purchase') {
        // Credit purchase increases their credit balance (money we owe them)
        // This is internal tracking and doesn't affect business cash flow
        creditBalanceChange = transaction.amount;
        currentCreditBalance += creditBalanceChange;
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
    let entries = statementEntries.filter(entry =>
      entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply transaction type filters
    if (!showCreditTransactions) {
      // Filter out credit purchases but keep initial balance and opening balance entries
      entries = entries.filter(entry => 
        !entry.creditBalanceChange || 
        entry.creditBalanceChange <= 0 || 
        entry.id === 'initial-balance' || 
        entry.id === 'opening-balance'
      );
    }
    if (!showPayments) {
      // Filter out payment entries but keep initial balance and opening balance entries
      entries = entries.filter(entry => 
        entry.debit === 0 || 
        entry.id === 'initial-balance' || 
        entry.id === 'opening-balance'
      );
    }

    return entries;
  }, [statementEntries, searchTerm, showCreditTransactions, showPayments]);

  const summaryStats = useMemo(() => {
    const totalPayments = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCreditPurchases = filteredEntries.reduce((sum, entry) => 
      sum + (entry.creditBalanceChange && entry.creditBalanceChange > 0 ? entry.creditBalanceChange : 0), 0);
    const currentBalance = selectedDistributorData?.creditBalance || 0;
    
    return {
      totalPayments,
      totalCreditPurchases,
      currentBalance,
      transactionCount: filteredEntries.length
    };
  }, [filteredEntries, selectedDistributorData]);

  const exportStatement = () => {
    if (!selectedDistributorData || filteredEntries.length === 0) return;
    
    // Create CSV content
    const headers = ['Date', 'Description', 'Credit Purchase', 'Payment', 'Credit Balance'];
    const csvContent = [
      headers.join(','),
      ...filteredEntries.map(entry => [
        entry.date.toLocaleDateString(),
        `"${entry.description}"`,
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
                  <span className="text-orange-400 font-bold">{formatCurrency(selectedDistributorData.creditBalance)}</span>
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
                <div className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                  <span className="text-gray-400">Total Credit Purchases</span>
                  <span className="text-orange-400 font-bold">{formatCurrency(summaryStats.totalCreditPurchases)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                  <span className="text-gray-400">Total Payments Made</span>
                  <span className="text-green-400 font-bold">{formatCurrency(summaryStats.totalPayments)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-750 rounded-lg">
                  <span className="text-gray-400">Current Balance</span>
                  <span className="text-white font-bold">{formatCurrency(summaryStats.currentBalance)}</span>
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Credit Purchase</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Credit Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        {selectedDistributor 
                          ? "No transactions found for the selected criteria" 
                          : "Select a distributor to view their account statement"
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry, index) => (
                      <tr key={entry.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {entry.date.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-orange-400 font-medium">
                          {entry.creditBalanceChange && entry.creditBalanceChange > 0 
                            ? formatCurrency(entry.creditBalanceChange)
                            : '-'
                          }
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-400 font-medium">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-white font-medium">
                          {entry.newCreditBalance !== undefined 
                            ? formatCurrency(entry.newCreditBalance)
                            : '-'
                          }
                        </td>
                      </tr>
                    ))
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