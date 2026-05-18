import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

// Server-side aggregates returned by GET /api/transactions/aggregates
export interface TransactionAggregates {
  categories: Record<string, { total: number; count: number }>;
  today: Record<string, number>;
  distributorTransactionTotals: Record<string, { purchases: number; payments: number; creditNotes: number }>;
  lastSettlementPoint: { id: string; date: string; description: string | null } | null;
}
import type { Transaction, DashboardStats, PayableBalance, StakeholderType } from '../types';
import { 
  PHARMACY_REVENUE_CATEGORIES, 
  PHARMACY_EXPENSE_CATEGORIES,
  PHARMACY_OPERATIONAL_EXPENSE_CATEGORIES,
  PARTNER_DISTRIBUTION_CATEGORIES,
  DOCTOR_REVENUE_CATEGORIES,
  DOCTOR_EXPENSE_CATEGORIES,
  EXPENSE_CATEGORIES
} from '../constants/transactionTypes';
import { useStakeholders } from './StakeholderContext';
import { useAuth } from './AuthContext';
import apiClient from '../utils/apiClient';
import { useAutoSync } from '../hooks/useAutoSync';

interface TransactionContextType {
  // Data
  transactions: Transaction[];
  isLoading: boolean;
  aggregates: TransactionAggregates | null;
  aggregatesLoading: boolean;

  // Data loading
  loadTransactions: () => Promise<void>;
  loadAggregates: (startDate?: string, endDate?: string) => Promise<void>;
  
  // Operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Analytics
  getDashboardStats: () => DashboardStats;
  getTransactionsByDateRange: (fromDate: Date, toDate: Date) => Transaction[];
  getTransactionsByType: (category: string) => Transaction[];
  getTotalRevenue: () => number;
  getTodayRevenue: () => number;
  getTotalExpenses: () => number;
  getMonthlyProfit: () => number;
  getCashPosition: () => number;
  
  // Business-specific analytics
  getPharmacyRevenue: () => number;
  getDoctorRevenue: () => number;
  getPharmacyExpenses: () => number;
  getPharmacyOperationalExpenses: () => number;
  getPartnerDistributions: () => number;
  getDoctorExpenses: () => number;
  getTodayPharmacyRevenue: () => number;
  getTodayDoctorRevenue: () => number;
  getPharmacyCashPosition: () => number;
  getDoctorCashPosition: () => number;
  getPharmacyMonthlyProfit: () => number;
  
  // Payables
  getDoctorPayables: () => PayableBalance[];
  getBusinessPartnerPayables: (startDate?: Date, endDate?: Date) => PayableBalance[];
  getEmployeeSalaryDue: () => PayableBalance[];
  getDistributorCredits: () => { id: string; name: string; creditBalance: number }[];
  getPatientCredits: () => { id: string; name: string; creditBalance: number }[];
  
  // Utilities
  getTransactionById: (id: string) => Transaction | undefined;
  getStakeholderTransactions: (stakeholderId: string) => Transaction[];
  getPeriodFilteredStats: (fromDate: Date, toDate: Date) => {
    pharmacyRevenue: number;
    doctorRevenue: number;
    totalRevenue: number;
    pharmacyExpenses: number;
    doctorExpenses: number;
    totalExpenses: number;
    pharmacyCashPosition: number;
    doctorCashPosition: number;
    cashPosition: number;
    transactionCount: number;
  };
  
  // Distributor-specific functions
  getDistributorPaymentsDue: () => { id: string; name: string; amountDue: number; dueDate: string }[];
  addDistributorCreditPurchase: (distributorId: string, amount: number, description: string) => void;
  calculateDistributorCurrentBalance: (distributorId: string) => number;
  
