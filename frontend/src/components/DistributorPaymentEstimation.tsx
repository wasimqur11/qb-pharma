import React, { useMemo } from 'react';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import { 
  calculateDistributorPaymentEstimates,
  formatDateRange,
  formatCurrency,
  type PaymentEstimationResult
} from '../utils/paymentEstimationUtils';
import { SYSTEM_CONFIG } from '../constants/systemConfig';
import PaymentEstimationConfig from './PaymentEstimationConfig';
import { CalendarIcon, CurrencyDollarIcon, UserGroupIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

const DistributorPaymentEstimation: React.FC = () => {
  const { distributors } = useStakeholders();
  const { transactions } = useTransactions();
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

  React.useEffect(() => {
    const fetchEstimationResult = async () => {
      try {
        setLoading(true);
        const result = await calculateDistributorPaymentEstimates(transactions, distributors, config);
        setEstimationResult(result);
      } catch (error) {
        console.error('Error calculating payment estimates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstimationResult();
  }, [transactions, distributors, config]);

  const { weeklyData, currentWeekData, distributorEstimates, totalEstimatedPayments, remainingFunds } = estimationResult;

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
            Weekly payment estimates based on previous week sales
          </p>
        </div>

        {/* Configuration Section */}
        <PaymentEstimationConfig onConfigChange={setConfig} />

        {/* Weekly Sales Summary */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg mb-4 sm:mb-6">
          <div className="p-3 sm:p-4">
            <div className="flex items-center mb-3 sm:mb-4">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mr-2" />
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Previous Week Sales Summary
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-2 sm:p-3">
                <div className="text-xs sm:text-sm font-medium text-blue-400 mb-1">Week Period</div>
                <div className="text-sm sm:text-base font-semibold text-blue-300">
                  {formatDateRange(weeklyData.weekStart, weeklyData.weekEnd)}
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
                  {formatDateRange(currentWeekData.weekStart, currentWeekData.weekEnd)}
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
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          <span className="hidden sm:inline">Distributor</span>
                          <span className="sm:hidden">Name</span>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          <span className="hidden sm:inline">Credit Balance</span>
                          <span className="sm:hidden">Balance</span>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          <span className="hidden sm:inline">Max Payment ({config.maxPaymentPercentage}%)</span>
                          <span className="sm:hidden">Max</span>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          <span className="hidden sm:inline">Estimated Payment</span>
                          <span className="sm:hidden">Est.</span>
                        </th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          <span className="hidden sm:inline">% of Distribution</span>
                          <span className="sm:hidden">%</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {distributorEstimates.map((estimate) => (
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
                            <div className="text-xs sm:text-sm text-gray-300">
                              {estimate.paymentPercentage.toFixed(1)}%
                            </div>
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
                  <li>Based on previous week's pharmacy sales (Monday to Sunday)</li>
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