import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  PartnerSettlementEquity, 
  PreSettlementAllocation, 
  SettlementSession, 
  SettlementRecord,
  BusinessPartner 
} from '../types';
import { useStakeholders } from './StakeholderContext';
import { useTransactions } from './TransactionContext';

interface SettlementEquityContextType {
  // Data
  partnerEquities: PartnerSettlementEquity[];
  currentSettlementSession: SettlementSession | null;
  
  // Operations
  initializeSettlementSession: (availableCash: number) => SettlementSession;
  updateAllocation: (partnerId: string, newAmount: number) => void;
  processSettlement: (session: SettlementSession, description?: string) => Promise<string>; // Returns settlement point ID
  cancelSettlementSession: () => void;
  
  // Queries
  getPartnerEquity: (partnerId: string) => PartnerSettlementEquity | null;
  calculateRecommendedAllocations: (availableCash: number) => PreSettlementAllocation[];
  canProcessSettlement: (session: SettlementSession) => { canProcess: boolean; errors: string[] };
  
  // History
  getSettlementHistory: () => SettlementRecord[];
  getPartnerSettlementHistory: (partnerId: string) => SettlementRecord[];
}

const SettlementEquityContext = createContext<SettlementEquityContextType | undefined>(undefined);

export const useSettlementEquity = () => {
  const context = useContext(SettlementEquityContext);
  if (context === undefined) {
    throw new Error('useSettlementEquity must be used within a SettlementEquityProvider');
  }
  return context;
};

interface SettlementEquityProviderProps {
  children: ReactNode;
}

