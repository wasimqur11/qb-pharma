import React, { useState } from 'react';
import {
  XMarkIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  UsersIcon,
  ScaleIcon,
  InformationCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useSimpleSettlement, type SettlementDistribution } from '../contexts/SimpleSettlementContext';
import clsx from 'clsx';

interface SimpleSettlementWizardProps {
  isOpen: boolean;
  onClose: () => void;
  availableCash: number;
}

const SimpleSettlementWizard: React.FC<SimpleSettlementWizardProps> = ({ 
  isOpen, 
  onClose, 
  availableCash 
}) => {
  const { 
    getPartnerBalances, 
    calculateAdjustedDistribution, 
    processSimpleSettlement 
  } = useSimpleSettlement();
  
  const [distributions, setDistributions] = useState<SettlementDistribution[]>([]);
  const [description, setDescription] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  React.useEffect(() => {
    if (isOpen && !isInitialized) {
      const calculated = calculateAdjustedDistribution(availableCash);
      setDistributions(calculated);
      setDescription(`Simple Settlement - ${new Date().toLocaleDateString()}`);
      setIsInitialized(true);
    }
  }, [isOpen, availableCash, calculateAdjustedDistribution, isInitialized]);

  const handleClose = () => {
    setDistributions([]);
    setIsInitialized(false);
    onClose();
  };

  const handleAmountChange = (partnerId: string, newAmount: number) => {
    setDistributions(prev => prev.map(dist => {
      if (dist.partnerId === partnerId) {
        const finalAmount = Math.max(0, Math.round(newAmount));
        const actualPaymentDifference = finalAmount - dist.calculatedShare;
        const rawNewBalance = dist.balanceAdjustment + actualPaymentDifference;
        // Apply tolerance for very small amounts to avoid rounding errors
        const newBalance = Math.abs(rawNewBalance) < 1 ? 0 : rawNewBalance;
        
        return {
          ...dist,
          finalAmount,
          newBalance: Math.round(newBalance)
        };
      }
      return dist;
    }));
  };

  const handleProcessSettlement = async () => {
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual delay
      
      processSimpleSettlement(distributions, description, new Date(settlementDate));
      
      const totalPaid = distributions.reduce((sum, dist) => sum + dist.finalAmount, 0);
      alert(`Settlement processed successfully!\n\n• ${formatCurrency(totalPaid)} distributed to partners\n• Individual partner payments recorded\n• Running balances updated\n• Settlement point created\n• Date: ${new Date(settlementDate).toLocaleDateString()}`);
      handleClose();
      
    } catch (error) {
      alert(`Settlement failed: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString()}`;

  const totalAllocated = distributions.reduce((sum, dist) => sum + dist.finalAmount, 0);
  const mismatchAmount = totalAllocated - availableCash;
  const balances = getPartnerBalances();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <ScaleIcon className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Settlement</h2>
              <p className="text-sm text-gray-400">Enter actual payment amounts</p>
            </div>
          </div>
          
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-10">
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-white mb-2">Processing Settlement</h3>
              <p className="text-gray-400">Creating transactions and updating balances...</p>
            </div>
          </div>
        )}

        <div className="p-4 max-h-[calc(85vh-120px)] overflow-y-auto">
          
          {/* Cash Summary */}
          <div className="bg-gray-750 border border-gray-600 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-400">Available Cash</p>
                <p className="text-lg font-bold text-green-400">{formatCurrency(availableCash)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Total to Pay</p>
                <p className="text-lg font-bold text-blue-400">{formatCurrency(totalAllocated)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Difference</p>
                <p className={clsx(
                  "text-lg font-bold",
                  mismatchAmount === 0 ? "text-emerald-400" : 
                  mismatchAmount > 0 ? "text-red-400" : "text-yellow-400"
                )}>
                  {mismatchAmount > 0 && "+"}
                  {mismatchAmount === 0 ? "₹0" : formatCurrency(mismatchAmount)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Status</p>
                <p className={clsx(
                  "text-sm font-medium",
                  mismatchAmount === 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {mismatchAmount === 0 ? "✓ Ready" : 
                   mismatchAmount > 0 ? "⚠ Over" : "⚠ Under"}
                </p>
              </div>
            </div>
            
            {/* Mismatch Alert */}
            {mismatchAmount !== 0 && (
              <div className={clsx(
                "mt-3 p-2 rounded-lg text-sm text-center",
                mismatchAmount > 0 ? "bg-red-900/30 text-red-300" : "bg-yellow-900/30 text-yellow-300"
              )}>
                {mismatchAmount > 0 
                  ? `You're paying ${formatCurrency(mismatchAmount)} more than available cash`
                  : `You have ${formatCurrency(Math.abs(mismatchAmount))} remaining cash not allocated`
                }
              </div>
            )}
          </div>

          {/* Distribution Preview */}
          <div className="space-y-3 mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Payment Distribution
            </h3>
            
            {distributions.map((dist, index) => (
              <div key={dist.partnerId} className="bg-gray-750 border border-gray-600 rounded-lg p-3">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-center">
                  
                  {/* Partner Info */}
                  <div>
                    <h4 className="font-medium text-white">{dist.partnerName}</h4>
                    <p className="text-xs text-gray-400">Due: {formatCurrency(dist.calculatedShare)}</p>
                  </div>
                  
                  {/* Current Balance */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Current Balance</p>
                    <p className={clsx(
                      "font-medium text-sm",
                      dist.balanceAdjustment > 0 ? "text-red-400" : 
                      dist.balanceAdjustment < 0 ? "text-green-400" : "text-gray-400"
                    )}>
                      {dist.balanceAdjustment > 0 && "+"}
                      {formatCurrency(-dist.balanceAdjustment)}
                    </p>
                  </div>
                  
                  {/* Actual Amount (Editable) */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Pay Amount</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={dist.finalAmount}
                        onChange={(e) => handleAmountChange(dist.partnerId, parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-medium text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        min="0"
                        step="1"
                      />
                      {mismatchAmount !== 0 && (
                        <button
                          onClick={() => {
                            const adjustment = Math.round(mismatchAmount / distributions.length);
                            handleAmountChange(dist.partnerId, dist.finalAmount - adjustment);
                          }}
                          className="absolute -right-6 top-0 h-full w-5 text-xs text-blue-400 hover:text-blue-300"
                          title={`Adjust by ${formatCurrency(-Math.round(mismatchAmount / distributions.length))}`}
                        >
                          ⚖
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Difference */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Difference</p>
                    <p className={clsx(
                      "font-medium text-sm",
                      (dist.finalAmount - dist.calculatedShare) > 0 ? "text-red-400" : 
                      (dist.finalAmount - dist.calculatedShare) < 0 ? "text-yellow-400" : "text-gray-400"
                    )}>
                      {(dist.finalAmount - dist.calculatedShare) > 0 && "+"}
                      {formatCurrency(dist.finalAmount - dist.calculatedShare)}
                    </p>
                  </div>
                  
                  {/* New Balance */}
                  <div className="text-center">
                    <p className="text-xs text-gray-400">New Balance</p>
                    <p className={clsx(
                      "font-medium text-sm",
                      dist.newBalance > 0 ? "text-red-400" : 
                      dist.newBalance < 0 ? "text-green-400" : "text-emerald-400"
                    )}>
                      {dist.newBalance > 0 && "+"}
                      {formatCurrency(dist.newBalance)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Settlement Details */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Settlement Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                Settlement Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 [&::-webkit-calendar-picker-indicator]:brightness-200 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                All settlement transactions will use this date
              </p>
            </div>
            
            {/* Settlement Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Settlement description..."
              />
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-600/50 rounded-lg">
            <p className="text-xs text-blue-300">
              <strong>Transactions to be created:</strong> Individual partner payments (₹{formatCurrency(totalAllocated).replace('₹', '')}) + settlement point marker
            </p>
            <p className="text-xs text-blue-300 mt-1">
              <strong>Date:</strong> All transactions will be dated {new Date(settlementDate).toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleProcessSettlement}
              disabled={mismatchAmount !== 0 || isProcessing}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckBadgeIcon className="h-4 w-4" />
                  Process Settlement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSettlementWizard;