import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Transaction, DashboardStats, PayableBalance, StakeholderType } from '../types';
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
  getMonthlyProfit: () => number;
  getCashPosition: () => number;
  
  // Business-specific analytics
  getPharmacyRevenue: () => number;
  getDoctorRevenue: () => number;
  getTodayPharmacyRevenue: () => number;
  getTodayDoctorRevenue: () => number;
  getPharmacyCashPosition: () => number;
  getPharmacyMonthlyProfit: () => number;
  
  // Payables
  getDoctorPayables: () => PayableBalance[];
  getBusinessPartnerPayables: () => PayableBalance[];
  getEmployeeSalaryDue: () => PayableBalance[];
  getDistributorCredits: () => { id: string; name: string; creditBalance: number }[];
  
  // Utilities
  getTransactionById: (id: string) => Transaction | undefined;
  getStakeholderTransactions: (stakeholderId: string) => Transaction[];
  
  // Distributor-specific functions
  getDistributorPaymentsDue: () => { id: string; name: string; amountDue: number; dueDate: string }[];
  addDistributorCreditPurchase: (distributorId: string, amount: number, description: string) => void;
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
  const { doctors, businessPartners, employees, distributors, updateEmployeeSalaryDueDate, updateDistributor } = useStakeholders();

  // Operations
  const addTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      createdAt: new Date()
    };
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Auto-update employee salary due date if this is an employee payment
    if (newTransaction.category === 'employee_payment' && newTransaction.stakeholderId) {
      updateEmployeeSalaryDueDate(newTransaction.stakeholderId);
    }
    
    // Auto-update distributor credit balance if this is a credit purchase
    if (newTransaction.category === 'distributor_credit_purchase' && newTransaction.stakeholderId) {
      const distributor = distributors.find(d => d.id === newTransaction.stakeholderId);
      if (distributor) {
        updateDistributor(newTransaction.stakeholderId, {
          creditBalance: distributor.creditBalance + newTransaction.amount
        });
      }
    }
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(prev => prev.map(transaction => 
      transaction.id === id ? { ...transaction, ...updates } : transaction
    ));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(transaction => transaction.id !== id));
  };

  // Analytics - Separated by Business Type
  const getPharmacyRevenue = () => {
    return transactions
      .filter(t => ['pharmacy_sale', 'patient_payment', 'patient_credit_sale'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getDoctorRevenue = () => {
    return transactions
      .filter(t => t.category === 'consultation_fee')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalRevenue = () => {
    return getPharmacyRevenue() + getDoctorRevenue();
  };

  const getTodayPharmacyRevenue = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(t => 
        ['pharmacy_sale', 'patient_payment', 'patient_credit_sale'].includes(t.category) &&
        t.date.toDateString() === today
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTodayDoctorRevenue = () => {
    const today = new Date().toDateString();
    return transactions
      .filter(t => 
        t.category === 'consultation_fee' &&
        t.date.toDateString() === today
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTodayRevenue = () => {
    return getTodayPharmacyRevenue() + getTodayDoctorRevenue();
  };

  const getPharmacyExpenses = () => {
    return transactions
      .filter(t => ['distributor_payment', 'employee_payment', 'clinic_expense', 'business_partner_payment'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpenses = () => {
    return transactions
      .filter(t => ['distributor_payment', 'doctor_expense', 'employee_payment', 'clinic_expense', 'business_partner_payment'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getPharmacyMonthlyProfit = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyPharmacyRevenue = transactions
      .filter(t => 
        ['pharmacy_sale', 'patient_payment', 'patient_credit_sale'].includes(t.category) &&
        t.date >= firstDayOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyPharmacyExpenses = transactions
      .filter(t => 
        ['distributor_payment', 'employee_payment', 'clinic_expense', 'business_partner_payment'].includes(t.category) &&
        t.date >= firstDayOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    return monthlyPharmacyRevenue - monthlyPharmacyExpenses;
  };

  const getMonthlyProfit = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyRevenue = transactions
      .filter(t => 
        ['pharmacy_sale', 'consultation_fee', 'patient_payment', 'patient_credit_sale'].includes(t.category) &&
        t.date >= firstDayOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyExpenses = transactions
      .filter(t => 
        ['distributor_payment', 'doctor_expense', 'employee_payment', 'clinic_expense', 'business_partner_payment'].includes(t.category) &&
        t.date >= firstDayOfMonth
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    return monthlyRevenue - monthlyExpenses;
  };

  const getPharmacyCashPosition = () => {
    return getPharmacyRevenue() - getPharmacyExpenses();
  };

  const getCashPosition = () => {
    return getTotalRevenue() - getTotalExpenses();
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

  const getBusinessPartnerPayables = (): PayableBalance[] => {
    return businessPartners.map(partner => {
      const partnerTransactions = transactions.filter(t => 
        t.stakeholderId === partner.id && t.stakeholderType === 'business_partner'
      );
      
      // Calculate profit share based on ownership percentage
      // Profit = Pharmacy Revenue - All Pharmacy Expenses
      const pharmacyRevenue = getPharmacyRevenue();
      const pharmacyExpenses = getPharmacyExpenses();
      const totalProfit = pharmacyRevenue - pharmacyExpenses;
      
      // Partner's share = Total Profit * Ownership Percentage
      const totalEarned = (totalProfit * partner.ownershipPercentage) / 100;
      
      const totalPaid = partnerTransactions
        .filter(t => t.category === 'business_partner_payment')
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
    }).filter(payable => payable.netPayable > 0);
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

  const getDistributorCredits = () => {
    return distributors.map(distributor => ({
      id: distributor.id,
      name: distributor.name,
      creditBalance: distributor.creditBalance
    })).filter(dist => dist.creditBalance > 0);
  };

  const getDashboardStats = (): DashboardStats => {
    return {
      // Combined metrics (all businesses)
      todayRevenue: getTodayRevenue(),
      cashPosition: getCashPosition(),
      monthlyProfit: getMonthlyProfit(),
      
      // Pharmacy-specific metrics (pharmacy business only)
      pharmacyRevenue: getPharmacyRevenue(),
      todayPharmacyRevenue: getTodayPharmacyRevenue(),
      pharmacyCashPosition: getPharmacyCashPosition(),
      pharmacyMonthlyProfit: getPharmacyMonthlyProfit(),
      
      // Doctor-specific metrics (doctor accounts only)
      doctorRevenue: getDoctorRevenue(),
      todayDoctorRevenue: getTodayDoctorRevenue(),
      
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
        return dueDate <= today && distributor.creditBalance > 0;
      })
      .map(distributor => {
        const amountDue = (distributor.creditBalance * distributor.paymentPercentage) / 100;
        return {
          id: distributor.id,
          name: distributor.name,
          amountDue,
          dueDate: distributor.nextPaymentDue
        };
      });
  };

  const addDistributorCreditPurchase = (distributorId: string, amount: number, description: string) => {
    // Add internal tracking transaction (doesn't affect business transactions)
    const newTransaction: Transaction = {
      id: Date.now().toString(),
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
    
    // Update distributor's credit balance
    const distributor = distributors.find(d => d.id === distributorId);
    if (distributor) {
      updateDistributor(distributorId, {
        creditBalance: distributor.creditBalance + amount
      });
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
    getMonthlyProfit,
    getCashPosition,
    
    // Business-specific analytics
    getPharmacyRevenue,
    getDoctorRevenue,
    getTodayPharmacyRevenue,
    getTodayDoctorRevenue,
    getPharmacyCashPosition,
    getPharmacyMonthlyProfit,
    
    // Payables
    getDoctorPayables,
    getBusinessPartnerPayables,
    getEmployeeSalaryDue,
    getDistributorCredits,
    
    // Utilities
    getTransactionById,
    getStakeholderTransactions,
    
    // Distributor-specific functions
    getDistributorPaymentsDue,
    addDistributorCreditPurchase
  };

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};