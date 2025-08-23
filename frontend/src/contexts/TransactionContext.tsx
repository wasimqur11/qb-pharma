import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
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

interface TransactionContextType {
  // Data
  transactions: Transaction[];
  
  // Operations
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
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
  // Start with empty transactions - stakeholders are pre-loaded for testing
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { doctors, businessPartners, employees, distributors, patients, updateEmployeeSalaryDueDate, updateDistributor, updatePatient } = useStakeholders();

  // Operations
  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    // Generate a more robust unique ID
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 5);
    const uniqueId = `${timestamp}-${randomSuffix}`;
    
    const newTransaction: Transaction = {
      ...transactionData,
      id: uniqueId,
      createdAt: new Date()
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Auto-update employee salary due date if this is an employee payment
    if (newTransaction.category === 'employee_payment' && newTransaction.stakeholderId) {
      updateEmployeeSalaryDueDate(newTransaction.stakeholderId);
    }
    
    // Auto-update distributor credit balance if this is a credit purchase or credit note
    if ((newTransaction.category === 'distributor_credit_purchase' || newTransaction.category === 'distributor_credit_note') && newTransaction.stakeholderId) {
      // Use callback to get current distributor state to avoid stale closure
      const currentDistributor = distributors.find(d => d.id === newTransaction.stakeholderId);
      if (currentDistributor) {
        const balanceChange = newTransaction.category === 'distributor_credit_purchase' 
          ? newTransaction.amount  // Add for credit purchase
          : -newTransaction.amount; // Subtract for credit note (return)
        updateDistributor(newTransaction.stakeholderId, {
          creditBalance: Math.max(0, currentDistributor.creditBalance + balanceChange)
        });
      }
    }

    // Auto-update patient credit balance if this is a credit sale
    if (newTransaction.category === 'patient_credit_sale' && newTransaction.stakeholderId) {
      const currentPatient = patients.find(p => p.id === newTransaction.stakeholderId);
      if (currentPatient) {
        updatePatient(newTransaction.stakeholderId, {
          currentCredit: currentPatient.currentCredit + newTransaction.amount
        });
      }
    }

    // Auto-update patient credit balance if this is a payment (reduce their outstanding credit)
    if (newTransaction.category === 'patient_payment' && newTransaction.stakeholderId) {
      const currentPatient = patients.find(p => p.id === newTransaction.stakeholderId);
      if (currentPatient) {
        updatePatient(newTransaction.stakeholderId, {
          currentCredit: Math.max(0, currentPatient.currentCredit - newTransaction.amount)
        });
      }
    }
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => {
      const updatedTransactions = prev.map(transaction => {
        if (transaction.id === id) {
          // Create a completely new object to ensure React detects the change
          return {
            ...transaction,
            ...updates,
            // Ensure date is properly handled
            date: updates.date instanceof Date ? updates.date : transaction.date
          };
        }
        return transaction;
      });
      
      // Verify exactly one transaction was updated
      const changedCount = updatedTransactions.filter((t, index) => t !== prev[index]).length;
      if (changedCount !== 1) {
        console.warn(`updateTransaction: Expected 1 change, but ${changedCount} transactions were affected for ID ${id}`);
      }
      
      return updatedTransactions;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  // Analytics - Separated by Business Type
  const getPharmacyRevenue = () => {
    return transactions
      .filter(t => PHARMACY_REVENUE_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getDoctorRevenue = () => {
    return transactions
      .filter(t => DOCTOR_REVENUE_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getDoctorExpenses = () => {
    return transactions
      .filter(t => DOCTOR_EXPENSE_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalRevenue = () => {
    return getPharmacyRevenue() + getDoctorRevenue();
  };

  const getTodayPharmacyRevenue = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(t => 
        PHARMACY_REVENUE_CATEGORIES.includes(t.category) &&
        t.date.toDateString() === today
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTodayDoctorRevenue = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(t => 
        DOCTOR_REVENUE_CATEGORIES.includes(t.category) &&
        t.date.toDateString() === today
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTodayRevenue = () => {
    return getTodayPharmacyRevenue() + getTodayDoctorRevenue();
  };

  const getPharmacyExpenses = () => {
    return transactions
      .filter(t => PHARMACY_OPERATIONAL_EXPENSE_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getPharmacyOperationalExpenses = () => {
    return transactions
      .filter(t => PHARMACY_OPERATIONAL_EXPENSE_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getPartnerDistributions = () => {
    return transactions
      .filter(t => PARTNER_DISTRIBUTION_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => EXPENSE_CATEGORIES.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
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

  const getPharmacyCashPosition = () => {
    // Formula: Total Sale - Distributor Payment - Sales Profit Distribution - Employee Payment - Clinic Expense + Patient Payment
    const pharmacyRevenue = getPharmacyRevenue(); // Includes: pharmacy_sale + patient_payment + distributor_credit_note
    
    // Calculate all pharmacy-related expenses according to the specified formula
    const distributorPayments = transactions
      .filter(t => t.category === 'distributor_payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const salesProfitDistributions = transactions
      .filter(t => t.category === 'sales_profit_distribution')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const employeePayments = transactions
      .filter(t => t.category === 'employee_payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const clinicExpenses = transactions
      .filter(t => t.category === 'clinic_expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const patientCreditSales = transactions
      .filter(t => t.category === 'patient_credit_sale')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Cash in Hand = Total Sale + Patient Payment - Distributor Payment - Sales Profit Distribution - Employee Payment - Clinic Expense - Patient Credit Sale
    return pharmacyRevenue - distributorPayments - salesProfitDistributions - employeePayments - clinicExpenses - patientCreditSales;
  };

  const getDoctorCashPosition = () => {
    return getDoctorRevenue() - getDoctorExpenses();
  };

  const getCashPosition = () => {
    // Use consistent calculation: (Pharmacy + Doctor Revenue) - Total Expenses
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

  // Calculate current distributor credit balance from transactions
  const calculateDistributorCurrentBalance = (distributorId: string): number => {
    const distributor = distributors.find(d => d.id === distributorId);
    if (!distributor) return 0;
    
    // Since the distributor's creditBalance is automatically maintained by addTransaction(),
    // we can simply return the stored balance to avoid double-counting transactions
    return distributor.creditBalance;
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
      
      // Payables
      doctorPayables: getDoctorPayables(),
      businessPartnerPayables: getBusinessPartnerPayables(),
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

  const contextValue: TransactionContextType = {
    // Data
    transactions,
    
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
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};