import React, { useState, useMemo } from 'react';
import {
  CalendarIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  TruckIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTransactions } from '../contexts/TransactionContext';
import { useStakeholders } from '../contexts/StakeholderContext';
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

// Helper functions defined outside component to avoid scoping issues
const formatCurrencyHelper = (amount: number, currencySymbol: string) => {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${currencySymbol}${Math.abs(amount).toLocaleString()}`;
};

const formatDateHelper = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateWithDayHelper = (dateStr: string) => {
  const date = new Date(dateStr);
  return {
    dateText: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    dayName: date.toLocaleDateString('en-IN', { weekday: 'long' })
  };
};

const DistributorCreditDebitReport: React.FC = () => {
  const { transactions } = useTransactions();
  const { distributors } = useStakeholders();

  // Date range state
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [showChart, setShowChart] = useState(true);

  // Credit categories for distributors (Increases what we owe to distributors)
  const creditCategories = ['distributor_credit_purchase'];

  // Debit categories for distributors (Decreases what we owe to distributors)
  const debitCategories = ['distributor_payment', 'distributor_credit_note'];

  // Calculate daily balances
  const dailyBalances = useMemo(() => {
    // Filter distributor transactions only
    const distributorTransactions = transactions.filter(t =>
      [...creditCategories, ...debitCategories].includes(t.category)
    );

    // Filter by date range
    const filteredTransactions = distributorTransactions.filter(t => {
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

    // Calculate initial credit balance from all distributors (from offline ledgers)
    const totalInitialCreditBalance = distributors.reduce((sum, distributor) => {
      return sum + (distributor.creditBalance || 0);
    }, 0);

    // Calculate opening balance = initial balance + all transactions before dateFrom
    const transactionsBeforePeriod = distributorTransactions
      .filter(t => new Date(t.date) < new Date(dateFrom))
      .reduce((balance, t) => {
        if (creditCategories.includes(t.category)) {
          return balance + t.amount;
        } else if (debitCategories.includes(t.category)) {
          return balance - t.amount;
        }
        return balance;
      }, 0);

    const openingBalance = totalInitialCreditBalance + transactionsBeforePeriod;

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

    // Calculate summary before reversing the array
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
  }, [transactions, distributors, dateFrom, dateTo]);

  // Local wrappers for consistency
  const formatCurrency = (amount: number) => formatCurrencyHelper(amount, SYSTEM_CONFIG.CURRENCY_SYMBOL);
  const formatDate = (dateStr: string) => formatDateHelper(dateStr);
  const formatDateWithDay = (dateStr: string) => formatDateWithDayHelper(dateStr);

  // Prepare chart data (chronological order for charts)
  const chartData = useMemo(() => {
    return [...dailyBalances.dailyBalances].reverse().map(day => ({
      date: formatDateHelper(day.date),
      creditPurchases: day.credits,
      paymentsReturns: day.debits,
      closingBalance: day.closingBalance
    }));
  }, [dailyBalances.dailyBalances]);

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrencyHelper(entry.value, SYSTEM_CONFIG.CURRENCY_SYMBOL)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const exportToExcel = async () => {
    const { exportDailyCreditDebitToExcel } = await import('../utils/exportUtils');
    await exportDailyCreditDebitToExcel(
      dailyBalances.dailyBalances,
      'Distributor Daily Credit-Debit Report',
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
      'Distributor Daily Credit-Debit Report',
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
          <h2 className="text-2xl font-bold text-white">Distributor Daily Credit-Debit Report</h2>
          <p className="text-gray-400 text-sm mt-1">Track all distributor credit purchases and payments (combined)</p>
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
            <TruckIcon className="h-4 w-4 text-blue-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Opening Balance</p>
          </div>
          <p className={clsx(
            "text-2xl font-bold",
            dailyBalances.openingBalance >= 0 ? "text-blue-400" : "text-green-400"
          )}>
            {formatCurrency(dailyBalances.openingBalance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Initial balance + past credit
            <span className="block text-gray-600">As on {formatDateWithDay(dateFrom).dateText}</span>
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpIcon className="h-4 w-4 text-green-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Total Credit Purchases</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(dailyBalances.summary.totalCredits)}</p>
          <p className="text-xs text-gray-500 mt-1">During selected period</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownIcon className="h-4 w-4 text-red-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Total Paid/Returns</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(dailyBalances.summary.totalDebits)}</p>
          <p className="text-xs text-gray-500 mt-1">Payments + Credit notes</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BanknotesIcon className="h-4 w-4 text-yellow-400" />
            <p className="text-xs font-medium text-gray-400 uppercase">Current Balance</p>
          </div>
          <p className={clsx(
            "text-2xl font-bold",
            dailyBalances.summary.finalBalance >= 0 ? "text-yellow-400" : "text-green-400"
          )}>
            {formatCurrency(dailyBalances.summary.finalBalance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            As on {formatDateWithDay(dateTo).dateText}
            <span className="block text-gray-600">{formatDateWithDay(dateTo).dayName}</span>
          </p>
        </div>
      </div>

      {/* Trend Analysis Chart */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Trend Analysis</h3>
          </div>
          <button
            onClick={() => setShowChart(!showChart)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
          >
            {showChart ? (
              <>
                <EyeSlashIcon className="h-4 w-4" />
                Hide Chart
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4" />
                Show Chart
              </>
            )}
          </button>
        </div>

        {showChart && (
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 80, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                {/* Left Y-Axis for daily transactions */}
                <YAxis
                  yAxisId="left"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(value) => `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${(value / 1000).toFixed(0)}k`}
                  label={{ value: 'Daily Transactions', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: 12 } }}
                />
                {/* Right Y-Axis for closing balance */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#facc15"
                  tick={{ fill: '#facc15', fontSize: 12 }}
                  tickFormatter={(value) => `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${(value / 1000).toFixed(0)}k`}
                  label={{ value: 'Closing Balance', angle: 90, position: 'insideRight', style: { fill: '#facc15', fontSize: 12 } }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="creditPurchases"
                  name="Credit Purchases"
                  stroke="#f87171"
                  strokeWidth={2}
                  dot={{ fill: '#f87171', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="paymentsReturns"
                  name="Payments/Returns"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={{ fill: '#4ade80', r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="closingBalance"
                  name="Closing Balance"
                  stroke="#facc15"
                  strokeWidth={3}
                  dot={{ fill: '#facc15', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
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
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Credit Purchases</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"># Txns</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Paid/Returns</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"># Txns</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {dailyBalances.dailyBalances.length > 0 ? (
                dailyBalances.dailyBalances.map((day, index) => {
                  const dateInfo = formatDateWithDay(day.date);
                  return (
                  <tr key={day.date} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300 font-medium">
                      <div className="flex flex-col">
                        <span>{dateInfo.dateText}</span>
                        <span className="text-xs text-gray-500">{dateInfo.dayName}</span>
                      </div>
                    </td>
                    <td className={clsx(
                      "px-4 py-3 whitespace-nowrap text-right text-sm font-semibold",
                      day.openingBalance >= 0 ? "text-blue-400" : "text-green-400"
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
                      day.closingBalance >= 0 ? "text-yellow-400" : "text-green-400"
                    )}>
                      {formatCurrency(day.closingBalance)}
                    </td>
                  </tr>
                  );
                })
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
                    dailyBalances.summary.finalBalance >= 0 ? "text-yellow-400" : "text-green-400"
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

export default DistributorCreditDebitReport;
