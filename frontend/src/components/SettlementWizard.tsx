import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ScaleIcon,
  ArrowRightIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useSettlementEquity } from '../contexts/SettlementEquityContext';
import { useTransactions } from '../contexts/TransactionContext';
import type { SettlementSession, PreSettlementAllocation } from '../types';
import clsx from 'clsx';

interface SettlementWizardProps {
  isOpen: boolean;
  onClose: () => void;
  availableCash: number;
}

const SettlementWizard: React.FC<SettlementWizardProps> = ({ isOpen, onClose, availableCash }) => {
  const { 
    initializeSettlementSession, 
    updateAllocation, 
    processSettlement, 
    cancelSettlementSession,
    canProcessSettlement,
    currentSettlementSession 
  } = useSettlementEquity();
  
  const { getCashPosition } = useTransactions();
  
  const [session, setSession] = useState<SettlementSession | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [description, setDescription] = useState('');

  // Initialize session when wizard opens
  useEffect(() => {
    if (isOpen && !session) {
      try {
        console.log('Initializing settlement session with cash:', availableCash);
        const newSession = initializeSettlementSession(availableCash);
        setSession(newSession);
        setDescription(`Settlement Distribution - ${new Date().toLocaleDateString()}`);
      } catch (error) {
        console.error('Error initializing settlement session:', error);
        alert('Error initializing settlement. Please try again.');
        onClose();
      }
    }
  }, [isOpen, availableCash, session, initializeSettlementSession, onClose]);

  // Sync with context session
  useEffect(() => {
    if (currentSettlementSession) {
      setSession(currentSettlementSession);
    }
  }, [currentSettlementSession]);

  const handleClose = () => {
    if (session && !session.isProcessed) {
      cancelSettlementSession();
    }
    setSession(null);
    onClose();
  };

  const handleAllocationChange = (partnerId: string, newAmount: number) => {
    // Round the amount to ensure whole numbers
    const roundedAmount = Math.round(newAmount);
    updateAllocation(partnerId, roundedAmount);
  };

  const handleProcessSettlement = async () => {
    if (!session) return;
    
    const validation = canProcessSettlement(session);
    if (!validation.canProcess) {
      alert(`Cannot process settlement:\n${validation.errors.join('\n')}`);
      return;
    }
    
    setIsProcessing(true);
    setProcessingStep('Creating distribution transactions...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual delay
      setProcessingStep('Recording Settlement Point...');
      
      const settlementId = await processSettlement(session, description);
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual delay
      setProcessingStep('Updating partner equity records...');
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Visual delay
      setProcessingStep('Settlement completed successfully!');
      
      // Show success message
      setTimeout(() => {
        alert(`Settlement processed successfully!\n\nSettlement ID: ${settlementId}\nCash position is now ₹0\nAll partner equity records updated.`);
        setIsProcessing(false);
        setProcessingStep('');
        handleClose();
      }, 1500);
      
    } catch (error) {
      setIsProcessing(false);
      setProcessingStep('');
      alert(`Settlement failed: ${(error as Error).message}`);
    }
  };

  const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString()}`;

  if (!isOpen) return null;
  
  // Show loading state if session is not ready
  if (!session) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Initializing Settlement</h3>
          <p className="text-gray-400">Please wait...</p>
        </div>
      </div>
    );
  }

  const validation = canProcessSettlement(session);
  const totalAllocated = session.allocations.reduce((sum, allocation) => sum + Math.round(allocation.adjustedAmount), 0);
  const remainingCash = Math.round(availableCash) - totalAllocated;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div className="flex items-center gap-3">
            <CheckBadgeIcon className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Settlement Wizard</h2>
              <p className="text-sm text-gray-400">Pay partner dues and create Settlement Point</p>
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
              <p className="text-gray-400">{processingStep}</p>
            </div>
          </div>
        )}

        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          
          {/* Cash Summary */}
          <div className="bg-gray-750 border border-gray-600 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Available Cash</p>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(availableCash)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <UsersIcon className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Total Allocated</p>
                  <p className="text-lg font-bold text-blue-400">{formatCurrency(totalAllocated)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <ScaleIcon className="h-5 w-5 text-purple-400" />
                <div>
                  <p className="text-xs text-gray-400">Remaining</p>
                  <p className={clsx(
                    "text-lg font-bold",
                    Math.abs(remainingCash) < 1 ? "text-green-400" : "text-red-400"
                  )}>
                    {formatCurrency(remainingCash)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CheckBadgeIcon className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <p className={clsx(
                    "text-sm font-medium",
                    validation.canProcess ? "text-emerald-400" : "text-red-400"
                  )}>
                    {validation.canProcess ? "Ready to Process" : "Needs Adjustment"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {!validation.canProcess && (
            <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-400 mb-2">Settlement Issues</h4>
                  <ul className="text-sm text-red-300 space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Partner Allocations */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Partner Dues Payment
            </h3>
            
            {session.allocations.map((allocation, index) => (
              <PartnerAllocationCard
                key={allocation.partnerId}
                allocation={allocation}
                onChange={(newAmount) => handleAllocationChange(allocation.partnerId, newAmount)}
              />
            ))}
          </div>

          {/* Settlement Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Settlement Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter description for this settlement..."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-600/50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="text-sm text-blue-300">
                <p className="font-medium mb-1">Settlement Process:</p>
                <ul className="space-y-1">
                  <li>• Distribution transactions will be created for each partner</li>
                  <li>• A Settlement Point will be created automatically</li>
                  <li>• Partner equity records will be updated</li>
                  <li>• Cash position will become ₹0</li>
                  <li>• All future reports will start from this Settlement Point</li>
                </ul>
              </div>
            </div>
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
              disabled={!validation.canProcess || isProcessing}
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

// Partner Allocation Card Component
interface PartnerAllocationCardProps {
  allocation: PreSettlementAllocation;
  onChange: (newAmount: number) => void;
}

const PartnerAllocationCard: React.FC<PartnerAllocationCardProps> = ({ allocation, onChange }) => {
  const formatCurrency = (amount: number) => `₹${Math.round(amount).toLocaleString()}`;
  
  const equityColor = allocation.currentEquity > 0 ? 'text-green-400' : 
                     allocation.currentEquity < 0 ? 'text-red-400' : 'text-gray-400';
  
  const projectedEquityColor = allocation.projectedEquity > 0 ? 'text-green-400' : 
                              allocation.projectedEquity < 0 ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-gray-750 border border-gray-600 rounded-lg p-4">
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
        
        {/* Partner Info */}
        <div className="lg:col-span-2">
          <h4 className="font-medium text-white">{allocation.partnerName}</h4>
          <p className="text-sm text-gray-400">{allocation.ownershipPercentage}% ownership</p>
        </div>
        
        {/* Amount Due */}
        <div className="text-center">
          <p className="text-xs text-gray-400">Amount Due</p>
          <p className="font-medium text-gray-300">{formatCurrency(allocation.calculatedShare)}</p>
        </div>
        
        {/* Actual Amount (Editable) */}
        <div className="text-center">
          <p className="text-xs text-gray-400">Actual Amount</p>
          <input
            type="number"
            value={Math.round(allocation.adjustedAmount)}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm font-medium text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
            min="0"
            step="1"
          />
        </div>
        
        {/* Current Equity */}
        <div className="text-center">
          <p className="text-xs text-gray-400">Current Equity</p>
          <p className={clsx("font-medium", equityColor)}>
            {formatCurrency(allocation.currentEquity)}
          </p>
        </div>
        
        {/* Projected Equity */}
        <div className="text-center">
          <p className="text-xs text-gray-400">After Settlement</p>
          <div className="flex items-center justify-center gap-2">
            <p className={clsx("font-medium", projectedEquityColor)}>
              {formatCurrency(allocation.projectedEquity)}
            </p>
            {allocation.equityAdjustment !== 0 && (
              <span className={clsx(
                "text-xs px-1.5 py-0.5 rounded",
                allocation.equityAdjustment > 0 
                  ? "bg-green-900/30 text-green-400" 
                  : "bg-red-900/30 text-red-400"
              )}>
                {allocation.equityAdjustment > 0 ? '+' : ''}{formatCurrency(allocation.equityAdjustment)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettlementWizard;