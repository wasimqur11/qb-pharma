import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTransactions } from '../contexts/TransactionContext';
import type { Transaction, DashboardStats, PayableBalance } from '../types';

export const useRoleBasedData = () => {
  const { user, getCurrentUserStakeholder, isStakeholderUser } = useAuth();
  const { transactions, getDashboardStats } = useTransactions();

  // Filter transactions based on user role
  const filteredTransactions = useMemo(() => {
    if (!user || !isStakeholderUser()) {
      // Admin and operator users see all transactions
      return transactions;
    }

    const stakeholderInfo = getCurrentUserStakeholder();
    if (!stakeholderInfo) return [];

    // Filter transactions based on stakeholder type and ID
    return transactions.filter(transaction => {
      switch (user.role) {
        case 'doctor':
          return (
            transaction.stakeholderType === 'doctor' && 
            transaction.stakeholderId === stakeholderInfo.stakeholderId
          ) || transaction.category === 'consultation_fee';

        case 'partner':
          return (
            transaction.stakeholderType === 'business_partner' && 
            transaction.stakeholderId === stakeholderInfo.stakeholderId
          ) || transaction.category === 'sales_profit_distribution';

        case 'distributor':
          return (
            transaction.stakeholderType === 'distributor' && 
            transaction.stakeholderId === stakeholderInfo.stakeholderId
          ) || [
            'distributor_payment',
            'distributor_credit_purchase', 
            'distributor_credit_note'
          ].includes(transaction.category);

        default:
          return false;
      }
    });
  }, [transactions, user, isStakeholderUser, getCurrentUserStakeholder]);

  // Filter dashboard stats based on user role
  const filteredDashboardStats = useMemo(() => {
    const allStats = getDashboardStats();
    
    if (!user || !isStakeholderUser()) {
      // Admin and operator users see all stats
      return allStats;
    }

    const stakeholderInfo = getCurrentUserStakeholder();
    if (!stakeholderInfo) {
      // Return empty stats for stakeholder users without linking
      return {
        ...allStats,
        todayRevenue: 0,
        totalExpenses: 0,
        cashPosition: 0,
        monthlyProfit: 0,
        pharmacyRevenue: 0,
        todayPharmacyRevenue: 0,
        pharmacyExpenses: 0,
        pharmacyCashPosition: 0,
        pharmacyMonthlyProfit: 0,
        doctorRevenue: 0,
        todayDoctorRevenue: 0,
        doctorExpenses: 0,
        doctorCashPosition: 0,
        doctorPayables: [],
        businessPartnerPayables: [],
        employeeSalaryDue: [],
        distributorCredits: []
      };
    }

    // Filter stats based on role
    switch (user.role) {
      case 'doctor':
        // Doctor sees only their consultation revenue and commission payables
        const doctorPayables = allStats.doctorPayables.filter(
          payable => payable.stakeholderId === stakeholderInfo.stakeholderId
        );
        const doctorRevenue = doctorPayables.reduce((sum, p) => sum + p.totalEarned, 0);
        
        return {
          ...allStats,
          todayRevenue: 0, // Calculate from filtered transactions
          totalExpenses: 0,
          cashPosition: doctorPayables.reduce((sum, p) => sum + p.netPayable, 0),
          monthlyProfit: doctorRevenue,
          pharmacyRevenue: 0,
          todayPharmacyRevenue: 0,
          pharmacyExpenses: 0,
          pharmacyCashPosition: 0,
          pharmacyMonthlyProfit: 0,
          doctorRevenue,
          todayDoctorRevenue: 0,
          doctorExpenses: 0,
          doctorCashPosition: doctorPayables.reduce((sum, p) => sum + p.netPayable, 0),
          doctorPayables,
          businessPartnerPayables: [],
          employeeSalaryDue: [],
          distributorCredits: []
        };

      case 'partner':
        // Partner sees only their profit share and payables
        const partnerPayables = allStats.businessPartnerPayables.filter(
          payable => payable.stakeholderId === stakeholderInfo.stakeholderId
        );
        const partnerRevenue = partnerPayables.reduce((sum, p) => sum + p.totalEarned, 0);
        
        return {
          ...allStats,
          todayRevenue: 0,
          totalExpenses: 0,
          cashPosition: partnerPayables.reduce((sum, p) => sum + p.netPayable, 0),
          monthlyProfit: partnerRevenue,
          pharmacyRevenue: partnerRevenue,
          todayPharmacyRevenue: 0,
          pharmacyExpenses: 0,
          pharmacyCashPosition: partnerPayables.reduce((sum, p) => sum + p.netPayable, 0),
          pharmacyMonthlyProfit: partnerRevenue,
          doctorRevenue: 0,
          todayDoctorRevenue: 0,
          doctorExpenses: 0,
          doctorCashPosition: 0,
          doctorPayables: [],
          businessPartnerPayables: partnerPayables,
          employeeSalaryDue: [],
          distributorCredits: []
        };

      case 'distributor':
        // Distributor sees only their credit balance and payment info
        const distributorCredit = allStats.distributorCredits.filter(
          credit => credit.id === stakeholderInfo.stakeholderId
        );
        const creditBalance = distributorCredit.reduce((sum, c) => sum + c.creditBalance, 0);
        
        return {
          ...allStats,
          todayRevenue: 0,
          totalExpenses: 0,
          cashPosition: -creditBalance, // Negative because it's money owed to them
          monthlyProfit: 0,
          pharmacyRevenue: 0,
          todayPharmacyRevenue: 0,
          pharmacyExpenses: 0,
          pharmacyCashPosition: 0,
          pharmacyMonthlyProfit: 0,
          doctorRevenue: 0,
          todayDoctorRevenue: 0,
          doctorExpenses: 0,
          doctorCashPosition: 0,
          doctorPayables: [],
          businessPartnerPayables: [],
          employeeSalaryDue: [],
          distributorCredits: distributorCredit
        };

      default:
        return allStats;
    }
  }, [getDashboardStats, user, isStakeholderUser, getCurrentUserStakeholder]);

  // Check if user can access specific features
  const canAccessFeature = (feature: string): boolean => {
    if (!user || !isStakeholderUser()) return true;

    const restrictedFeatures = {
      'stakeholder_management': false,
      'user_management': false,
      'system_settings': false,
      'data_import': false,
      'settlements': user.role === 'partner', // Only partners can see settlements
      'all_reports': false,
      'transaction_creation': user.role === 'operator' // Only operators and above can create transactions
    };

    return restrictedFeatures[feature] !== false;
  };

  // Get available navigation tabs for current user
  const getAvailableTabs = (): string[] => {
    if (!user) return [];

    const allTabs = [
      'dashboard',
      'transactions', 
      'business_report',
      'stakeholder_management',
      'payment_processor',
      'account_statements',
      'settlement_management',
      'data_import',
      'system_settings'
    ];

    if (!isStakeholderUser()) {
      return allTabs; // Admin and operator see all tabs
    }

    // Stakeholder users see limited tabs
    const baseTabs = ['dashboard', 'transactions'];
    
    switch (user.role) {
      case 'doctor':
        return [...baseTabs, 'account_statements'];
      case 'partner':  
        return [...baseTabs, 'business_report', 'account_statements', 'settlement_management'];
      case 'distributor':
        return [...baseTabs, 'account_statements'];
      default:
        return baseTabs;
    }
  };

  return {
    filteredTransactions,
    filteredDashboardStats,
    canAccessFeature,
    getAvailableTabs,
    isStakeholderUser: isStakeholderUser(),
    stakeholderInfo: getCurrentUserStakeholder()
  };
};