export const SettlementEquityProvider: React.FC<SettlementEquityProviderProps> = ({ children }) => {
  const { businessPartners } = useStakeholders();
  const { addTransaction, transactions, getBusinessPartnerPayables } = useTransactions();
  
  const [partnerEquities, setPartnerEquities] = useState<PartnerSettlementEquity[]>([]);
  const [currentSettlementSession, setCurrentSettlementSession] = useState<SettlementSession | null>(null);

  // Load equity data from localStorage on mount
  useEffect(() => {
    const savedEquities = localStorage.getItem('settlementEquities');
    if (savedEquities) {
      try {
        const parsed = JSON.parse(savedEquities);
        setPartnerEquities(parsed.map((equity: any) => ({
          ...equity,
          lastUpdated: new Date(equity.lastUpdated),
          settlementHistory: equity.settlementHistory.map((record: any) => ({
            ...record,
            settlementDate: new Date(record.settlementDate)
          }))
        })));
      } catch (error) {
        console.error('Error loading settlement equities:', error);
      }
    }
  }, []);

  // Save equity data to localStorage whenever it changes
  useEffect(() => {
    if (partnerEquities.length > 0) {
      localStorage.setItem('settlementEquities', JSON.stringify(partnerEquities));
    }
  }, [partnerEquities]);

  // Initialize equity records for new business partners
  useEffect(() => {
    const existingPartnerIds = partnerEquities.map(eq => eq.partnerId);
    const newPartners = businessPartners.filter(partner => !existingPartnerIds.includes(partner.id));
    
    if (newPartners.length > 0) {
      const newEquities: PartnerSettlementEquity[] = newPartners.map(partner => ({
        partnerId: partner.id,
        partnerName: partner.name,
        ownershipPercentage: partner.ownershipPercentage,
        totalOwedAllTime: 0,
        totalReceivedAllTime: 0,
        currentEquity: 0,
        settlementHistory: [],
        lastUpdated: new Date()
      }));
      
      setPartnerEquities(prev => [...prev, ...newEquities]);
    }
  }, [businessPartners, partnerEquities]);

  const getPartnerEquity = (partnerId: string): PartnerSettlementEquity | null => {
    return partnerEquities.find(equity => equity.partnerId === partnerId) || null;
  };

  const calculateRecommendedAllocations = (availableCash: number): PreSettlementAllocation[] => {
    try {
      // Check if there are business partners
      if (!businessPartners || businessPartners.length === 0) {
        console.log('No business partners found');
        return [];
      }
      
      // Get current partner payables (what they are owed)
      const partnerPayables = getBusinessPartnerPayables();
      console.log('Partner payables:', partnerPayables);
      console.log('Business partners:', businessPartners);
      
      // Step 1: Calculate base allocations
      const baseAllocations = businessPartners.map(partner => {
        const equity = getPartnerEquity(partner.id);
        const partnerPayable = partnerPayables.find(p => p.stakeholderId === partner.id);
        
        // The partner's share should be their actual dues (what they're owed)
        const calculatedShare = Math.round(partnerPayable?.netPayable || 0);
        
        // Start with what they're actually owed as the recommended amount
        let recommendedAmount = calculatedShare;
        
        // Apply equity adjustment recommendations based on historical imbalances
        if (equity && equity.currentEquity !== 0) {
          // If they're owed money historically (positive equity), try to give them a bit more
          // If they've received extra historically (negative equity), might give them a bit less
          const maxEquityAdjustment = Math.min(Math.abs(equity.currentEquity), calculatedShare * 0.3); // Max 30% adjustment
          
          if (equity.currentEquity > 0 && calculatedShare > 0) {
            // They were underpaid before, give them a bit extra if we have cash
            recommendedAmount = Math.min(calculatedShare + maxEquityAdjustment, availableCash * 0.6); // Don't give more than 60% to one partner
          } else if (equity.currentEquity < 0 && calculatedShare > 0) {
            // They were overpaid before, give them a bit less
            recommendedAmount = Math.max(calculatedShare - maxEquityAdjustment, calculatedShare * 0.7); // Give at least 70% of what they're owed
          }
        }
        
        // Ensure we don't exceed available cash
        const totalOwedByAllPartners = partnerPayables.reduce((sum, p) => sum + (p.netPayable || 0), 0);
        if (totalOwedByAllPartners > availableCash && calculatedShare > 0) {
          // Scale down proportionally if we don't have enough cash to pay everyone in full
          const scalingFactor = availableCash / totalOwedByAllPartners;
          recommendedAmount = calculatedShare * scalingFactor;
        }
        
        return {
          partner,
          equity,
          calculatedShare,
          rawRecommendedAmount: recommendedAmount
        };
      });
      
      // Step 2: Round amounts and handle total adjustment
      let totalBeforeRounding = baseAllocations.reduce((sum, item) => sum + item.rawRecommendedAmount, 0);
      let roundedAllocations = baseAllocations.map(item => ({
        ...item,
        roundedAmount: Math.round(item.rawRecommendedAmount)
      }));
      
      // Step 3: Adjust for rounding differences to match exact total
      let totalAfterRounding = roundedAllocations.reduce((sum, item) => sum + item.roundedAmount, 0);
      let difference = Math.round(availableCash) - totalAfterRounding;
      
      // Distribute the difference across partners (starting with those with highest remainders)
      if (difference !== 0) {
        // Calculate remainders for smart adjustment
        const remainders = roundedAllocations.map((item, index) => ({
          index,
          remainder: item.rawRecommendedAmount - item.roundedAmount,
          allocation: item
        })).sort((a, b) => Math.abs(b.remainder) - Math.abs(a.remainder));
        
        // Adjust amounts to match total exactly
        for (let i = 0; i < Math.abs(difference) && i < remainders.length; i++) {
          const adjustment = difference > 0 ? 1 : -1;
          roundedAllocations[remainders[i].index].roundedAmount += adjustment;
          difference -= adjustment;
        }
      }
      
      // Step 4: Create final allocation objects
      return roundedAllocations.map(item => {
        const currentEquity = item.equity?.currentEquity || 0;
        const equityAdjustment = item.roundedAmount - item.calculatedShare;
        const projectedEquity = currentEquity + equityAdjustment;
        
        return {
          partnerId: item.partner.id,
          partnerName: item.partner.name,
          ownershipPercentage: item.partner.ownershipPercentage,
          calculatedShare: item.calculatedShare, // What they're actually owed (rounded)
          adjustedAmount: item.roundedAmount, // What we recommend paying them (rounded and adjusted)
          equityAdjustment,
          currentEquity,
          projectedEquity
        };
      });
    } catch (error) {
      console.error('Error calculating recommended allocations:', error);
      // Return default allocations based on ownership if calculation fails
      return businessPartners.map(partner => ({
        partnerId: partner.id,
        partnerName: partner.name,
        ownershipPercentage: partner.ownershipPercentage,
        calculatedShare: 0,
        adjustedAmount: 0,
        equityAdjustment: 0,
        currentEquity: 0,
        projectedEquity: 0
      }));
    }
  };

  const initializeSettlementSession = (availableCash: number): SettlementSession => {
    const sessionId = `settlement_${Date.now()}`;
    const allocations = calculateRecommendedAllocations(availableCash);
    
    const session: SettlementSession = {
      sessionId,
      createdAt: new Date(),
      availableCash,
      allocations,
      isProcessed: false
    };
    
    setCurrentSettlementSession(session);
    return session;
  };

  const updateAllocation = (partnerId: string, newAmount: number) => {
    if (!currentSettlementSession) return;
    
    // Round the new amount to ensure whole numbers
    const roundedAmount = Math.round(newAmount);
    
    setCurrentSettlementSession(prev => {
      if (!prev) return prev;
      
      const updatedAllocations = prev.allocations.map(allocation => {
        if (allocation.partnerId === partnerId) {
          const equityAdjustment = roundedAmount - allocation.calculatedShare;
          const projectedEquity = allocation.currentEquity + equityAdjustment;
          
          return {
            ...allocation,
            adjustedAmount: roundedAmount,
            equityAdjustment,
            projectedEquity
          };
        }
        return allocation;
      });
      
      return {
        ...prev,
        allocations: updatedAllocations
      };
    });
  };

  const canProcessSettlement = (session: SettlementSession): { canProcess: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check if total allocations equal available cash (exact match required after rounding fixes)
    const totalAllocated = session.allocations.reduce((sum, allocation) => sum + Math.round(allocation.adjustedAmount), 0);
    const availableCashRounded = Math.round(session.availableCash);
    
    if (totalAllocated !== availableCashRounded) {
      errors.push(`Total allocated (₹${totalAllocated.toLocaleString()}) must exactly equal available cash (₹${availableCashRounded.toLocaleString()})`);
    }
    
    // Check for negative allocations
    const negativeAllocations = session.allocations.filter(allocation => allocation.adjustedAmount < 0);
    if (negativeAllocations.length > 0) {
      errors.push(`Negative allocations not allowed: ${negativeAllocations.map(a => a.partnerName).join(', ')}`);
    }
    
    // Check for zero allocations (warning, not error)
    const zeroAllocations = session.allocations.filter(allocation => allocation.adjustedAmount === 0);
    if (zeroAllocations.length > 0) {
      // This is just a warning, don't add to errors
    }
    
    return {
      canProcess: errors.length === 0,
      errors
    };
  };

  const processSettlement = async (session: SettlementSession, description?: string): Promise<string> => {
    const validation = canProcessSettlement(session);
    if (!validation.canProcess) {
      throw new Error(`Cannot process settlement: ${validation.errors.join(', ')}`);
    }
    
    try {
      // Generate unique settlement ID
      const settlementId = `settlement_${Date.now()}`;
      const settlementDate = new Date();
      
      // Create distribution transactions for each partner
      for (const allocation of session.allocations) {
        if (allocation.adjustedAmount > 0) {
          addTransaction({
            category: 'sales_profit_distribution',
            stakeholderId: allocation.partnerId,
            stakeholderType: 'business_partner',
            amount: allocation.adjustedAmount,
            description: description || `Settlement Distribution - ${settlementDate.toLocaleDateString()}`,
            date: settlementDate,
            createdBy: 'Settlement System'
          });
        }
      }
      
      // Create Settlement Point transaction
      addTransaction({
        category: 'settlement_point',
        amount: 0,
        description: `Settlement Point - ${settlementDate.toLocaleDateString()} (${session.allocations.length} partners)`,
        date: settlementDate,
        createdBy: 'Settlement System'
      });
      
      // Update partner equities
      const updatedEquities = partnerEquities.map(equity => {
        const allocation = session.allocations.find(a => a.partnerId === equity.partnerId);
        if (allocation) {
          const settlementRecord: SettlementRecord = {
            settlementId,
            settlementDate,
            owedAmount: allocation.calculatedShare,
            actualAmount: allocation.adjustedAmount,
            equityChange: allocation.equityAdjustment,
            reason: allocation.equityAdjustment !== 0 ? 'Manual adjustment during settlement' : undefined
          };
          
          return {
            ...equity,
            totalOwedAllTime: equity.totalOwedAllTime + allocation.calculatedShare,
            totalReceivedAllTime: equity.totalReceivedAllTime + allocation.adjustedAmount,
            currentEquity: equity.currentEquity + allocation.equityAdjustment,
            settlementHistory: [...equity.settlementHistory, settlementRecord],
            lastUpdated: new Date()
          };
        }
        return equity;
      });
      
      setPartnerEquities(updatedEquities);
      
      // Mark session as processed
      setCurrentSettlementSession(prev => prev ? { ...prev, isProcessed: true, settlementDate, settlementPointId: settlementId } : null);
      
      // Clear session after short delay
      setTimeout(() => {
        setCurrentSettlementSession(null);
      }, 2000);
      
      return settlementId;
      
    } catch (error) {
      console.error('Error processing settlement:', error);
      throw error;
    }
  };

  const cancelSettlementSession = () => {
    setCurrentSettlementSession(null);
  };

  const getSettlementHistory = (): SettlementRecord[] => {
    const allRecords: SettlementRecord[] = [];
    partnerEquities.forEach(equity => {
      allRecords.push(...equity.settlementHistory);
    });
    
    // Remove duplicates and sort by date
    const uniqueRecords = allRecords.reduce((acc, record) => {
      const existing = acc.find(r => r.settlementId === record.settlementId);
      if (!existing) {
        acc.push(record);
      }
      return acc;
    }, [] as SettlementRecord[]);
    
    return uniqueRecords.sort((a, b) => new Date(b.settlementDate).getTime() - new Date(a.settlementDate).getTime());
  };

  const getPartnerSettlementHistory = (partnerId: string): SettlementRecord[] => {
    const equity = getPartnerEquity(partnerId);
    return equity?.settlementHistory || [];
  };

  const contextValue: SettlementEquityContextType = {
    // Data
    partnerEquities,
    currentSettlementSession,
    
    // Operations
    initializeSettlementSession,
    updateAllocation,
    processSettlement,
    cancelSettlementSession,
    
    // Queries
    getPartnerEquity,
    calculateRecommendedAllocations,
    canProcessSettlement,
    
    // History
    getSettlementHistory,
    getPartnerSettlementHistory
  };

  return (
    <SettlementEquityContext.Provider value={contextValue}>
      {children}
    </SettlementEquityContext.Provider>
  );
};