  // Settlement Point functions
  getLastSettlementPoint: () => Transaction | null;
  getDefaultDateRange: () => { from: string; to: string };
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [aggregates, setAggregates] = useState<TransactionAggregates | null>(null);
  const [aggregatesLoading, setAggregatesLoading] = useState(false);
  const { doctors, businessPartners, employees, distributors, patients, updateEmployeeSalaryDueDate, updateDistributor, updatePatient } = useStakeholders();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Load transactions from backend database
  const loadTransactions = async () => {
    if (!isAuthenticated || authLoading) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading all transactions from database...');

      // Use getAllTransactions to fetch all records for accurate calculations
      const response = await apiClient.getAllTransactions();
      if (response.success) {
        // Handle new response structure with pagination
        const transactionsData = response.data?.transactions || response.data || [];
        // Convert date strings to Date objects
        const parsedTransactions = transactionsData.map((t: any) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt)
        }));
        setTransactions(parsedTransactions);
        console.log('Loaded', parsedTransactions?.length || 0, 'transactions from database (all records)');
      } else {
        console.error('Failed to load transactions:', response.error);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load server-side aggregates (lightweight — computes KPIs in one DB query)
  const loadAggregates = async (startDate?: string, endDate?: string) => {
    if (!isAuthenticated || authLoading) return;

    setAggregatesLoading(true);
    try {
      const response = await apiClient.getTransactionAggregates(
        startDate || endDate ? { startDate, endDate } : undefined
      );
      if (response.success && response.data) {
        setAggregates(response.data as TransactionAggregates);
      } else {
        console.error('Failed to load transaction aggregates:', response.error);
      }
    } catch (error) {
      console.error('Error loading transaction aggregates:', error);
    } finally {
      setAggregatesLoading(false);
    }
  };

  // Load transactions when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Load aggregates first (fast) so KPIs render immediately,
      // then load full transaction list for list views
      loadAggregates();
      loadTransactions();
    }
  }, [isAuthenticated, authLoading]);

  // Auto-sync: Poll for data changes and reload when detected
  useAutoSync({
    enabled: isAuthenticated && !authLoading,
    pollInterval: 10000, // Poll every 10 seconds
    onDataChange: (changedTypes) => {
      console.log('[TransactionContext] Auto-sync detected changes:', changedTypes);
      if (changedTypes.includes('transactions')) {
        loadAggregates();
        loadTransactions();
      }
    }
  });

  // Operations
  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      console.log('Creating transaction in database...');
      
      // Save to backend database
      const response = await apiClient.createTransaction(transactionData);
      
      if (response.success) {
        const newTransaction = {
          ...response.data,
          date: new Date(response.data.date),
          createdAt: new Date(response.data.createdAt)
        };
        
        // Add to local state for immediate UI update
        setTransactions(prev => [newTransaction, ...prev]);

        // Refresh aggregates so KPIs reflect the new transaction
        loadAggregates();

        console.log('Transaction created successfully:', newTransaction.id);

        // Continue with existing business logic for stakeholder updates
        await handleStakeholderUpdates(newTransaction);
      } else {
        console.error('Failed to create transaction:', response.error);
        throw new Error(response.error || 'Failed to create transaction');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  // Handle stakeholder-specific updates after transaction creation
  const handleStakeholderUpdates = async (transaction: Transaction) => {

    // Auto-update employee salary due date if this is an employee payment
    if (transaction.category === 'employee_payment' && transaction.stakeholderId) {
      try {
        await updateEmployeeSalaryDueDate(transaction.stakeholderId);
      } catch (error) {
        console.error('Failed to update employee salary due date:', error);
      }
    }

    // NOTE: Distributor credit balance is NOT updated here
    // The creditBalance field stores only the opening balance (imported from offline ledger)
    // Current balance is calculated on-demand from all transactions via calculateDistributorCurrentBalance()
    // This allows transactions to be added in any chronological order

    // Auto-update patient credit balance if this is a credit sale
    if (transaction.category === 'patient_credit_sale' && transaction.stakeholderId) {
      const currentPatient = patients.find(p => p.id === transaction.stakeholderId);
      if (currentPatient) {
        try {
          await updatePatient(transaction.stakeholderId, {
            currentCredit: currentPatient.currentCredit + transaction.amount
          });
        } catch (error) {
          console.error('Failed to update patient credit balance:', error);
        }
      }
    }

    // Auto-update patient credit balance if this is a payment (reduce their outstanding credit)
    if (transaction.category === 'patient_payment' && transaction.stakeholderId) {
      const currentPatient = patients.find(p => p.id === transaction.stakeholderId);
      if (currentPatient) {
        try {
          await updatePatient(transaction.stakeholderId, {
            currentCredit: Math.max(0, currentPatient.currentCredit - transaction.amount)
          });
        } catch (error) {
          console.error('Failed to update patient credit balance:', error);
        }
      }
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      console.log('Updating transaction in database:', id);
      
      const response = await apiClient.updateTransaction(id, updates);
      
      if (response.success) {
        // Update local state
        setTransactions(prev => {
          const updatedTransactions = prev.map(transaction => {
            if (transaction.id === id) {
              return {
                ...transaction,
                ...updates,
                // Ensure date is properly handled
                date: updates.date instanceof Date ? updates.date : transaction.date
              };
            }
            return transaction;
          });
          return updatedTransactions;
        });
        
        console.log('Transaction updated successfully:', id);
      } else {
        console.error('Failed to update transaction:', response.error);
        throw new Error(response.error || 'Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      console.log('Deleting transaction from database:', id);
      
      const response = await apiClient.deleteTransaction(id);
      
      if (response.success) {
        setTransactions(prev => prev.filter(transaction => transaction.id !== id));
        loadAggregates();
        console.log('Transaction deleted successfully:', id);
      } else {
        console.error('Failed to delete transaction:', response.error);
        throw new Error(response.error || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  // ─── Analytics helpers ────────────────────────────────────────────────────
  // Read from server-side aggregates when available; fall back to iterating the
  // transactions array (e.g. before the aggregates response arrives).

  const catTotal = (cat: string): number =>
    aggregates?.categories[cat]?.total ?? 0;

  const todayCatTotal = (cat: string): number =>
    aggregates?.today[cat] ?? 0;

  // Fallback: sum a set of categories from the local transactions array
  const clientSum = (cats: string[]): number =>
    transactions
      .filter(t => cats.includes(t.category))
      .reduce((s, t) => s + t.amount, 0);

  // ─── Analytics - Separated by Business Type ───────────────────────────────

  const getPharmacyRevenue = (): number => {
    if (aggregates) return PHARMACY_REVENUE_CATEGORIES.reduce((s, c) => s + catTotal(c), 0);
    return clientSum(PHARMACY_REVENUE_CATEGORIES);
  };

  const getDoctorRevenue = (): number => {
    if (aggregates) return DOCTOR_REVENUE_CATEGORIES.reduce((s, c) => s + catTotal(c), 0);
    return clientSum(DOCTOR_REVENUE_CATEGORIES);
  };

  const getDoctorExpenses = (): number => {
    if (aggregates) return DOCTOR_EXPENSE_CATEGORIES.reduce((s, c) => s + catTotal(c), 0);
    return clientSum(DOCTOR_EXPENSE_CATEGORIES);
  };

  const getTotalRevenue = (): number => getPharmacyRevenue() + getDoctorRevenue();

  const getTodayPharmacyRevenue = (): number => {
    if (aggregates) return PHARMACY_REVENUE_CATEGORIES.reduce((s, c) => s + todayCatTotal(c), 0);
    const today = new Date().toDateString();
    return transactions
      .filter(t => PHARMACY_REVENUE_CATEGORIES.includes(t.category) && t.date.toDateString() === today)
      .reduce((s, t) => s + t.amount, 0);
  };

  const getTodayDoctorRevenue = (): number => {
    if (aggregates) return DOCTOR_REVENUE_CATEGORIES.reduce((s, c) => s + todayCatTotal(c), 0);
    const today = new Date().toDateString();
    return transactions
      .filter(t => DOCTOR_REVENUE_CATEGORIES.includes(t.category) && t.date.toDateString() === today)
      .reduce((s, t) => s + t.amount, 0);
  };

  const getTodayRevenue = (): number => getTodayPharmacyRevenue() + getTodayDoctorRevenue();

  const getPharmacyExpenses = (): number => {
    if (aggregates) return PHARMACY_OPERATIONAL_EXPENSE_CATEGORIES.reduce((s, c) => s + catTotal(c), 0);
    return clientSum(PHARMACY_OPERATIONAL_EXPENSE_CATEGORIES);
  };

  const getPharmacyOperationalExpenses = (): number => getPharmacyExpenses();

  const getPartnerDistributions = (): number => {
    if (aggregates) return PARTNER_DISTRIBUTION_CATEGORIES.reduce((s, c) => s + catTotal(c), 0);
    return clientSum(PARTNER_DISTRIBUTION_CATEGORIES);
  };

  const getTotalExpenses = (): number => {
    if (aggregates) return EXPENSE_CATEGORIES.reduce((s, c) => s + catTotal(c), 0);
    return clientSum(EXPENSE_CATEGORIES);
  };

  const getPharmacyMonthlyProfit = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get monthly business partner payables data to calculate total profit earned by partners
    const monthlyPartnerPayables = getBusinessPartnerPayables(firstDayOfMonth, now);
    
    // Sum of all profit earned by partners (their share of the total pharmacy profit)
    const totalPartnerProfitEarned = monthlyPartnerPayables.reduce((sum, partner) => {
      return sum + partner.totalEarned;
    }, 0);
    
    return totalPartnerProfitEarned;
  };

  const getMonthlyProfit = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyRevenue = transactions
      .filter(t => 
        ['pharmacy_sale', 'consultation_fee', 'patient_payment'].includes(t.category) &&
        t.date >= firstDayOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = transactions
      .filter(t => 
        ['distributor_payment', 'doctor_expense', 'employee_payment', 'clinic_expense', 'sales_profit_distribution'].includes(t.category) &&
        t.date >= firstDayOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    return monthlyRevenue - monthlyExpenses;
  };

  const getPharmacyCashPosition = (): number => {
    // Cash in Hand = (pharmacy_sale + patient_payment)
    //   - distributor_payment - sales_profit_distribution
    //   - employee_payment - clinic_expense - patient_credit_sale
    const pharmacyRevenue = getPharmacyRevenue();
    const distributorPayments      = aggregates ? catTotal('distributor_payment')       : transactions.filter(t => t.category === 'distributor_payment').reduce((s, t) => s + t.amount, 0);
    const salesProfitDistributions = aggregates ? catTotal('sales_profit_distribution') : transactions.filter(t => t.category === 'sales_profit_distribution').reduce((s, t) => s + t.amount, 0);
    const employeePayments         = aggregates ? catTotal('employee_payment')          : transactions.filter(t => t.category === 'employee_payment').reduce((s, t) => s + t.amount, 0);
    const clinicExpenses           = aggregates ? catTotal('clinic_expense')            : transactions.filter(t => t.category === 'clinic_expense').reduce((s, t) => s + t.amount, 0);
    const patientCreditSales       = aggregates ? catTotal('patient_credit_sale')       : transactions.filter(t => t.category === 'patient_credit_sale').reduce((s, t) => s + t.amount, 0);
    return pharmacyRevenue - distributorPayments - salesProfitDistributions - employeePayments - clinicExpenses - patientCreditSales;
  };

  const getDoctorCashPosition = (): number => getDoctorRevenue() - getDoctorExpenses();

  const getCashPosition = (): number => {
    const totalRevenue = getPharmacyRevenue() + getDoctorRevenue();
    const totalExpenses = getTotalExpenses();
    return totalRevenue - totalExpenses;
  };

  // Payables calculation
  const getDoctorPayables = (): PayableBalance[] => {
    return doctors.map(doctor => {
      const doctorTransactions = transactions.filter(t => 
        t.stakeholderId === doctor.id && t.stakeholderType === 'doctor'
      );
      
      const totalEarned = doctorTransactions
        .filter(t => t.category === 'consultation_fee')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalPaid = doctorTransactions
        .filter(t => t.category === 'doctor_expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const netPayable = totalEarned - totalPaid;
      
      return {
        stakeholderId: doctor.id,
        stakeholderType: 'doctor' as StakeholderType,
        stakeholderName: doctor.name,
        totalEarned,
        totalPaid,
        netPayable,
        lastUpdated: new Date()
      };
    }).filter(payable => payable.netPayable > 0);
  };

  const getBusinessPartnerPayables = (startDate?: Date, endDate?: Date): PayableBalance[] => {
    // Calculate total available profit first
    let pharmacyCashInHand, totalSalesProfitDistribution;
    if (startDate && endDate) {
      // Get period-filtered stats for pharmacy cash in hand
      const periodStats = getPeriodFilteredStats(startDate, endDate);
      pharmacyCashInHand = periodStats.pharmacyCashPosition;
      
      // Calculate total sales profit distributions for the period
      const periodTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      
      totalSalesProfitDistribution = periodTransactions
        .filter(t => t.category === 'sales_profit_distribution')
        .reduce((sum, t) => sum + t.amount, 0);
    } else {
      // Use all-time data
      pharmacyCashInHand = getPharmacyCashPosition();
      
      totalSalesProfitDistribution = transactions
        .filter(t => t.category === 'sales_profit_distribution')
        .reduce((sum, t) => sum + t.amount, 0);
    }
    
    const totalAvailableProfit = pharmacyCashInHand + totalSalesProfitDistribution;
    
    // Calculate shares with proper rounding distribution to ensure total equals exactly totalAvailableProfit
    const baseShare = Math.floor(totalAvailableProfit / businessPartners.length);
    const remainder = totalAvailableProfit - (baseShare * businessPartners.length);
    
    // Create partner data with properly distributed shares
    const partnerShares = businessPartners.map((partner, index) => {
      // Filter transactions by date range if provided
      let partnerTransactions = transactions.filter(t => 
        t.stakeholderId === partner.id && t.stakeholderType === 'business_partner'
      );
      
      if (startDate && endDate) {
        partnerTransactions = partnerTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      }
      
      // Assign share: first 'remainder' partners get baseShare + 1, others get baseShare
      const totalEarned = baseShare + (index < remainder ? 1 : 0);
      
      const totalPaid = partnerTransactions
        .filter(t => t.category === 'sales_profit_distribution')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const netPayable = totalEarned - totalPaid;
      
      return {
        stakeholderId: partner.id,
        stakeholderType: 'business_partner' as StakeholderType,
        stakeholderName: partner.name,
        totalEarned,
        totalPaid,
        netPayable,
        lastUpdated: new Date()
      };
    });
    
    return partnerShares.filter(payable => payable.netPayable > 0);
  };

  const getEmployeeSalaryDue = (): PayableBalance[] => {
    const today = new Date();
    
    return employees.map(employee => {
      const dueDate = new Date(employee.salaryDueDate);
      
      // Only show salary as earned if today is on or after the due date
      // If salary was paid on 1-8-2025 and next due date is 1-9-2025, 
      // then salary should only be due on/after 1-9-2025
      const totalEarned = today >= dueDate ? employee.salary : 0;
      
      // Calculate total paid since the last due date
      // We need to look at payments made since the previous salary cycle
      const previousDueDate = new Date(dueDate);
      if (employee.salaryFrequency === 'monthly') {
        previousDueDate.setMonth(previousDueDate.getMonth() - 1);
      } else if (employee.salaryFrequency === 'bi-weekly') {
        previousDueDate.setDate(previousDueDate.getDate() - 14);
      } else if (employee.salaryFrequency === 'weekly') {
        previousDueDate.setDate(previousDueDate.getDate() - 7);
      }
      
      // Get payments made in the current salary cycle (from previous due date until now)
      const employeeTransactions = transactions.filter(t => 
        t.stakeholderId === employee.id && 
        t.stakeholderType === 'employee' &&
        t.date >= previousDueDate &&
        t.date <= today
      );
      
      const totalPaid = employeeTransactions
        .filter(t => t.category === 'employee_payment')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const netPayable = totalEarned - totalPaid;
      
      return {
        stakeholderId: employee.id,
        stakeholderType: 'employee' as StakeholderType,
        stakeholderName: employee.name,
        totalEarned,
        totalPaid,
        netPayable,
        lastUpdated: new Date()
      };
    }).filter(payable => payable.netPayable > 0);
  };

  // Calculate current distributor credit balance.
  // Uses server-side aggregates when available (covers ALL historical transactions,
  // not just what is currently loaded in the client state).
  const calculateDistributorCurrentBalance = (distributorId: string): number => {
    const distributor = distributors.find(d => d.id === distributorId);
    if (!distributor) return 0;

    // Opening balance (imported from offline ledger; never mutated by individual transactions)
    let balance = distributor.creditBalance;

    if (aggregates?.distributorTransactionTotals) {
      const totals = aggregates.distributorTransactionTotals[distributorId];
      if (totals) {
        balance += totals.purchases - totals.payments - totals.creditNotes;
      }
    } else {
      // Fallback while aggregates are loading
      const distTx = transactions.filter(
        t => t.stakeholderId === distributorId &&
          ['distributor_credit_purchase', 'distributor_payment', 'distributor_credit_note'].includes(t.category)
      );
      distTx.forEach(t => {
        if (t.category === 'distributor_credit_purchase') balance += t.amount;
        else if (t.category === 'distributor_payment')    balance -= t.amount;
        else if (t.category === 'distributor_credit_note') balance -= t.amount;
      });
    }

    return Math.max(0, balance);
  };

  const getDistributorCredits = () => {
    return distributors.map(distributor => {
      const calculatedBalance = calculateDistributorCurrentBalance(distributor.id);
      return {
        id: distributor.id,
        name: distributor.name,
        creditBalance: calculatedBalance
      };
    }).filter(dist => dist.creditBalance > 0);
  };

  const getPatientCredits = () => {
    return patients.map(patient => ({
      id: patient.id,
      name: patient.name,
      creditBalance: patient.currentCredit
    })).filter(patient => patient.creditBalance > 0);
  };

  const getDashboardStats = (): DashboardStats => {
    // Get date range from last settlement point for payables calculation
    const defaultRange = getDefaultDateRange();
    const settlementFromDate = new Date(defaultRange.from);
    const settlementToDate = new Date(defaultRange.to);

    return {
      // Combined metrics (all businesses)
      todayRevenue: getTodayRevenue(),
      totalExpenses: getTotalExpenses(),
      cashPosition: getCashPosition(),
      monthlyProfit: getMonthlyProfit(),

      // Pharmacy-specific metrics (pharmacy business only)
      pharmacyRevenue: getPharmacyRevenue(),
      todayPharmacyRevenue: getTodayPharmacyRevenue(),
      pharmacyExpenses: getPharmacyExpenses(),
      pharmacyCashPosition: getPharmacyCashPosition(),
      pharmacyMonthlyProfit: getPharmacyMonthlyProfit(),

      // Doctor-specific metrics (doctor accounts only)
      doctorRevenue: getDoctorRevenue(),
      todayDoctorRevenue: getTodayDoctorRevenue(),
      doctorExpenses: getDoctorExpenses(),
      doctorCashPosition: getDoctorCashPosition(),

      // Payables - calculated from last settlement point (or start if no settlement)
      doctorPayables: getDoctorPayables(),
      businessPartnerPayables: getBusinessPartnerPayables(settlementFromDate, settlementToDate),
      employeeSalaryDue: getEmployeeSalaryDue(),
      distributorCredits: getDistributorCredits()
    };
  };

  const getTransactionsByDateRange = (fromDate: Date, toDate: Date) => {
    return transactions.filter(t => 
      t.date >= fromDate && t.date <= toDate
    );
  };

  const getTransactionsByType = (category: string) => {
    return transactions.filter(t => t.category === category);
  };

  // Period-filtered analytics functions
  const getPeriodFilteredStats = (fromDate: Date, toDate: Date) => {
    const periodTransactions = getTransactionsByDateRange(fromDate, toDate);
    
    const getPharmacyRevenueForPeriod = () => {
      return periodTransactions
        .filter(t => PHARMACY_REVENUE_CATEGORIES.includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const getDoctorRevenueForPeriod = () => {
      return periodTransactions
        .filter(t => DOCTOR_REVENUE_CATEGORIES.includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const getPharmacyExpensesForPeriod = () => {
      return periodTransactions
        .filter(t => PHARMACY_OPERATIONAL_EXPENSE_CATEGORIES.includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const getDoctorExpensesForPeriod = () => {
      return periodTransactions
        .filter(t => DOCTOR_EXPENSE_CATEGORIES.includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const getTotalExpensesForPeriod = () => {
      return periodTransactions
        .filter(t => EXPENSE_CATEGORIES.includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);
    };

    const pharmacyRevenue = getPharmacyRevenueForPeriod();
    const doctorRevenue = getDoctorRevenueForPeriod();
    const pharmacyExpenses = getPharmacyExpensesForPeriod();
    const doctorExpenses = getDoctorExpensesForPeriod();
    const totalExpenses = getTotalExpensesForPeriod();

    return {
      pharmacyRevenue,
      doctorRevenue,
      totalRevenue: pharmacyRevenue + doctorRevenue,
      pharmacyExpenses,
      doctorExpenses,
      totalExpenses,
      pharmacyCashPosition: (() => {
        // Apply same formula for period-filtered data: Total Sale - Distributor Payment - Sales Profit Distribution - Employee Payment - Clinic Expense + Patient Payment
        const distributorPayments = periodTransactions
          .filter(t => t.category === 'distributor_payment')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const salesProfitDistributions = periodTransactions
          .filter(t => t.category === 'sales_profit_distribution')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const employeePayments = periodTransactions
          .filter(t => t.category === 'employee_payment')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const clinicExpenses = periodTransactions
          .filter(t => t.category === 'clinic_expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const patientCreditSales = periodTransactions
          .filter(t => t.category === 'patient_credit_sale')
          .reduce((sum, t) => sum + t.amount, 0);
        
        return pharmacyRevenue - distributorPayments - salesProfitDistributions - employeePayments - clinicExpenses - patientCreditSales;
      })(),
      doctorCashPosition: doctorRevenue - doctorExpenses,
      cashPosition: (pharmacyRevenue + doctorRevenue) - totalExpenses,
      transactionCount: periodTransactions.length
    };
  };

  const getTransactionById = (id: string) => {
    return transactions.find(t => t.id === id);
  };

  const getStakeholderTransactions = (stakeholderId: string) => {
    return transactions.filter(t => t.stakeholderId === stakeholderId);
  };

  // Distributor-specific functions
  const getDistributorPaymentsDue = () => {
    const today = new Date();
    
    return distributors
      .filter(distributor => {
        const dueDate = new Date(distributor.nextPaymentDue);
        const currentBalance = calculateDistributorCurrentBalance(distributor.id);
        return dueDate <= today && currentBalance > 0;
      })
      .map(distributor => {
        const currentBalance = calculateDistributorCurrentBalance(distributor.id);
        const amountDue = (currentBalance * distributor.paymentPercentage) / 100;
        return {
          id: distributor.id,
          name: distributor.name,
          amountDue,
          dueDate: distributor.nextPaymentDue
        };
      });
  };

  const addDistributorCreditPurchase = (distributorId: string, amount: number, description: string) => {
    // Generate a more robust unique ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 5);
    const uniqueId = `${timestamp}-${randomSuffix}`;
    
    // Add internal tracking transaction (doesn't affect business transactions)
    const newTransaction: Transaction = {
      id: uniqueId,
      category: 'distributor_credit_purchase',
      stakeholderId: distributorId,
      stakeholderType: 'distributor',
      amount,
      description: `Credit Purchase: ${description}`,
      date: new Date(),
      createdBy: 'System',
      createdAt: new Date()
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update distributor's credit balance using current state
    const currentDistributor = distributors.find(d => d.id === distributorId);
    if (currentDistributor) {
      updateDistributor(distributorId, {
        creditBalance: currentDistributor.creditBalance + amount
      });
    }
  };

  // Settlement Point functions
  const getLastSettlementPoint = (): Transaction | null => {
    // Prefer server-side aggregates: covers all historical records, not just what's loaded
    if (aggregates?.lastSettlementPoint) {
      const sp = aggregates.lastSettlementPoint;
      return {
        id: sp.id,
        category: 'settlement_point',
        amount: 0,
        date: new Date(sp.date),
        description: sp.description ?? '',
        createdBy: '',
        createdAt: new Date(sp.date)
      } as Transaction;
    }
    // Fallback while aggregates are loading
    const settlementPoints = transactions
      .filter(t => t.category === 'settlement_point')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return settlementPoints.length > 0 ? settlementPoints[0] : null;
  };
  
  const getDefaultDateRange = (): { from: string; to: string } => {
    const lastSettlement = getLastSettlementPoint();
    const today = new Date();
    
    if (lastSettlement) {
      // Start from day after last settlement
      const fromDate = new Date(lastSettlement.date);
      fromDate.setDate(fromDate.getDate() + 1);
      
      return {
        from: fromDate.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      };
    } else {
      // Fallback to 30 days if no settlement point
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      
      return {
        from: fromDate.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0]
      };
    }
  };

  const contextValue = useMemo((): TransactionContextType => ({
    // Data
    transactions,
    isLoading,
    aggregates,
    aggregatesLoading,

    // Data loading
    loadTransactions,
    loadAggregates,

    // Operations
    addTransaction,
    updateTransaction,
    deleteTransaction,

    // Analytics
    getDashboardStats,
    getTransactionsByDateRange,
    getTransactionsByType,
    getTotalRevenue,
    getTodayRevenue,
    getTotalExpenses,
    getMonthlyProfit,
    getCashPosition,

    // Business-specific analytics
    getPharmacyRevenue,
    getDoctorRevenue,
    getPharmacyExpenses,
    getPharmacyOperationalExpenses,
    getPartnerDistributions,
    getDoctorExpenses,
    getTodayPharmacyRevenue,
    getTodayDoctorRevenue,
    getPharmacyCashPosition,
    getDoctorCashPosition,
    getPharmacyMonthlyProfit,

    // Payables
    getDoctorPayables,
    getBusinessPartnerPayables,
    getEmployeeSalaryDue,
    getDistributorCredits,
    getPatientCredits,

    // Utilities
    getTransactionById,
    getStakeholderTransactions,
    getPeriodFilteredStats,

    // Distributor-specific functions
    getDistributorPaymentsDue,
    addDistributorCreditPurchase,
    calculateDistributorCurrentBalance,

    // Settlement Point functions
    getLastSettlementPoint,
    getDefaultDateRange
  }), [transactions, isLoading, aggregates, aggregatesLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};