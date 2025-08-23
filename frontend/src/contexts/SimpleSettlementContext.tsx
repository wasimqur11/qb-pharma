import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useStakeholders } from './StakeholderContext';
import { useTransactions } from './TransactionContext';

interface PartnerBalance {
  partnerId: string;
  partnerName: string;
  ownershipPercentage: number;
  totalOwed: number;      // What they should get based on ownership
  totalPaid: number;      // What they've actually received
  outstandingBalance: number; // totalOwed - totalPaid (can be negative if overpaid)
  cumulativeBalance: number; // Running balance of over/under payments
}

export interface SettlementDistribution {
  partnerId: string;
  partnerName: string;
  calculatedShare: number;    // What they should get this time
  balanceAdjustment: number;  // Adjustment for previous over/under payments
  finalAmount: number;        // Actual amount to pay (calculatedShare + balanceAdjustment)
  newBalance: number;         // What their balance will be after this payment
}

interface SimpleSettlementContextType {
  // Get current partner balances
  getPartnerBalances: () => PartnerBalance[];
  
  // Calculate adjusted distribution for available cash
  calculateAdjustedDistribution: (availableCash: number) => SettlementDistribution[];
  
  // Process settlement with distributions
  processSimpleSettlement: (distributions: SettlementDistribution[], description?: string, settlementDate?: Date) => void;
  
  // Check if settlement is possible (all balances are zero)
  canCreateSettlement: () => boolean;
  
  // Create settlement point when all balances are zero
  createSettlementPoint: (description?: string) => void;
  
  // Helper to get total outstanding amount
  getTotalOutstanding: () => number;
  
  // Reset all balances (for testing or fresh start)
  resetAllBalances: () => void;
}

const SimpleSettlementContext = createContext<SimpleSettlementContextType | undefined>(undefined);

export const useSimpleSettlement = () => {
  const context = useContext(SimpleSettlementContext);
  if (context === undefined) {
    throw new Error('useSimpleSettlement must be used within a SimpleSettlementProvider');
  }
  return context;
};

interface SimpleSettlementProviderProps {
  children: ReactNode;
}

