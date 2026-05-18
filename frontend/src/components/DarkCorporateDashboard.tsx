import React, { useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
// No mock data imports - clean slate for real pharmacy
import type { DashboardStats, PayableBalance, Transaction } from '../types';
import { useTransactions } from '../contexts/TransactionContext';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useRoleBasedData } from '../hooks/useRoleBasedData';
import { useSidebar } from '../contexts/SidebarContext';
import { useConfiguration } from '../contexts/ConfigurationContext';
import type { TransactionCategory } from '../types';
// import { useToast } from '../contexts/ToastContext';
import TransactionForm from './TransactionForm';
import EditTransactionForm from './EditTransactionForm';
import StakeholderManagement from './StakeholderManagement';
import SimpleSettlementWizard from './SimpleSettlementWizard';
import AccountStatement from './AccountStatement';
import PaymentProcessor from './PaymentProcessor';
import TransactionHistory from './TransactionHistory';
import BusinessAccountStatement from './BusinessAccountStatement';
import DoctorAccountStatement from './DoctorAccountStatement';
import DistributorAccountStatement from './DistributorAccountStatement';
import DistributorPaymentEstimation from './DistributorPaymentEstimation';
import DataImport from './DataImport';
import DepartmentManagement from './DepartmentManagement';
import PatientManagement from './PatientManagement';
import ConfigurationManagement from './ConfigurationManagement';
import DailyCreditDebitReport from './DailyCreditDebitReport';
import DoctorCreditDebitReport from './DoctorCreditDebitReport';
import DistributorCreditDebitReport from './DistributorCreditDebitReport';
import WeeklyBusinessInsights from './WeeklyBusinessInsights';
import UserProfileBanner from './UserProfileBanner';
import ProfileSettings from './ProfileSettings';
import UserManual from './UserManual';
import AdminPortal from './AdminPortal';
import NotificationSettings from './NotificationSettings';
import DatabaseManagement from './DatabaseManagement';
import { Sidebar, TopBar } from './layout';
import NotificationPanel from './NotificationPanel';
import MetricCard from './dashboard/MetricCard';
import DataTable from './dashboard/DataTable';
import ChartCard from './dashboard/ChartCard';
import DateFilter from './dashboard/DateFilter';
import DistributorPaymentsDue from './dashboard/DistributorPaymentsDue';
import SettlementAlert from './dashboard/SettlementAlert';
import { darkTooltipStyle } from './dashboard/chartStyles';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  CurrencyDollarIcon, BanknotesIcon, ChartBarIcon, UserGroupIcon,
  BuildingOfficeIcon, UsersIcon, TruckIcon, CreditCardIcon,
  DocumentArrowUpIcon, ChartPieIcon, ArrowUpIcon, ArrowDownIcon,
  ClockIcon, CalendarIcon, BellIcon, Cog6ToothIcon, HomeIcon,
  DocumentTextIcon, UserIcon, ArrowTrendingUpIcon, EyeIcon,
  Squares2X2Icon, MagnifyingGlassIcon, FunnelIcon,
  Bars3Icon, XMarkIcon, BookOpenIcon,
  ShieldCheckIcon, PresentationChartLineIcon, CircleStackIcon as DatabaseIcon
} from '@heroicons/react/24/outline';
import { SYSTEM_CONFIG, getDefaultDateRange } from '../constants/systemConfig';
import { PHARMACY_REVENUE_CATEGORIES, PHARMACY_EXPENSE_CATEGORIES } from '../constants/transactionTypes';
import clsx from 'clsx';

const DarkCorporateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'credit_debit_report' | 'doctor_credit_debit_report' | 'distributor_credit_debit_report' | 'weekly_insights' | 'stakeholders' | 'patients' | 'statements' | 'business_statement' | 'doctor_statement' | 'distributor_statement' | 'payment_estimation' | 'data_import' | 'configuration' | 'user_manual' | 'admin_portal' | 'notifications' | 'database_management'>('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [showEditTransactionForm, setShowEditTransactionForm] = useState(false);
  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<Transaction | null>(null);
  const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);
  const [showSimpleSettlementWizard, setShowSimpleSettlementWizard] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [defaultTransactionCategory, setDefaultTransactionCategory] = useState<TransactionCategory | undefined>(undefined);

  // Sidebar context
  const { isCollapsed, openMobile } = useSidebar();

  // Configuration context for shortcuts
  const { transactionShortcuts, getShortcutByKeys } = useConfiguration();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId as any);
  };

  // Global keyboard shortcut handler for quick transactions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Build shortcut string from event
      const parts: string[] = [];
      if (event.ctrlKey || event.metaKey) parts.push('Ctrl');
      if (event.shiftKey) parts.push('Shift');
      if (event.altKey) parts.push('Alt');

      // Add the key (ignore modifier keys themselves)
      if (!['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
        parts.push(event.key.toUpperCase());
      }

      const shortcutString = parts.join('+');

      // Check if this matches any configured shortcut
      const matchedShortcut = getShortcutByKeys(shortcutString);

      if (matchedShortcut) {
        event.preventDefault();
        setDefaultTransactionCategory(matchedShortcut.category);
        setShowTransactionForm(true);
      }

      // Also handle Ctrl+Enter for generic transaction form (backwards compatibility)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !matchedShortcut) {
        event.preventDefault();
        setDefaultTransactionCategory(undefined);
        setShowTransactionForm(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [transactionShortcuts, getShortcutByKeys]);

  // Reset default category when form closes
  const handleTransactionFormClose = () => {
    setShowTransactionForm(false);
    setDefaultTransactionCategory(undefined);
  };

  const {
    transactions,
    addTransaction,
    updateTransaction,
    getDashboardStats,
    getDistributorPaymentsDue,
    getPeriodFilteredStats,
    getLastSettlementPoint,
    getDefaultDateRange,
    getCashPosition
  } = useTransactions();
  
  const { doctors, businessPartners, employees, distributors, patients } = useStakeholders();
  
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  
  // Use role-based filtered data
  const { 
    filteredTransactions, 
    filteredDashboardStats, 
    canAccessFeature, 
    getAvailableTabs,
    isStakeholderUser 
  } = useRoleBasedData();

  // const { showSuccess } = useToast();
  
  // Define navigation items based on user role
  const getNavigationItems = () => {
    const allItems = {
      primary: [
        { id: 'dashboard', label: 'Dashboard', icon: Squares2X2Icon, category: 'dashboard', tooltip: 'Comprehensive business dashboard and analytics' },
        { id: 'reports', label: 'Business Report', icon: DocumentTextIcon, category: 'reports', tooltip: 'Daily business analytics and financial insights' },
      ],
      management: [
        { id: 'stakeholders', label: 'Stakeholders', icon: UsersIcon, category: 'management', tooltip: 'Manage doctors, partners, employees, and distributors' },
        { id: 'patients', label: 'Patients', icon: UserIcon, category: 'management', tooltip: 'Patient management and credit tracking' },
        { id: 'payment_estimation', label: 'Payment Estimation', icon: CurrencyDollarIcon, category: 'management', tooltip: 'Estimate distributor payments based on weekly sales' },
        { id: 'weekly_insights', label: 'Weekly Insights', icon: PresentationChartLineIcon, category: 'management', tooltip: 'Comprehensive weekly business analysis and insights' },
        ...(user?.role === 'super_admin' ? [{ id: 'data_import', label: 'Data Import', icon: DocumentArrowUpIcon, category: 'management', tooltip: 'Import transaction data from Excel/CSV files' }] : []),
      ],
      statements: [
        { id: 'statements', label: 'Account Statement', icon: CreditCardIcon, category: 'statements', tooltip: 'View individual account statements' },
        { id: 'credit_debit_report', label: 'Pharmacy Credit-Debit', icon: ChartBarIcon, category: 'statements', tooltip: 'Daily pharmacy credit-debit breakdown with PDF export' },
        { id: 'doctor_credit_debit_report', label: 'Doctor Credit-Debit', icon: UserGroupIcon, category: 'statements', tooltip: 'Daily doctor earnings and payments report' },
        { id: 'distributor_credit_debit_report', label: 'Distributor Credit-Debit', icon: TruckIcon, category: 'statements', tooltip: 'Daily distributor credit purchases and payments report' },
        { id: 'business_statement', label: 'Business Statement', icon: BanknotesIcon, category: 'statements', tooltip: 'Comprehensive business partnership statement' },
        { id: 'doctor_statement', label: 'Doctor Statement', icon: ChartBarIcon, category: 'statements', tooltip: 'Doctor commission and consultation statements' },
        { id: 'distributor_statement', label: 'Distributor Statement', icon: TruckIcon, category: 'statements', tooltip: 'Distributor payment and credit statements' },
      ],
      system: [
        { id: 'configuration', label: 'System Settings', icon: Cog6ToothIcon, category: 'system', tooltip: 'Configure system settings and preferences' },
        { id: 'admin_portal', label: 'Admin Portal', icon: ShieldCheckIcon, category: 'system', tooltip: 'User management and administration' },
        ...(user?.role === 'super_admin' ? [
          { id: 'database_management', label: 'Database Backup', icon: DatabaseIcon, category: 'system', tooltip: 'Backup and restore database' },
          { id: 'notifications', label: 'Notifications', icon: BellIcon, category: 'system', tooltip: 'Configure email, SMS, and WhatsApp notifications' },
          { id: 'user_manual', label: 'User Manual', icon: BookOpenIcon, category: 'system', tooltip: 'Comprehensive user guide and help documentation' }
        ] : []),
      ]
    };

    if (!isStakeholderUser) {
      // Non-stakeholder users (admin, manager, operator)
      if (user?.role === 'operator') {
        // Operators don't see system settings
        return {
          ...allItems,
          system: [] // Hide system settings for operators
        };
      }
      return allItems; // Admin and managers see everything
    }

    // Filter based on stakeholder user role
    switch (user?.role) {
      case 'doctor':
        return {
          primary: [allItems.primary[0]], // Dashboard only
          management: [],
          statements: [allItems.statements[0], allItems.statements[2], allItems.statements[5]], // Account, Doctor Credit-Debit & Doctor statements
          system: []
        };

      case 'partner':
        return {
          primary: allItems.primary, // Dashboard & Business Report
          management: [],
          statements: [allItems.statements[0], allItems.statements[1], allItems.statements[4]], // Account, Pharmacy Credit-Debit & Business statements
          system: []
        };

      case 'distributor':
        return {
          primary: [allItems.primary[0]], // Dashboard only
          management: [],
          statements: [allItems.statements[0], allItems.statements[3], allItems.statements[6]], // Account, Distributor Credit-Debit & Distributor statements
          system: []
        };

      default:
        return {
          primary: [allItems.primary[0]],
          management: [],
          statements: [allItems.statements[0]],
          system: []
        };
    }
  };

  const navigationItems = getNavigationItems();
  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  // Report filter state - initialize with Settlement Point date range or fallback
  const [reportFilters, setReportFilters] = useState(() => {
    const defaultRange = getDefaultDateRange();
    return {
      dateFrom: defaultRange.from,
      dateTo: defaultRange.to,
      category: 'all' as const,
      stakeholderType: 'all' as const,
      stakeholderId: '',
      amountMin: '',
      amountMax: '',
      searchTerm: ''
    };
  });
  
  // Update filters when Settlement Points change
  useEffect(() => {
    const lastSettlement = getLastSettlementPoint();
    if (lastSettlement) {
      const defaultRange = getDefaultDateRange();
      setReportFilters(prev => ({
        ...prev,
        dateFrom: defaultRange.from,
        dateTo: defaultRange.to
      }));
      setSelectedPeriod('settlement');
    }
  }, [transactions, getLastSettlementPoint, getDefaultDateRange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter to open Add Transaction form
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        setShowTransactionForm(true);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Get period-filtered stats based on selected date range
  const fromDate = new Date(dateRange.from);
  const toDate = new Date(dateRange.to);
  const periodStats = getPeriodFilteredStats(fromDate, toDate);
  
  // Get all-time stats for settlement decisions and payables
  const allTimeStats = filteredDashboardStats;
  
  // Calculate previous period stats for percentage comparison
  const calculatePreviousPeriodStats = () => {
    const currentFromDate = new Date(dateRange.from);
    const currentToDate = new Date(dateRange.to);
    
    // Calculate period duration
    const periodDuration = currentToDate.getTime() - currentFromDate.getTime();
    
    // Calculate previous period dates
    const previousToDate = new Date(currentFromDate.getTime() - 1); // Day before current period starts
    const previousFromDate = new Date(previousToDate.getTime() - periodDuration);
    
    return getPeriodFilteredStats(previousFromDate, previousToDate);
  };
  
  const previousPeriodStats = calculatePreviousPeriodStats();
  
  // Function to calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): string => {
    if (previous === 0) {
      return current > 0 ? '+100%' : '0%';
    }
    
    const change = ((current - previous) / previous) * 100;
    
    if (change === 0) return '0%';
    if (change > 0) return `+${change.toFixed(1)}%`;
    return `${change.toFixed(1)}%`;
  };
  
  // Merge with period-filtered data for dashboard display
  const stats: DashboardStats = {
    ...allTimeStats,
    // Override with period-filtered data for dashboard metrics
    todayRevenue: periodStats.totalRevenue, // Using period revenue as "current period revenue"
    totalExpenses: periodStats.totalExpenses,
    cashPosition: periodStats.cashPosition,
    pharmacyRevenue: periodStats.pharmacyRevenue,
    todayPharmacyRevenue: periodStats.pharmacyRevenue,
    pharmacyExpenses: periodStats.pharmacyExpenses,
    pharmacyCashPosition: periodStats.pharmacyCashPosition,
    doctorRevenue: periodStats.doctorRevenue,
    todayDoctorRevenue: periodStats.doctorRevenue,
    doctorExpenses: periodStats.doctorExpenses,
    doctorCashPosition: periodStats.doctorCashPosition
  };

  // Generate chart data from real transactions
  const getRevenueChartData = () => {
    const days = 7;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayTransactions = transactions.filter(t => 
        t.date.toDateString() === date.toDateString() &&
        ['pharmacy_sale', 'consultation_fee', 'patient_payment'].includes(t.category)
      );
      
      const revenue = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        total: revenue
      });
    }
    
    return data;
  };

  const getExpenseBreakdownData = () => {
    const expenseCategories = {
      'Distributor Payments': transactions.filter(t => t.category === 'distributor_payment').reduce((sum, t) => sum + t.amount, 0),
      'Employee Payments': transactions.filter(t => t.category === 'employee_payment').reduce((sum, t) => sum + t.amount, 0),
      'Partner Payments': transactions.filter(t => t.category === 'sales_profit_distribution').reduce((sum, t) => sum + t.amount, 0),
      'Clinic Expenses': transactions.filter(t => t.category === 'clinic_expense').reduce((sum, t) => sum + t.amount, 0),
      'Doctor Expenses': transactions.filter(t => t.category === 'doctor_expense').reduce((sum, t) => sum + t.amount, 0)
    };

    return Object.entries(expenseCategories)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        fill: name === 'Distributor Payments' ? '#f59e0b' :
              name === 'Employee Payments' ? '#10b981' :
              name === 'Partner Payments' ? '#8b5cf6' :
              name === 'Clinic Expenses' ? '#ef4444' : '#3b82f6'
      }));
  };

  const getDoctorPerformanceData = () => {
    // Generate doctor performance data based on consultation transactions
    const consultationTransactions = transactions.filter(t => t.category === 'consultation_fee');
    
    const doctorStats = consultationTransactions.reduce((acc, t) => {
      if (t.stakeholderId) {
        if (!acc[t.stakeholderId]) {
          acc[t.stakeholderId] = { consultations: 0, revenue: 0 };
        }
        acc[t.stakeholderId].consultations += 1;
        acc[t.stakeholderId].revenue += t.amount;
      }
      return acc;
    }, {} as Record<string, { consultations: number; revenue: number }>);

    return Object.entries(doctorStats).slice(0, 5).map(([id, data]) => ({
      name: `Doctor ${id.slice(0, 8)}`,
      consultations: data.consultations,
      revenue: data.revenue
    }));
  };

  const getMonthlyTrendData = () => {
    const months = 6;
    const data = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      date.setDate(1);
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const revenue = monthTransactions
        .filter(t => ['pharmacy_sale', 'consultation_fee', 'patient_payment'].includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);
        
      const expenses = monthTransactions
        .filter(t => ['distributor_payment', 'employee_payment', 'clinic_expense', 'sales_profit_distribution', 'doctor_expense'].includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue,
        expenses,
        profit: revenue - expenses
      });
    }
    
    return data;
  };

  const getDoctorConsultationData = () => {
    const days = 7;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayTransactions = transactions.filter(t => 
        t.date.toDateString() === date.toDateString() &&
        t.category === 'consultation_fee'
      );
      
      const revenue = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        total: revenue
      });
    }
    
    return data;
  };

  // Cash Flow Timeline Chart Data - shows daily cash inflows vs outflows
  const getCashFlowTimelineData = () => {
    const days = 14; // Show last 2 weeks for better trend visibility
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayTransactions = transactions.filter(t => 
        t.date.toDateString() === date.toDateString()
      );
      
      // Cash Inflows (Revenue categories)
      const cashIn = dayTransactions
        .filter(t => ['pharmacy_sale', 'consultation_fee', 'patient_payment', 'distributor_credit_note'].includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);
        
      // Cash Outflows (Expense categories)
      const cashOut = dayTransactions
        .filter(t => ['distributor_payment', 'employee_payment', 'clinic_expense', 'sales_profit_distribution', 'doctor_expense', 'patient_credit_sale'].includes(t.category))
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Net Cash Flow for the day
      const netCashFlow = cashIn - cashOut;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cashIn,
        cashOut,
        netCashFlow,
        // Running balance would require more complex calculation
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    
    return data;
  };

  // Transaction Volume Chart Data - shows daily transaction counts and patterns
  const getTransactionVolumeData = () => {
    const days = 14; // Show last 2 weeks for better pattern visibility
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayTransactions = transactions.filter(t => 
        t.date.toDateString() === date.toDateString()
      );
      
      // Count transactions by category
      const revenueTransactions = dayTransactions.filter(t => 
        ['pharmacy_sale', 'consultation_fee', 'patient_payment', 'distributor_credit_note'].includes(t.category)
      ).length;
      
      const expenseTransactions = dayTransactions.filter(t => 
        ['distributor_payment', 'employee_payment', 'clinic_expense', 'sales_profit_distribution', 'doctor_expense', 'patient_credit_sale'].includes(t.category)
      ).length;
      
      const totalTransactions = dayTransactions.length;
      
      // Calculate average transaction value for the day
      const totalAmount = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      const avgTransactionValue = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenueTransactions,
        expenseTransactions,
        totalTransactions,
        avgTransactionValue,
        fullDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    
    return data;
  };

  const handleTransactionSubmit = async (data: any) => {
    try {
      await addTransaction({
        category: data.category,
        stakeholderId: data.stakeholderId,
        stakeholderType: data.stakeholderType,
        amount: parseFloat(data.amount),
        description: data.description,
        billNo: data.billNo,
        date: new Date(data.date),
        createdBy: 'Admin User'
      });
      setShowTransactionForm(false);
      alert(`Transaction Added: ${formatCurrency(parseFloat(data.amount))} transaction for ${data.description} has been recorded successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create transaction';
      alert(`Transaction Failed\n\n${message}`);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransactionForEdit(transaction);
    setShowEditTransactionForm(true);
  };

  const handleEditTransactionSubmit = async (transactionId: string, updatedData: Partial<Transaction>) => {
    try {
      await updateTransaction(transactionId, updatedData);
      setShowEditTransactionForm(false);
      setSelectedTransactionForEdit(null);
      
      // Show success message
      alert('Transaction Updated: The transaction has been updated successfully.');
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction. Please try again.');
    }
  };

  const handlePaymentProcessed = (batch: any) => {
    console.log('Payment batch processed:', batch);
    // In a real app, this would update the dashboard stats and refresh payables
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    let fromDate;

    switch (period) {
      case '7days':
        fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        fromDate = new Date(today.getTime() - SYSTEM_CONFIG.DEFAULT_TRANSACTION_HISTORY_DAYS * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        fromDate = new Date(today.getTime() - SYSTEM_CONFIG.DEFAULT_BUSINESS_STATEMENT_DAYS * 24 * 60 * 60 * 1000);
        break;
      case '6months':
        fromDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        fromDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setDateRange({
      from: fromDate.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
  };

  const handleReportPeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    let fromDate;

    switch (period) {
      case 'settlement':
        // Use date range from last settlement point
        const defaultRange = getDefaultDateRange();
        setReportFilters(prev => ({
          ...prev,
          dateFrom: defaultRange.from,
          dateTo: defaultRange.to
        }));
        return; // Exit early since we've already set the filters
      case '7days':
        fromDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90days':
        fromDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6months':
        fromDate = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        fromDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        fromDate = new Date(2020, 0, 1); // Start from a very early date to show all data
        break;
      default:
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setReportFilters(prev => ({
      ...prev,
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    }));
  };






  // Unified Dashboard combining Pharmacy and Doctor metrics
  const renderUnifiedDashboard = () => {
    // Calculate business summary for unified dashboard
    const businessSummary = {
      totalRevenue: stats.pharmacyRevenue + stats.doctorRevenue,
      pharmacyRevenue: stats.pharmacyRevenue,
      doctorRevenue: stats.doctorRevenue,
      totalExpenses: stats.totalExpenses,
      pharmacyExpenses: stats.pharmacyExpenses,
      doctorExpenses: stats.doctorExpenses,
      totalCashInHand: stats.cashPosition,
      pharmacyCash: stats.pharmacyCashPosition,
      doctorCash: stats.doctorCashPosition
    };

    // Generate combined revenue chart data (pharmacy + doctor revenue)
    const getUnifiedRevenueChartData = () => {
      const days = 7;
      const data = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayTransactions = transactions.filter(t => 
          t.date.toDateString() === date.toDateString() &&
          ['pharmacy_sale', 'consultation_fee', 'patient_payment'].includes(t.category)
        );
        
        const revenue = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue
        });
      }
      
      return data;
    };

    return (
      <div className="space-y-6">
        <DateFilter selectedPeriod={selectedPeriod} dateRange={dateRange} onPeriodChange={handlePeriodChange} onDateRangeChange={setDateRange} />
        

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Today's Total Revenue"
            value={formatCurrency(stats.todayRevenue)}
            change={calculatePercentageChange(stats.todayRevenue, previousPeriodStats.totalRevenue)}
            changeType={stats.todayRevenue >= previousPeriodStats.totalRevenue ? "increase" : "decrease"}
            subtitle="Combined Pharmacy + Doctor"
            icon={CurrencyDollarIcon}
          />
          <MetricCard
            title="Today's Pharmacy Sales"
            value={formatCurrency(stats.todayPharmacyRevenue)}
            change={calculatePercentageChange(stats.todayPharmacyRevenue, previousPeriodStats.pharmacyRevenue)}
            changeType={stats.todayPharmacyRevenue >= previousPeriodStats.pharmacyRevenue ? "increase" : "decrease"}
            subtitle="Pharmacy revenue only"
            icon={BanknotesIcon}
          />
          <MetricCard
            title="Today's Doctor Revenue"
            value={formatCurrency(stats.todayDoctorRevenue)}
            change={calculatePercentageChange(stats.todayDoctorRevenue, previousPeriodStats.doctorRevenue)}
            changeType={stats.todayDoctorRevenue >= previousPeriodStats.doctorRevenue ? "increase" : "decrease"}
            subtitle="Consultation fees"
            icon={UserGroupIcon}
          />
          <MetricCard
            title="Pharmacy Profit"
            value={formatCurrency(stats.pharmacyMonthlyProfit)}
            change={calculatePercentageChange(stats.pharmacyMonthlyProfit, previousPeriodStats.pharmacyRevenue - previousPeriodStats.pharmacyExpenses)}
            changeType={stats.pharmacyMonthlyProfit >= (previousPeriodStats.pharmacyRevenue - previousPeriodStats.pharmacyExpenses) ? "increase" : "decrease"}
            subtitle="Pharmacy business profit"
            icon={ChartBarIcon}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Revenue Trend" subtitle="Combined Pharmacy + Doctor Revenue" height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getUnifiedRevenueChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={darkTooltipStyle} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          
          <ChartCard title="Monthly Performance" subtitle="Revenue vs Expenses vs Profit" height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getMonthlyTrendData()} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={darkTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[2, 2, 0, 0]} />
                <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Cash Flow Timeline Chart */}
        <div className="grid grid-cols-1 gap-4">
          <ChartCard title="Cash Flow Timeline" subtitle="Daily Cash Inflows vs Outflows (Last 2 Weeks)" height="350px">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={getCashFlowTimelineData()} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="cashInGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="cashOutGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip 
                  formatter={(value, name) => [
                    formatCurrency(value as number), 
                    name === 'cashIn' ? 'Cash Inflow' : 
                    name === 'cashOut' ? 'Cash Outflow' : 'Net Cash Flow'
                  ]} 
                  contentStyle={darkTooltipStyle}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="cashIn" stroke="#10b981" fill="url(#cashInGradient)" name="Cash Inflow" />
                <Area type="monotone" dataKey="cashOut" stroke="#ef4444" fill="url(#cashOutGradient)" name="Cash Outflow" />
                <Line type="monotone" dataKey="netCashFlow" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }} name="Net Cash Flow" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Transaction Volume Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Transaction Volume Trends" subtitle="Daily Transaction Counts (Last 2 Weeks)" height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={getTransactionVolumeData()} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'avgTransactionValue' ? formatCurrency(value as number) : value,
                    name === 'revenueTransactions' ? 'Revenue Transactions' : 
                    name === 'expenseTransactions' ? 'Expense Transactions' :
                    name === 'totalTransactions' ? 'Total Transactions' : 'Avg Transaction Value'
                  ]} 
                  contentStyle={darkTooltipStyle}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="revenueTransactions" fill="#10b981" name="Revenue Transactions" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenseTransactions" fill="#ef4444" name="Expense Transactions" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="totalTransactions" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} name="Total Transactions" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Average Transaction Value" subtitle="Daily Transaction Value Patterns" height="300px">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getTransactionVolumeData()} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="avgValueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value as number), 'Avg Transaction Value']} 
                  contentStyle={darkTooltipStyle}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area type="monotone" dataKey="avgTransactionValue" stroke="#8b5cf6" fill="url(#avgValueGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

      </div>
    );
  };

  const renderPharmacyDashboard = () => (
    <div className="space-y-5">
      <DateFilter selectedPeriod={selectedPeriod} dateRange={dateRange} onPeriodChange={handlePeriodChange} onDateRangeChange={setDateRange} />
      
      {/* Pharmacy Business Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pharmacy Sales"
          value={formatCurrency(stats.todayPharmacyRevenue)}
          change={calculatePercentageChange(stats.todayPharmacyRevenue, previousPeriodStats.pharmacyRevenue)}
          changeType={stats.todayPharmacyRevenue >= previousPeriodStats.pharmacyRevenue ? "increase" : "decrease"}
          subtitle="Today's pharmacy revenue"
          icon={CurrencyDollarIcon}
        />
        <MetricCard
          title="Total Pharmacy Revenue"
          value={formatCurrency(stats.pharmacyRevenue)}
          change={calculatePercentageChange(stats.pharmacyRevenue, allTimeStats.pharmacyRevenue - periodStats.pharmacyRevenue)}
          changeType={stats.pharmacyRevenue >= (allTimeStats.pharmacyRevenue - periodStats.pharmacyRevenue) ? "increase" : "decrease"}
          subtitle="All-time pharmacy sales"
          icon={BanknotesIcon}
        />
        <MetricCard
          title="Pharmacy Cash Position"
          value={formatCurrency(stats.pharmacyCashPosition)}
          change={calculatePercentageChange(stats.pharmacyCashPosition, previousPeriodStats.pharmacyCashPosition)}
          changeType={stats.pharmacyCashPosition >= previousPeriodStats.pharmacyCashPosition ? "increase" : "decrease"}
          subtitle="Pharmacy business funds"
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Pharmacy Monthly Profit"
          value={formatCurrency(stats.pharmacyMonthlyProfit)}
          change={calculatePercentageChange(stats.pharmacyMonthlyProfit, previousPeriodStats.pharmacyRevenue - previousPeriodStats.pharmacyExpenses)}
          changeType={stats.pharmacyMonthlyProfit >= (previousPeriodStats.pharmacyRevenue - previousPeriodStats.pharmacyExpenses) ? "increase" : "decrease"}
          subtitle="This month's pharmacy profit"
          icon={UserGroupIcon}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard 
          title="Revenue Trend" 
          subtitle="7-day performance overview"
          height="300px"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getRevenueChartData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip 
                contentStyle={darkTooltipStyle}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 1, fill: '#1f2937' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense Distribution" subtitle="Current month breakdown" height="300px">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getExpenseBreakdownData()}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {getExpenseBreakdownData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={darkTooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pharmacy Business Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <DistributorPaymentsDue />
        <DataTable
          key="distributor-credits-table"
          title="Distributor Credit Balances"
          data={stats.distributorCredits || []}
          maxRows={3}
          expandable={true}
          columns={[
            { key: 'name', label: 'Distributor' },
            { 
              key: 'creditBalance', 
              label: 'Credit Balance', 
              render: (value) => <span className="text-orange-400 font-semibold">{formatCurrency(value)}</span> 
            }
          ]}
        />
      </div>
    </div>
  );

  const renderDoctorDashboard = () => (
    <div className="space-y-5">
      <DateFilter selectedPeriod={selectedPeriod} dateRange={dateRange} onPeriodChange={handlePeriodChange} onDateRangeChange={setDateRange} />
      
      {/* Doctor Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Consultations"
          value={formatCurrency(stats.todayDoctorRevenue)}
          change={calculatePercentageChange(stats.todayDoctorRevenue, previousPeriodStats.doctorRevenue)}
          changeType={stats.todayDoctorRevenue >= previousPeriodStats.doctorRevenue ? "increase" : "decrease"}
          subtitle="Today's consultation revenue"
          icon={UserGroupIcon}
        />
        <MetricCard
          title="Total Doctor Revenue"
          value={formatCurrency(stats.doctorRevenue)}
          change={calculatePercentageChange(stats.doctorRevenue, allTimeStats.doctorRevenue - periodStats.doctorRevenue)}
          changeType={stats.doctorRevenue >= (allTimeStats.doctorRevenue - periodStats.doctorRevenue) ? "increase" : "decrease"}
          subtitle="All-time consultation fees"
          icon={CurrencyDollarIcon}
        />
        <MetricCard
          title="Doctor Payables Due"
          value={formatCurrency(stats.doctorPayables.reduce((sum, p) => sum + p.netPayable, 0))}
          change="0%"
          changeType="neutral"
          subtitle="Outstanding doctor payments"
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Active Doctors"
          value={stats.doctorPayables.length.toString()}
          change="0%"
          changeType="neutral"
          subtitle="Doctors with transactions"
          icon={UsersIcon}
        />
      </div>

      {/* Doctor Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard 
          title="Daily Consultation Revenue" 
          subtitle="7-day doctor performance"
          height="300px"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getDoctorConsultationData()}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={darkTooltipStyle} />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 1, r: 3 }}
                activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 1, fill: '#1f2937' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Doctor Performance by Type" subtitle="Consultation categories" height="300px">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getDoctorPerformanceData().map((item, index) => ({ 
                  name: item.name, 
                  value: item.revenue,
                  fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]
                }))}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {getDoctorPerformanceData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => `${value}%`}
                contentStyle={darkTooltipStyle}
              />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

    </div>
  );

  const renderCombinedAnalytics = () => (
    <div className="space-y-5">
      <DateFilter selectedPeriod={selectedPeriod} dateRange={dateRange} onPeriodChange={handlePeriodChange} onDateRangeChange={setDateRange} />
      
      <ChartCard title="Monthly Performance Comparison" subtitle="Combined Pharmacy + Doctor Revenue vs Expenses vs Profit" height="350px">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={getMonthlyTrendData()} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
            <YAxis stroke="#9ca3af" fontSize={11} />
            <Tooltip formatter={(value) => formatCurrency(value as number)} contentStyle={darkTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '10px' }} />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[2, 2, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[2, 2, 0, 0]} />
            <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );

  // Filter transactions based on report filters - simplified filtering
  const filteredReportTransactions = React.useMemo(() => {
    // Add defensive checks to prevent white screen issues
    if (!transactions || !Array.isArray(transactions)) {
      return [];
    }
    
    return transactions.filter(transaction => {
      // Defensive checks for transaction properties
      if (!transaction || !transaction.date || !transaction.description) {
        return false;
      }
      
      try {
        const transactionDate = new Date(transaction.date);
        const fromDate = new Date(reportFilters.dateFrom);
        const toDate = new Date(reportFilters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire end date

        // Check for invalid dates
        if (isNaN(transactionDate.getTime()) || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          return false;
        }

        // Date filter
        if (transactionDate < fromDate || transactionDate > toDate) return false;
        
        // Search term
        if (reportFilters.searchTerm) {
          const searchLower = reportFilters.searchTerm.toLowerCase();
          return transaction.description.toLowerCase().includes(searchLower);
        }
        
        return true;
      } catch (error) {
        console.warn('Error filtering transaction:', error, transaction);
        return false;
      }
    });
  }, [transactions, reportFilters]);


  // Get stakeholders for dropdown
  const getAllStakeholders = () => {
    const stakeholders = [
      ...doctors.map(d => ({ ...d, type: 'doctor' as const })),
      ...businessPartners.map(bp => ({ ...bp, type: 'business_partner' as const })),
      ...employees.map(e => ({ ...e, type: 'employee' as const })),
      ...distributors.map(d => ({ ...d, type: 'distributor' as const })),
      ...patients.map(p => ({ ...p, type: 'patient' as const }))
    ];
    
    if (reportFilters.stakeholderType === 'all') return stakeholders;
    return stakeholders.filter(s => s.type === reportFilters.stakeholderType as any);
  };

  const renderReports = () => {
    // Add defensive check for filtered transactions
    if (!filteredReportTransactions || !Array.isArray(filteredReportTransactions)) {
      return (
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">Loading reports data...</div>
        </div>
      );
    }

    try {
      // Calculate business performance summary using filtered transactions
      const pharmacyRevenue = filteredReportTransactions
        .filter(t => t && t.category && PHARMACY_REVENUE_CATEGORIES.includes(t.category))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Doctor transactions are independent from pharmacy settlement points
      // Use all transactions, not filtered by settlement date
      const doctorRevenue = transactions
        .filter(t => t && t.category === 'consultation_fee')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalExpenses = filteredReportTransactions
        .filter(t => t && t.category && ['distributor_payment', 'doctor_expense', 'employee_payment', 'clinic_expense', 'sales_profit_distribution', 'patient_credit_sale'].includes(t.category))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const pharmacyExpenses = filteredReportTransactions
        .filter(t => t && t.category && PHARMACY_EXPENSE_CATEGORIES.includes(t.category))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      // Doctor expenses are independent from pharmacy settlement points
      const doctorExpenses = transactions
        .filter(t => t && t.category === 'doctor_expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    // Calculate cash positions using filtered data
    const pharmacyCash = pharmacyRevenue - pharmacyExpenses;
    const doctorCash = doctorRevenue - doctorExpenses;
    const totalCashInHand = pharmacyCash + doctorCash;

    const businessSummary = {
      pharmacyRevenue,
      doctorRevenue,
      totalRevenue: pharmacyRevenue + doctorRevenue,
      totalExpenses,
      pharmacyExpenses,
      doctorExpenses,
      pharmacyProfit: pharmacyCash,
      totalCashInHand,
      pharmacyCash,
      doctorCash,
      distributorCredits: allTimeStats.distributorCredits.reduce((sum, d) => sum + d.creditBalance, 0)
    };

    // Calculate detailed pharmacy expense breakdown using filtered data
    const distributorPayments = filteredReportTransactions
      .filter(t => t.category === 'distributor_payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const salesProfitDistribution = filteredReportTransactions
      .filter(t => t.category === 'sales_profit_distribution')
      .reduce((sum, t) => sum + t.amount, 0);

    const otherPharmacyExpenses = filteredReportTransactions
      .filter(t => ['employee_payment', 'clinic_expense', 'patient_credit_sale'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);

    const exportBusinessReport = async () => {
      try {
        const { exportEnhancedBusinessReportToPDF } = await import('../utils/exportUtils');
        
        const reportData = {
          companyName: 'QB Pharmacy Management',
          reportTitle: 'Business Performance Report',
          reportPeriod: `All Time Data`,
          generatedDate: new Date().toLocaleDateString(),
          metrics: {
            totalRevenue: businessSummary.totalRevenue,
            totalExpenses: businessSummary.totalExpenses,
            netProfit: businessSummary.totalRevenue - businessSummary.totalExpenses,
            cashPosition: businessSummary.totalCashInHand,
            pharmacyRevenue: businessSummary.pharmacyRevenue,
            doctorRevenue: businessSummary.doctorRevenue
          },
          transactions: transactions.slice(0, 50) // Latest 50 transactions
        };
        
        await exportEnhancedBusinessReportToPDF(reportData);
      } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again.');
      }
    };

    return (
      <div className="space-y-6">
        {/* Settlement Alert */}
        <SettlementAlert onStartSettlement={() => setShowSimpleSettlementWizard(true)} />
        
        {/* Header with Export Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Master Business Report</h2>
            <p className="text-gray-400 text-sm">
              Comprehensive transaction analysis and business intelligence
            </p>
          </div>
          <button
            onClick={exportBusinessReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <DocumentArrowUpIcon className="h-4 w-4" />
            Export PDF Report
          </button>
        </div>

        {/* Compact Report Filters */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 mb-4">
          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Report Filters:</span>
                </div>
                
                {/* Period Dropdown */}
                <select
                  value={selectedPeriod}
                  onChange={(e) => handleReportPeriodChange(e.target.value)}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                >
                  {getLastSettlementPoint() && <option value="settlement">📍 Since Settlement</option>}
                  <option value="7days">7 Days</option>
                  <option value="30days">30 Days</option>
                  <option value="90days">3 Months</option>
                  <option value="6months">6 Months</option>
                  <option value="1year">1 Year</option>
                  <option value="all">All Time</option>
                </select>
                
                {/* Date Range */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={reportFilters.dateFrom}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={reportFilters.dateTo}
                    min={reportFilters.dateFrom}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlassIcon className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={reportFilters.searchTerm}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    placeholder="Search transactions..."
                    className="w-48 pl-7 pr-2 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>
              
              <button
                onClick={() => {
                  const defaultRange = getDefaultDateRange();
                  setReportFilters(prev => ({
                    ...prev,
                    dateFrom: defaultRange.from,
                    dateTo: defaultRange.to,
                    searchTerm: ''
                  }));
                  setSelectedPeriod('30days');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Reset
              </button>
            </div>
            
            {/* Compact Summary */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                {filteredReportTransactions.length} transactions 
                {(() => {
                  const lastSettlement = getLastSettlementPoint();
                  const defaultRange = getDefaultDateRange();
                  if (lastSettlement && reportFilters.dateFrom === defaultRange.from) {
                    return <span className="text-emerald-400 ml-1">📍 since settlement</span>;
                  }
                  return null;
                })()}
              </span>
              <span>
                {new Date(reportFilters.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                {new Date(reportFilters.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          
          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">Report Filters</span>
              </div>
              <button
                onClick={() => {
                  const defaultRange = getDefaultDateRange();
                  setReportFilters(prev => ({
                    ...prev,
                    dateFrom: defaultRange.from,
                    dateTo: defaultRange.to,
                    searchTerm: ''
                  }));
                  setSelectedPeriod('30days');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Reset
              </button>
            </div>
            
            {/* Period and Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => handleReportPeriodChange(e.target.value)}
                className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              >
                {getLastSettlementPoint() && <option value="settlement">📍 Since Settlement</option>}
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last 1 Year</option>
                <option value="all">All Time</option>
              </select>
              
              <div className="relative">
                <MagnifyingGlassIcon className="h-3 w-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={reportFilters.searchTerm}
                  onChange={(e) => setReportFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder="Search..."
                  className="w-full pl-7 pr-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            
            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={reportFilters.dateFrom}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setReportFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <input
                type="date"
                value={reportFilters.dateTo}
                min={reportFilters.dateFrom}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setReportFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
            
            {/* Mobile Summary */}
            <div className="text-xs text-gray-400 text-center">
              <span>
                {filteredReportTransactions.length} transactions
                {(() => {
                  const lastSettlement = getLastSettlementPoint();
                  const defaultRange = getDefaultDateRange();
                  if (lastSettlement && reportFilters.dateFrom === defaultRange.from) {
                    return <span className="text-emerald-400 ml-1">📍 since settlement</span>;
                  }
                  return null;
                })()}
              </span>
              <span className="block mt-1">
                {new Date(reportFilters.dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                {new Date(reportFilters.dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Business Performance Summary */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Business Performance Summary</h3>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left Side - Total Cash in Hand (spans full height) */}
            <div className="lg:w-64 xl:w-80">
              <div className="bg-gradient-to-br from-gray-750 to-gray-800 rounded-lg p-6 h-full flex flex-col justify-center border-l-4 border-green-500 border-r-2 border-r-green-500/30 shadow-lg hover:shadow-xl transition-shadow duration-200">
                <div className="text-center">
                  <div className="mb-3">
                    <p className="text-sm text-gray-300 font-semibold uppercase tracking-wider mb-1">Total Cash in Hand</p>
                    <div className="w-12 h-0.5 bg-green-500 mx-auto rounded-full"></div>
                  </div>
                  <p className="text-4xl lg:text-5xl font-bold text-green-400 mb-3 tracking-tight">
                    {formatCurrency(businessSummary.totalCashInHand)}
                  </p>
                  <p className="text-xs text-gray-400 font-medium">Combined cash position</p>
                  <div className="mt-5 pt-4 border-t border-gray-600/50">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Pharmacy:</span>
                        <span className="text-cyan-400 text-xs font-semibold">
                          {formatCurrency(businessSummary.pharmacyCash)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Doctor:</span>
                        <span className="text-orange-400 text-xs font-semibold">
                          {formatCurrency(businessSummary.doctorCash)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Grid - 6 cards in 3x2 layout */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* First Row */}
              <div className="bg-gray-750 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(businessSummary.totalRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
              </div>
              <div className="bg-gray-750 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">Pharmacy Revenue</p>
                <p className="text-2xl font-bold text-blue-400">{formatCurrency(businessSummary.pharmacyRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Pharmacy sales only</p>
              </div>
              <div className="bg-gray-750 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">Doctor Revenue</p>
                <p className="text-2xl font-bold text-purple-400">{formatCurrency(businessSummary.doctorRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Consultation fees</p>
              </div>
              
              {/* Second Row */}
              <div className="bg-gray-750 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(businessSummary.totalExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">All expenses combined</p>
              </div>
              <div className="bg-gray-750 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">Pharmacy Expenses</p>
                <p className="text-2xl font-bold text-red-300">{formatCurrency(distributorPayments + salesProfitDistribution + otherPharmacyExpenses)}</p>
                <div className="mt-2 flex justify-center">
                  <div className="grid grid-cols-3 gap-3 text-xs max-w-full">
                    <div className="text-center">
                      <div className="text-gray-500">Distributor</div>
                      <div className="text-red-400 font-medium">{formatCurrency(distributorPayments)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">Profit Dist.</div>
                      <div className="text-red-400 font-medium">{formatCurrency(salesProfitDistribution)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-500">Other</div>
                      <div className="text-red-400 font-medium">{formatCurrency(otherPharmacyExpenses)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-750 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">Doctor's Expenses</p>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(businessSummary.doctorExpenses)}</p>
                <p className="text-xs text-gray-500 mt-1">Doctor-related costs</p>
              </div>
            </div>
          </div>
        </div>


        {/* Transaction History - Uses filtered transactions from report filters */}
        <TransactionHistory 
          transactions={filteredReportTransactions}
          onEditTransaction={handleEditTransaction} 
        />

      </div>
    );
    } catch (error) {
      console.error('Error rendering reports:', error);
      return (
        <div className="p-8 text-center">
          <div className="text-red-400 mb-4">
            ⚠️ Error loading reports
          </div>
          <div className="text-gray-400 text-sm">
            Please refresh the page or contact support if the issue persists.
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        navigationItems={navigationItems}
        activeTab={activeTab}
        onTabClick={handleTabClick}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <TopBar
          unreadCount={unreadCount}
          onNotificationsClick={() => setShowNotifications(true)}
          onAddTransaction={() => setShowTransactionForm(true)}
          onProcessPayments={() => setShowPaymentProcessor(true)}
          onProfileSettings={() => setShowProfileSettings(true)}
        />

        <main className="flex-1 p-5 pb-20 lg:pb-5 overflow-auto">
        {/* User Profile Banner */}
        <UserProfileBanner />
        <div className="mb-5">
          <h2 className="text-xl font-bold text-white capitalize">
            {activeTab.replace('_', ' ')}
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}
            </p>
            <p className="text-gray-400 text-sm">
              Period: {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
            </p>
          </div>
        </div>

        <ErrorBoundary key={activeTab} level="section">
          {activeTab === 'dashboard' && renderUnifiedDashboard()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'credit_debit_report' && <DailyCreditDebitReport />}
          {activeTab === 'doctor_credit_debit_report' && <DoctorCreditDebitReport />}
          {activeTab === 'distributor_credit_debit_report' && <DistributorCreditDebitReport />}
          {activeTab === 'weekly_insights' && <WeeklyBusinessInsights />}
          {activeTab === 'stakeholders' && <StakeholderManagement />}
          {activeTab === 'patients' && <PatientManagement />}
          {activeTab === 'statements' && <AccountStatement />}
          {activeTab === 'business_statement' && <BusinessAccountStatement />}
          {activeTab === 'doctor_statement' && <DoctorAccountStatement />}
          {activeTab === 'distributor_statement' && <DistributorAccountStatement />}
          {activeTab === 'payment_estimation' && <DistributorPaymentEstimation />}
          {activeTab === 'data_import' && <DataImport />}
          {activeTab === 'configuration' && <ConfigurationManagement />}
          {activeTab === 'admin_portal' && <AdminPortal />}
          {activeTab === 'database_management' && <DatabaseManagement />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'user_manual' && <UserManual />}
        </ErrorBoundary>
      </main>

      <TransactionForm
        isOpen={showTransactionForm}
        onClose={handleTransactionFormClose}
        onSubmit={handleTransactionSubmit}
        defaultCategory={defaultTransactionCategory}
      />

      <EditTransactionForm
        isOpen={showEditTransactionForm}
        transaction={selectedTransactionForEdit}
        onClose={() => {
          setShowEditTransactionForm(false);
          setSelectedTransactionForEdit(null);
        }}
        onSubmit={handleEditTransactionSubmit}
      />

      <PaymentProcessor
        isOpen={showPaymentProcessor}
        onClose={() => setShowPaymentProcessor(false)}
        onProcessPayments={handlePaymentProcessed}
      />

      {/* Simple Settlement Wizard */}
      <SimpleSettlementWizard
        isOpen={showSimpleSettlementWizard}
        onClose={() => setShowSimpleSettlementWizard(false)}
        availableCash={allTimeStats.pharmacyCashPosition}
      />

      {/* Mobile Bottom Tab Bar — derived from sidebar navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-2 py-1 z-40">
        <div className="flex justify-around items-center">
          {[
            ...navigationItems.primary,
            ...navigationItems.management,
            ...navigationItems.statements,
            ...navigationItems.system,
          ].slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={clsx(
                  'flex flex-col items-center py-2 px-3 min-w-0 transition-colors rounded-md flex-1',
                  activeTab === item.id
                    ? 'text-blue-400 bg-blue-900/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                <Icon className="h-5 w-5 mb-1 flex-shrink-0" />
                <span className="text-xs font-medium truncate w-full text-center">{item.label}</span>
              </button>
            );
          })}

          {/* More (opens full sidebar menu) */}
          <button
            onClick={openMobile}
            className="flex flex-col items-center py-2 px-3 min-w-0 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors rounded-md flex-1"
          >
            <Bars3Icon className="h-5 w-5 mb-1 flex-shrink-0" />
            <span className="text-xs font-medium truncate w-full text-center">More</span>
          </button>
        </div>
      </div>

      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings
          isOpen={showProfileSettings}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
      </div>
    </div>
  );
};

export default DarkCorporateDashboard;