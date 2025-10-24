import React, { useState, useMemo } from 'react';
import {
  CalendarIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useTransactions } from '../contexts/TransactionContext';
import { SYSTEM_CONFIG } from '../constants/systemConfig';
import clsx from 'clsx';

interface DailyBalance {
  date: string;
  openingBalance: number;
  credits: number;
  debits: number;
  closingBalance: number;
  creditTransactions: number;
  debitTransactions: number;
}

const DailyCreditDebitReport: React.FC = () => {
  const { transactions } = useTransactions();

  // Date range state
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Credit categories (Money IN to pharmacy)
  const creditCategories = ['pharmacy_sale', 'patient_payment'];

  // Debit categories (Money OUT from pharmacy)
  const debitCategories = ['distributor_payment', 'employee_payment', 'clinic_expense', 'patient_credit_sale'];

  // Note: distributor_credit_note is excluded - it's not a cash transaction, just reduces distributor debt

  // Calculate daily balances
  const dailyBalances = useMemo(() => {
    // Filter pharmacy transactions only (exclude doctor transactions)
    const pharmacyTransactions = transactions.filter(t =>
      [...creditCategories, ...debitCategories].includes(t.category)
    );

    // Filter by date range
    const filteredTransactions = pharmacyTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include entire end date

      return transactionDate >= fromDate && transactionDate <= toDate;
    });

    // Group transactions by date
    const transactionsByDate = new Map<string, typeof filteredTransactions>();

    filteredTransactions.forEach(transaction => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];
      if (!transactionsByDate.has(dateKey)) {
        transactionsByDate.set(dateKey, []);
      }
      transactionsByDate.get(dateKey)!.push(transaction);
    });

    // Generate all dates in range
    const allDates: string[] = [];
    const currentDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate opening balance (all transactions before dateFrom)
    const openingBalance = pharmacyTransactions
      .filter(t => new Date(t.date) < new Date(dateFrom))
      .reduce((balance, t) => {
        if (creditCategories.includes(t.category)) {
          return balance + t.amount;
        } else if (debitCategories.includes(t.category)) {
          return balance - t.amount;
        }
        return balance;
      }, 0);

    // Calculate daily balances
    let runningBalance = openingBalance;
    const dailyData: DailyBalance[] = [];

    allDates.forEach(date => {
      const dayTransactions = transactionsByDate.get(date) || [];

      const credits = dayTransactions
        .filter(t => creditCategories.includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);

      const debits = dayTransactions
        .filter(t => debitCategories.includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);

      const creditCount = dayTransactions.filter(t => creditCategories.includes(t.category)).length;
      const debitCount = dayTransactions.filter(t => debitCategories.includes(t.category)).length;

      const dayOpeningBalance = runningBalance;
      const netChange = credits - debits;
      runningBalance += netChange;

      dailyData.push({
        date,
        openingBalance: dayOpeningBalance,
        credits,
        debits,
        closingBalance: runningBalance,
        creditTransactions: creditCount,
        debitTransactions: debitCount
      });
    });

    // Calculate summary before reversing the array (finalBalance is the last day's closing balance)
    const finalBalance = dailyData[dailyData.length - 1]?.closingBalance || openingBalance;

    return {
      dailyBalances: dailyData.reverse(), // Show newest first
      openingBalance,
      summary: {
        totalCredits: dailyData.reduce((sum, d) => sum + d.credits, 0),
        totalDebits: dailyData.reduce((sum, d) => sum + d.debits, 0),
        finalBalance: finalBalance
      }
    };
  }, [transactions, dateFrom, dateTo]);

  const formatCurrency = (amount: number) => {
    const sign = amount < 0 ? '-' : '';
    return `${sign}${SYSTEM_CONFIG.CURRENCY_SYMBOL}${Math.abs(amount).toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const exportToExcel = async () => {
    const { exportDailyCreditDebitToExcel } = await import('../utils/exportUtils');
    await exportDailyCreditDebitToExcel(
      dailyBalances.dailyBalances,
      'Pharmacy Daily Credit-Debit Report',
      { from: dateFrom, to: dateTo },
      {
        openingBalance: dailyBalances.openingBalance,
        totalCredits: dailyBalances.summary.totalCredits,
        totalDebits: dailyBalances.summary.totalDebits,
        finalBalance: dailyBalances.summary.finalBalance
      }
    );
  };

  const exportToPDF = async () => {
    const { exportDailyCreditDebitToPDF } = await import('../utils/exportUtils');
    await exportDailyCreditDebitToPDF(
      dailyBalances.dailyBalances,
      'Pharmacy Daily Credit-Debit Report',
      { from: dateFrom, to: dateTo },
      {
        openingBalance: dailyBalances.openingBalance,
        totalCredits: dailyBalances.summary.totalCredits,
        totalDebits: dailyBalances.summary.totalDebits,
        finalBalance: dailyBalances.summary.finalBalance
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pharmacy Daily Credit-Debit Report</h2>
          <p className="text-gray-400 text-sm mt-1">Track daily cash flow and closing balances</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export PDF
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <label className="text-sm text-gray-400">From:</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">To:</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="ml-auto text-sm text-gray-400">
            {dailyBalances.dailyBalances.length} days
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BanknotesIcon className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Opening Balance</p>
          </div>
          <p className={clsx(
            "text-2xl font-bold",
            dailyBalances.openingBalance >= 0 ? "text-blue-400" : "text-red-400"
          )}>
            {formatCurrency(dailyBalances.openingBalance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">As on {formatDate(dateFrom)}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpIcon className="h-4 w-4 text-green-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Total Credits</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(dailyBalances.summary.totalCredits)}</p>
          <p className="text-xs text-gray-500 mt-1">Money received</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownIcon className="h-4 w-4 text-red-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Total Debits</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(dailyBalances.summary.totalDebits)}</p>
          <p className="text-xs text-gray-500 mt-1">Money paid out</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BanknotesIcon className="h-4 w-4 text-yellow-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Closing Balance</p>
          </div>
          <p className={clsx(
            "text-2xl font-bold",
            dailyBalances.summary.finalBalance >= 0 ? "text-yellow-400" : "text-red-400"
          )}>
            {formatCurrency(dailyBalances.summary.finalBalance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">As on {formatDate(dateTo)}</p>
        </div>
      </div>

      {/* Daily Balances Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">Daily Breakdown</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Opening Balance</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Credits</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"># Txns</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Debits</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"># Txns</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {dailyBalances.dailyBalances.length > 0 ? (
                dailyBalances.dailyBalances.map((day, index) => (
                  <tr key={day.date} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-medium">
                      {formatDate(day.date)}
                    </td>
                    <td className={clsx(
                      "px-4 py-3 whitespace-nowrap text-right text-sm font-semibold",
                      day.openingBalance >= 0 ? "text-blue-400" : "text-red-400"
                    )}>
                      {formatCurrency(day.openingBalance)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-green-400 font-semibold">
                      {formatCurrency(day.credits)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-xs text-gray-500">
                      {day.creditTransactions}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm text-red-400 font-semibold">
                      {formatCurrency(day.debits)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-xs text-gray-500">
                      {day.debitTransactions}
                    </td>
                    <td className={clsx(
                      "px-4 py-3 whitespace-nowrap text-right text-sm font-bold",
                      day.closingBalance >= 0 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {formatCurrency(day.closingBalance)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No data available for selected date range
                  </td>
                </tr>
              )}
            </tbody>
            {dailyBalances.dailyBalances.length > 0 && (
              <tfoot className="bg-gray-900 border-t-2 border-blue-500">
                <tr className="font-bold">
                  <td className="px-4 py-3 text-sm text-white">TOTALS</td>
                  <td className="px-4 py-3 text-right text-sm"></td>
                  <td className="px-4 py-3 text-right text-sm text-green-400">
                    {formatCurrency(dailyBalances.summary.totalCredits)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {dailyBalances.dailyBalances.reduce((sum, d) => sum + d.creditTransactions, 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-red-400">
                    {formatCurrency(dailyBalances.summary.totalDebits)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {dailyBalances.dailyBalances.reduce((sum, d) => sum + d.debitTransactions, 0)}
                  </td>
                  <td className={clsx(
                    "px-4 py-3 text-right text-sm",
                    dailyBalances.summary.finalBalance >= 0 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {formatCurrency(dailyBalances.summary.finalBalance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyCreditDebitReport;