export const SimpleSettlementProvider: React.FC<SimpleSettlementProviderProps> = ({ children }) => {
  const { businessPartners } = useStakeholders();
  const { addTransaction, getBusinessPartnerPayables } = useTransactions();
  
  // State for cumulative balances (persistent storage)
  const [cumulativeBalances, setCumulativeBalances] = useState<Record<string, number>>({});

  // Load cumulative balances from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('simpleSettlementBalances');
    if (saved) {
      try {
        setCumulativeBalances(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading settlement balances:', error);
      }
    }
  }, []);

  // Save cumulative balances to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('simpleSettlementBalances', JSON.stringify(cumulativeBalances));
  }, [cumulativeBalances]);

  const getPartnerBalances = (): PartnerBalance[] => {
    // Get partner payables (what they're owed based on current system)
    const partnerPayables = getBusinessPartnerPayables();
    
    return businessPartners.map(partner => {
      const payable = partnerPayables.find(p => p.stakeholderId === partner.id);
      
      const totalOwed = Math.round(payable?.totalEarned || 0);
      const totalPaid = Math.round(payable?.totalPaid || 0);
      const rawOutstandingBalance = totalOwed - totalPaid;
      // Apply tolerance for very small amounts to avoid rounding errors
      const outstandingBalance = Math.abs(rawOutstandingBalance) < 1 ? 0 : rawOutstandingBalance;
      const cumulativeBalance = cumulativeBalances[partner.id] || 0;
      
      return {
        partnerId: partner.id,
        partnerName: partner.name,
        ownershipPercentage: partner.ownershipPercentage,
        totalOwed,
        totalPaid,
        outstandingBalance,
        cumulativeBalance: Math.round(cumulativeBalance)
      };
    });
  };

  const calculateAdjustedDistribution = (availableCash: number): SettlementDistribution[] => {
    const balances = getPartnerBalances();
    
    // Step 1: Calculate each partner's raw share based on what they're owed
    const totalOutstanding = balances.reduce((sum, b) => sum + Math.max(0, b.outstandingBalance), 0);
    
    if (totalOutstanding === 0) {
      // No one is owed anything, distribute based on ownership with proper rounding
      const ownershipShares = balances.map(balance => 
        Math.floor(availableCash * (balance.ownershipPercentage / 100))
      );
      
      // Calculate remainder and distribute it
      const totalAllocatedBeforeRemainder = ownershipShares.reduce((sum, share) => sum + share, 0);
      const remainder = availableCash - totalAllocatedBeforeRemainder;
      
      // Distribute remainder to partners with highest ownership percentages
      const partnersWithOwnership = balances
        .map((balance, index) => ({ ...balance, index, baseShare: ownershipShares[index] }))
        .sort((a, b) => b.ownershipPercentage - a.ownershipPercentage);
      
      // Assign remainder to partners
      for (let i = 0; i < remainder && i < partnersWithOwnership.length; i++) {
        ownershipShares[partnersWithOwnership[i].index]++;
      }
      
      return balances.map((balance, index) => {
        const calculatedShare = ownershipShares[index];
        const balanceAdjustment = -balance.cumulativeBalance;
        const rawFinalAmount = calculatedShare + balanceAdjustment;
        const finalAmount = Math.max(0, rawFinalAmount);
        
        return {
          partnerId: balance.partnerId,
          partnerName: balance.partnerName,
          calculatedShare,
          balanceAdjustment,
          finalAmount,
          newBalance: 0
        };
      });
    }
    
    // Step 2: Calculate proportional distribution based on what's owed with proper rounding
    // First calculate base shares for each partner
    const partnerShares = balances.map(balance => {
      if (balance.outstandingBalance <= 0) return 0;
      return Math.floor(availableCash * (balance.outstandingBalance / totalOutstanding));
    });
    
    // Calculate remainder and distribute it
    const totalAllocatedBeforeRemainder = partnerShares.reduce((sum, share) => sum + share, 0);
    const remainder = availableCash - totalAllocatedBeforeRemainder;
    
    // Distribute remainder to partners who are owed money, starting from highest outstanding balance
    const partnersWithBalance = balances
      .map((balance, index) => ({ ...balance, index, baseShare: partnerShares[index] }))
      .filter(p => p.outstandingBalance > 0)
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    
    // Assign remainder to partners
    for (let i = 0; i < remainder && i < partnersWithBalance.length; i++) {
      partnerShares[partnersWithBalance[i].index]++;
    }
    
    // Create final distributions
    let distributions = balances.map((balance, index) => {
      const rawShare = partnerShares[index];
      
      // Apply balance adjustment
      const balanceAdjustment = -balance.cumulativeBalance;
      const finalAmount = Math.max(0, rawShare + balanceAdjustment);
      const actualPaymentDifference = finalAmount - rawShare;
      const rawNewBalance = balance.cumulativeBalance + actualPaymentDifference;
      // Apply tolerance for very small amounts
      const newBalance = Math.abs(rawNewBalance) < 1 ? 0 : rawNewBalance;
      
      return {
        partnerId: balance.partnerId,
        partnerName: balance.partnerName,
        calculatedShare: rawShare,
        balanceAdjustment,
        finalAmount,
        newBalance: Math.round(newBalance)
      };
    });
    
    // Step 3: Final validation - the calculated shares should already sum to availableCash
    // No additional adjustment needed since we used proper rounding distribution
    
    return distributions;
  };

  const processSimpleSettlement = (distributions: SettlementDistribution[], description?: string, settlementDate?: Date) => {
    const transactionDate = settlementDate || new Date();
    const totalPaidOut = distributions.reduce((sum, dist) => sum + dist.finalAmount, 0);
    
    // 1. Create distribution transactions for each partner (these represent actual cash outflow)
    distributions.forEach(dist => {
      if (dist.finalAmount > 0) {
        addTransaction({
          category: 'sales_profit_distribution',
          stakeholderId: dist.partnerId,
          stakeholderType: 'business_partner',
          amount: dist.finalAmount,
          description: description || `Settlement Payment - ${transactionDate.toLocaleDateString()}`,
          date: transactionDate,
          createdBy: 'Simple Settlement System'
        });
      }
    });
    
    // 2. Create Settlement Point transaction (marker)
    addTransaction({
      category: 'settlement_point',
      amount: 0,
      description: `Settlement Point - ${transactionDate.toLocaleDateString()} - Total Distributed: ₹${totalPaidOut.toLocaleString()}`,
      date: transactionDate,
      createdBy: 'Simple Settlement System'
    });
    
    // 3. Update cumulative balances
    const newBalances = { ...cumulativeBalances };
    distributions.forEach(dist => {
      newBalances[dist.partnerId] = dist.newBalance;
    });
    setCumulativeBalances(newBalances);
  };

  const canCreateSettlement = (): boolean => {
    const balances = getPartnerBalances();
    return balances.every(balance => balance.outstandingBalance === 0);
  };

  const getTotalOutstanding = (): number => {
    const balances = getPartnerBalances();
    return balances.reduce((sum, balance) => sum + Math.max(0, balance.outstandingBalance), 0);
  };

  const createSettlementPoint = (description?: string) => {
    if (!canCreateSettlement()) {
      throw new Error('Cannot create settlement point - partners have outstanding balances');
    }

    addTransaction({
      category: 'settlement_point',
      amount: 0,
      description: description || `Settlement Point - ${new Date().toLocaleDateString()}`,
      date: new Date(),
      createdBy: 'Settlement System'
    });
  };

  const resetAllBalances = () => {
    setCumulativeBalances({});
    localStorage.removeItem('simpleSettlementBalances');
  };

  const contextValue: SimpleSettlementContextType = {
    getPartnerBalances,
    calculateAdjustedDistribution,
    processSimpleSettlement,
    canCreateSettlement,
    createSettlementPoint,
    getTotalOutstanding,
    resetAllBalances
  };

  return (
    <SimpleSettlementContext.Provider value={contextValue}>
      {children}
    </SimpleSettlementContext.Provider>
  );
};