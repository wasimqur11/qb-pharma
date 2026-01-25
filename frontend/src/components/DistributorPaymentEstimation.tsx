import React, { useMemo } from 'react';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import {
  calculateDistributorPaymentEstimates,
  formatDateRange,
  formatDateRangeWithDays,
  formatCurrency,
  getWeekStart,
  getWeekEnd,
  type PaymentEstimationResult,
  ConfigurationService
} from '../utils/paymentEstimationUtils';
import { SYSTEM_CONFIG } from '../constants/systemConfig';
import PaymentEstimationConfig from './PaymentEstimationConfig';
import { CalendarIcon, CurrencyDollarIcon, UserGroupIcon, Cog6ToothIcon, ChevronUpIcon, ChevronDownIcon, ArrowUpIcon, ArrowDownIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const DistributorPaymentEstimation: React.FC = () => {
  const { distributors } = useStakeholders();
  const { transactions, calculateDistributorCurrentBalance } = useTransactions();

  // Week selection state - default to current week
  const [selectedWeekStart, setSelectedWeekStart] = React.useState<Date>(() => getWeekStart(new Date()));

  const [config, setConfig] = React.useState<{
    profitPercentage: number;
    distributorPercentage: number;
    maxPaymentPercentage: number;
  }>({
    profitPercentage: 25, // Default fallback
    distributorPercentage: 75, // Default fallback
    maxPaymentPercentage: 10 // Default fallback
  });

  const [estimationResult, setEstimationResult] = React.useState<PaymentEstimationResult>({
    weeklyData: {
      weekStart: new Date(),
      weekEnd: new Date(),
      totalSales: 0,
      profitAllocation: 0,
      distributorAllocation: 0
    },
    currentWeekData: {
      weekStart: new Date(),
      weekEnd: new Date()
    },
    distributorEstimates: [],
    totalEstimatedPayments: 0,
    remainingFunds: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [sortConfig, setSortConfig] = React.useState<{
    key: 'distributorName' | 'creditBalance' | 'maxPayment' | 'estimatedPayment' | 'actualPayment';
    direction: 'asc' | 'desc';
  }>({
    key: 'estimatedPayment',
    direction: 'desc'
  });

  // Load configuration from database on mount
  React.useEffect(() => {
    const loadConfig = async () => {
      try {
        const configService = ConfigurationService.getInstance();
        const dbConfig = await configService.getPaymentEstimationConfig();
        setConfig(dbConfig);
      } catch (error) {
        console.error('Failed to load configuration, using defaults:', error);
        // Keep using default values
      }
    };
    loadConfig();
  }, []);

  // Week navigation handlers
  const handlePreviousWeek = () => {
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setSelectedWeekStart(newWeekStart);
  };

  const handleNextWeek = () => {
    const newWeekStart = new Date(selectedWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setSelectedWeekStart(newWeekStart);
  };

  const handleCurrentWeek = () => {
    setSelectedWeekStart(getWeekStart(new Date()));
  };

  React.useEffect(() => {
    const fetchEstimationResult = async () => {
      try {
        setLoading(true);
        const result = await calculateDistributorPaymentEstimates(
          transactions,
          distributors,
          config,
          calculateDistributorCurrentBalance,
          selectedWeekStart
        );
        setEstimationResult(result);
      } catch (error) {
        console.error('Error calculating payment estimates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimationResult();
  }, [transactions, distributors, config, calculateDistributorCurrentBalance, selectedWeekStart]);

  const { weeklyData, currentWeekData, distributorEstimates, totalEstimatedPayments, remainingFunds } = estimationResult;

  // Sort distributor estimates based on current sort configuration
  const sortedDistributorEstimates = useMemo(() => {
    const sorted = [...distributorEstimates].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case 'distributorName':
          aValue = a.distributorName.toLowerCase();
          bValue = b.distributorName.toLowerCase();
          break;
        case 'creditBalance':
          aValue = a.creditBalance;
          bValue = b.creditBalance;
          break;
        case 'maxPayment':
          aValue = a.maxPayment;
          bValue = b.maxPayment;
          break;
        case 'estimatedPayment':
          aValue = a.estimatedPayment;
          bValue = b.estimatedPayment;
          break;
        case 'actualPayment':
          aValue = a.actualPayment;
          bValue = b.actualPayment;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [distributorEstimates, sortConfig]);

  // Handle sort request
  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Render sort icon
  const renderSortIcon = (columnKey: typeof sortConfig.key) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUpIcon className="h-3 w-3 text-gray-600 opacity-50" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUpIcon className="h-3 w-3 text-blue-400" />
      : <ChevronDownIcon className="h-3 w-3 text-blue-400" />;
  };

  // Render variance analysis (compact version with both Est and Max)
  const renderVarianceAnalysis = (actualPayment: number, estimatedPayment: number, maxPayment: number) => {
    // Variance vs Estimated
    const varianceVsEst = actualPayment - estimatedPayment;
    const percentOfEst = estimatedPayment > 0 ? (actualPayment / estimatedPayment) * 100 : 0;

    // Variance vs Max
    const varianceVsMax = actualPayment - maxPayment;
    const percentOfMax = maxPayment > 0 ? (actualPayment / maxPayment) * 100 : 0;

    // Determine status and color for estimated payment variance
    let estStatusColor = 'text-green-400';
    let estIcon = <CheckIcon className="h-3 w-3" />;

    if (percentOfEst < 80) {
      estStatusColor = 'text-red-400';
      estIcon = <ArrowDownIcon className="h-3 w-3" />;
    } else if (percentOfEst > 120) {
      estStatusColor = 'text-red-400';
      estIcon = <ArrowUpIcon className="h-3 w-3" />;
    } else if (percentOfEst < 95 || percentOfEst > 105) {
      estStatusColor = 'text-yellow-400';
      estIcon = percentOfEst < 95
        ? <ArrowDownIcon className="h-3 w-3" />
        : <ArrowUpIcon className="h-3 w-3" />;
    }

    // Determine status and color for max payment variance
    let maxStatusColor = 'text-green-400';
    let maxIcon = <CheckIcon className="h-3 w-3" />;

    if (percentOfMax < 80) {
      maxStatusColor = 'text-red-400';
      maxIcon = <ArrowDownIcon className="h-3 w-3" />;
    } else if (percentOfMax > 120) {
      maxStatusColor = 'text-red-400';
      maxIcon = <ArrowUpIcon className="h-3 w-3" />;
    } else if (percentOfMax < 95 || percentOfMax > 105) {
      maxStatusColor = 'text-yellow-400';
      maxIcon = percentOfMax < 95
        ? <ArrowDownIcon className="h-3 w-3" />
        : <ArrowUpIcon className="h-3 w-3" />;
    }

    return (
      <div className="flex flex-col gap-0.5 text-xs">
        {/* vs Estimated */}
        <div className="flex items-center gap-1">
          <span className={estStatusColor}>{estIcon}</span>
          <span className="text-gray-400 font-medium">Est:</span>
          <span className={`font-semibold ${estStatusColor}`}>
            {varianceVsEst >= 0 ? '+' : ''}{formatCurrency(varianceVsEst)}
          </span>
          <span className="text-gray-500">({percentOfEst.toFixed(0)}%)</span>
        </div>
        {/* vs Max */}
        <div className="flex items-center gap-1">
          <span className={maxStatusColor}>{maxIcon}</span>
          <span className="text-gray-400 font-medium">Max:</span>
          <span className={`font-semibold ${maxStatusColor}`}>
            {varianceVsMax >= 0 ? '+' : ''}{formatCurrency(varianceVsMax)}
          </span>
          <span className="text-gray-500">({percentOfMax.toFixed(0)}%)</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <span className="ml-3 text-gray-300">Loading payment estimations...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Distributor Payment Estimation
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Weekly payment estimates based on selected week sales
          </p>
        </div>

        {/* Week Selection */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg mb-4 sm:mb-6 p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-400" />
              <h3 className="text-base sm:text-lg font-semibold text-white">Selected Week</h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePreviousWeek}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Previous Week"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <div className="text-center px-4">
                <div className="text-sm sm:text-base font-semibold text-blue-300">
                  {formatDateRangeWithDays(selectedWeekStart, getWeekEnd(selectedWeekStart)).dateRange}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDateRangeWithDays(selectedWeekStart, getWeekEnd(selectedWeekStart)).startDay} - {formatDateRangeWithDays(selectedWeekStart, getWeekEnd(selectedWeekStart)).endDay}
                </div>
              </div>

              <button
                onClick={handleNextWeek}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Next Week"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>

              <button
                onClick={handleCurrentWeek}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Current Week
              </button>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <PaymentEstimationConfig onConfigChange={setConfig} />

        {/* Weekly Sales Summary */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="flex items-center mb-3 sm:mb-4">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2" />
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Selected Week Sales Summary
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-blue-400 mb-1">Week Period</div>
                <div className="text-sm sm:text-base font-semibold text-blue-300">
                  {(() => {
                    const { dateRange, startDay, endDay } = formatDateRangeWithDays(weeklyData.weekStart, weeklyData.weekEnd);
                    return (
                      <div className="flex flex-col">
                        <span>{dateRange}</span>
                        <span className="text-xs text-gray-500">{startDay} - {endDay}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-green-400 mb-1">Total Sales</div>
                <div className="text-lg sm:text-xl font-bold text-green-300">
                  {formatCurrency(weeklyData.totalSales)}
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-yellow-400 mb-1">
                  Profit ({config.profitPercentage}%)
                </div>
                <div className="text-base sm:text-lg font-semibold text-yellow-300">
                  {formatCurrency(weeklyData.profitAllocation)}
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-purple-400 mb-1">
                  For Distribution ({config.distributorPercentage}%)
                </div>
                <div className="text-base sm:text-lg font-semibold text-purple-300">
                  {formatCurrency(weeklyData.distributorAllocation)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Distribution Summary */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="flex items-center mb-3 sm:mb-4">
              <CurrencyDollarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mr-2" />
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Payment Distribution Summary
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-blue-400 mb-1">Week Period</div>
                <div className="text-sm sm:text-base font-semibold text-blue-300">
                  {(() => {
                    const { dateRange, startDay, endDay } = formatDateRangeWithDays(currentWeekData.weekStart, currentWeekData.weekEnd);
                    return (
                      <div className="flex flex-col">
                        <span>{dateRange}</span>
                        <span className="text-xs text-gray-500">{startDay} - {endDay}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-green-400 mb-1">Total Estimated Payments</div>
                <div className="text-lg sm:text-xl font-bold text-green-300">
                  {formatCurrency(totalEstimatedPayments)}
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-gray-400 mb-1">Remaining Funds</div>
                <div className="text-base sm:text-lg font-semibold text-gray-300">
                  {formatCurrency(remainingFunds)}
                </div>
              </div>
              
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-blue-400 mb-1">Eligible Distributors</div>
                <div className="text-base sm:text-lg font-semibold text-blue-300">
                  {distributorEstimates.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Distributor Payment Details */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg">
          <div className="p-3 sm:p-4">
            <div className="flex items-center mb-3 sm:mb-4">
              <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400 mr-2" />
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Individual Distributor Estimates
              </h2>
            </div>

            {distributorEstimates.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-600" />
                <h3 className="mt-2 text-sm font-medium text-gray-300">No eligible distributors</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No distributors have positive credit balances for payment estimation.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900">
                      <tr>
                        <th
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors"
                          onClick={() => handleSort('distributorName')}
                        >
                          <div className="flex items-center gap-1">
                            <span className="hidden sm:inline">Distributor</span>
                            <span className="sm:hidden">Name</span>
                            {renderSortIcon('distributorName')}
                          </div>
                        </th>
                        <th
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors"
                          onClick={() => handleSort('creditBalance')}
                        >
                          <div className="flex items-center gap-1">
                            <span className="hidden sm:inline">Credit Balance</span>
                            <span className="sm:hidden">Balance</span>
                            {renderSortIcon('creditBalance')}
                          </div>
                        </th>
                        <th
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors"
                          onClick={() => handleSort('maxPayment')}
                        >
                          <div className="flex items-center gap-1">
                            <span className="hidden sm:inline">Max Payment ({config.maxPaymentPercentage}%)</span>
                            <span className="sm:hidden">Max</span>
                            {renderSortIcon('maxPayment')}
                          </div>
                        </th>
                        <th
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors"
                          onClick={() => handleSort('estimatedPayment')}
                        >
                          <div className="flex items-center gap-1">
                            <span className="hidden sm:inline">Estimated Payment</span>
                            <span className="sm:hidden">Est.</span>
                            {renderSortIcon('estimatedPayment')}
                          </div>
                        </th>
                        <th
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors"
                          onClick={() => handleSort('actualPayment')}
                        >
                          <div className="flex items-center gap-1">
                            <span className="hidden sm:inline">Actual Payment</span>
                            <span className="sm:hidden">Paid</span>
                            {renderSortIcon('actualPayment')}
                          </div>
                        </th>
                        <th
                          className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                        >
                          <span className="hidden sm:inline">Variance Analysis</span>
                          <span className="sm:hidden">Variance</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {/* Summary Row */}
                      <tr className="bg-blue-900/40 border-b-2 border-blue-500">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-bold text-blue-300 uppercase">
                            Total ({distributorEstimates.length} Distributors)
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-bold text-blue-300">
                            {formatCurrency(distributorEstimates.reduce((sum, est) => sum + est.creditBalance, 0))}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-bold text-blue-300">
                            {formatCurrency(distributorEstimates.reduce((sum, est) => sum + est.maxPayment, 0))}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-bold text-green-400">
                            {formatCurrency(totalEstimatedPayments)}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-bold text-blue-300">
                            {formatCurrency(distributorEstimates.reduce((sum, est) => sum + est.actualPayment, 0))}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                          <div className="text-xs font-bold text-gray-400">
                            {(() => {
                              const totalActual = distributorEstimates.reduce((sum, est) => sum + est.actualPayment, 0);
                              const totalEstimated = totalEstimatedPayments;
                              const totalMax = distributorEstimates.reduce((sum, est) => sum + est.maxPayment, 0);

                              const varianceVsEst = totalActual - totalEstimated;
                              const percentOfEst = totalEstimated > 0 ? ((totalActual / totalEstimated) * 100).toFixed(0) : '0';

                              const varianceVsMax = totalActual - totalMax;
                              const percentOfMax = totalMax > 0 ? ((totalActual / totalMax) * 100).toFixed(0) : '0';

                              return (
                                <div className="flex flex-col gap-0.5">
                                  <div className="text-blue-300">
                                    Est: {varianceVsEst >= 0 ? '+' : ''}{formatCurrency(varianceVsEst)} ({percentOfEst}%)
                                  </div>
                                  <div className="text-blue-300">
                                    Max: {varianceVsMax >= 0 ? '+' : ''}{formatCurrency(varianceVsMax)} ({percentOfMax}%)
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>

                      {/* Individual Distributor Rows - Sorted */}
                      {sortedDistributorEstimates.map((estimate) => (
                        <tr key={estimate.distributorId} className="hover:bg-gray-700 transition-colors">
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-white">
                              {estimate.distributorName}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-300">
                              {formatCurrency(estimate.creditBalance)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-300">
                              {formatCurrency(estimate.maxPayment)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-semibold text-green-400">
                              {formatCurrency(estimate.estimatedPayment)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-semibold text-blue-400">
                              {formatCurrency(estimate.actualPayment)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            {renderVarianceAnalysis(estimate.actualPayment, estimate.estimatedPayment, estimate.maxPayment)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 sm:mt-6 bg-blue-900/30 border border-blue-700 rounded-lg p-3 sm:p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-300">
                Calculation Method
              </h3>
              <div className="mt-2 text-xs sm:text-sm text-blue-400">
                <ul className="list-disc list-inside space-y-1">
                  <li>Based on previous week's pharmacy sales (Friday to Thursday)</li>
                  <li>{config.profitPercentage}% allocated for profit and expenses, {config.distributorPercentage}% for distributor payments</li>
                  <li>Payments distributed proportionally based on credit balances</li>
                  <li>Each distributor capped at {config.maxPaymentPercentage}% of their credit balance</li>
                  <li>Remaining funds shown when distributors hit their caps</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributorPaymentEstimation;