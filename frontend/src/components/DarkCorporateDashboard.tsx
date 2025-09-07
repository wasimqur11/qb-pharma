import React, { useState, useEffect } from 'react';
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
// import { useToast } from '../contexts/ToastContext';
import qbLogo from '../assets/qblogo.png';
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
import UserProfileBanner from './UserProfileBanner';
import ProfileSettings from './ProfileSettings';
import { 
  CurrencyDollarIcon, BanknotesIcon, ChartBarIcon, UserGroupIcon,
  BuildingOfficeIcon, UsersIcon, TruckIcon, PlusIcon, CreditCardIcon,
  DocumentArrowUpIcon, ChartPieIcon, ArrowUpIcon, ArrowDownIcon,
  ClockIcon, CalendarIcon, BellIcon, Cog6ToothIcon, HomeIcon,
  DocumentTextIcon, UserIcon, ArrowTrendingUpIcon, EyeIcon,
  Squares2X2Icon, ChevronDownIcon, MagnifyingGlassIcon, FunnelIcon,
  ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon
} from '@heroicons/react/24/outline';
import { SYSTEM_CONFIG, getDefaultDateRange } from '../constants/systemConfig';
import clsx from 'clsx';

const DarkCorporateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'stakeholders' | 'patients' | 'statements' | 'business_statement' | 'doctor_statement' | 'distributor_statement' | 'payment_estimation' | 'data_import' | 'configuration'>('dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [showEditTransactionForm, setShowEditTransactionForm] = useState(false);
  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<Transaction | null>(null);
  const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);
  const [showSimpleSettlementWizard, setShowSimpleSettlementWizard] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  
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
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  
  // Use role-based filtered data
  const { 
    filteredTransactions, 
    filteredDashboardStats, 
    canAccessFeature, 
    getAvailableTabs,
    isStakeholderUser 
  } = useRoleBasedData();

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);
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
        { id: 'data_import', label: 'Data Import', icon: DocumentArrowUpIcon, category: 'management', tooltip: 'Import transaction data from Excel/CSV files' },
      ],
      statements: [
        { id: 'statements', label: 'Account Statement', icon: CreditCardIcon, category: 'statements', tooltip: 'View individual account statements' },
        { id: 'business_statement', label: 'Business Statement', icon: BanknotesIcon, category: 'statements', tooltip: 'Comprehensive business partnership statement' },
        { id: 'doctor_statement', label: 'Doctor Statement', icon: ChartBarIcon, category: 'statements', tooltip: 'Doctor commission and consultation statements' },
        { id: 'distributor_statement', label: 'Distributor Statement', icon: TruckIcon, category: 'statements', tooltip: 'Distributor payment and credit statements' },
      ],
      system: [
        { id: 'configuration', label: 'System Settings', icon: Cog6ToothIcon, category: 'system', tooltip: 'Configure system settings and preferences' },
      ]
    };

    if (!isStakeholderUser) {
      return allItems; // Admin/operator users see everything
    }

    // Filter based on stakeholder user role
    switch (user?.role) {
      case 'doctor':
        return {
          primary: [allItems.primary[0]], // Dashboard only
          management: [],
          statements: [allItems.statements[0], allItems.statements[2]], // Account & Doctor statements
          system: []
        };

      case 'partner':
        return {
          primary: allItems.primary, // Dashboard & Business Report
          management: [],
          statements: [allItems.statements[0], allItems.statements[1]], // Account & Business statements
          system: []
        };

      case 'distributor':
        return {
          primary: [allItems.primary[0]], // Dashboard only
          management: [],
          statements: [allItems.statements[0], allItems.statements[3]], // Account & Distributor statements
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

  const formatCurrency = (amount: number) => {
    return `${SYSTEM_CONFIG.CURRENCY_SYMBOL}${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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

  const handleTransactionSubmit = (data: any) => {
    addTransaction({
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
    
    // Show success message
    alert(`Transaction Added: ${formatCurrency(parseFloat(data.amount))} transaction for ${data.description} has been recorded successfully.`);
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

  const Header: React.FC = () => (
    <div className="bg-gray-900 border-b border-gray-700">
      {/* Main Header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Brand */}
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Menu */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              title="Open Navigation Menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={qbLogo} alt="QB Pharmacy Management" className="h-10 w-10 object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-white">QB Pharmacy Management</h1>
                <p className="text-xs text-gray-400">Where Healthcare Meets Analytics</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-base font-semibold text-white">QB Pharmacy Management</h1>
              </div>
            </div>
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setShowTransactionForm(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                title="Add new financial transaction (Ctrl+Enter)"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden xl:inline">Add Transaction</span>
                <span className="xl:hidden">Add</span>
                <span className="hidden 2xl:inline text-xs text-blue-200 ml-1">(Ctrl+Enter)</span>
              </button>
              
              <button
                onClick={() => setShowPaymentProcessor(true)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                title="Process stakeholder payments"
              >
                <CreditCardIcon className="h-4 w-4" />
                <span className="hidden xl:inline">Process Payments</span>
                <span className="xl:hidden">Pay</span>
              </button>
            </div>


            {/* Search - Hidden on small screens */}
            <div className="hidden md:block relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                title="Search transactions, stakeholders, and records"
                className="pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40 lg:w-48 xl:w-56"
              />
            </div>
            
            {/* Notifications */}
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title={`View notifications and alerts${unreadCount > 0 ? ` (${unreadCount} new)` : ''}`}
            >
              <BellIcon className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* User Menu */}
            <div className="relative pl-2 border-l border-gray-600 user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 hover:bg-gray-700 rounded-md transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <div className="p-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                    <p className="text-xs text-blue-400 mt-1">{user?.role}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowProfileSettings(true);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Profile Settings
                    </button>
                    <hr className="border-gray-700 my-1" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors flex items-center gap-2"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Tabs - Hidden on mobile */}
      <div className="hidden lg:block px-4 pb-0 border-b border-gray-800">
        <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {/* Primary Navigation - Daily Operations */}
          {navigationItems.primary.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              title={item.tooltip}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
                activeTab === item.id 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-gray-800/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
          
          {/* Separator */}
          <div className="mx-2 h-6 w-px bg-gray-700"></div>
          
          {/* Management - Frequent Operations */}
          {navigationItems.management.length > 0 && (
            <>
              {/* Separator */}
              <div className="mx-2 h-6 w-px bg-gray-700"></div>
            </>
          )}
          {navigationItems.management.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              title={item.tooltip}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
                activeTab === item.id 
                  ? 'border-green-500 text-green-400 bg-green-500/10' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-gray-800/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
          
          {/* Separator */}
          <div className="mx-2 h-6 w-px bg-gray-700"></div>
          
          {/* Analysis & Statements - Periodic Review */}
          {navigationItems.statements.length > 0 && (
            <>
              {/* Separator */}
              <div className="mx-2 h-6 w-px bg-gray-700"></div>
            </>
          )}
          {navigationItems.statements.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              title={item.tooltip}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
                activeTab === item.id 
                  ? 'border-purple-500 text-purple-400 bg-purple-500/10' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-gray-800/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
          
          {/* Separator */}
          <div className="mx-2 h-6 w-px bg-gray-700"></div>
          
          {/* Configuration - Administrative */}
          {navigationItems.system.length > 0 && (
            <>
              {/* Separator */}
              <div className="mx-2 h-6 w-px bg-gray-700"></div>
            </>
          )}
          {navigationItems.system.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              title={item.tooltip}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap',
                activeTab === item.id 
                  ? 'border-orange-500 text-orange-400 bg-orange-500/10' 
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600 hover:bg-gray-800/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );

  const MetricCard: React.FC<{
    title: string;
    value: string;
    change: string;
    changeType: 'increase' | 'decrease' | 'neutral';
    subtitle?: string;
    icon: React.ElementType;
  }> = ({ title, value, change, changeType, subtitle, icon: Icon }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-gray-400" />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={clsx(
          'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
          changeType === 'increase' && 'bg-green-900 text-green-300',
          changeType === 'decrease' && 'bg-red-900 text-red-300',
          changeType === 'neutral' && 'bg-gray-700 text-gray-300'
        )}>
          {changeType === 'increase' && <ArrowUpIcon className="h-3 w-3" />}
          {changeType === 'decrease' && <ArrowDownIcon className="h-3 w-3" />}
          {change}
        </div>
      </div>
    </div>
  );

  const DataTable: React.FC<{
    title: string;
    data: any[];
    columns: { key: string; label: string; render?: (value: any) => React.ReactNode }[];
    maxRows?: number;
    expandable?: boolean;
  }> = ({ title, data, columns, maxRows = 5, expandable = true }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const displayData = isExpanded ? data : data.slice(0, maxRows);
    
    
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg h-fit">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          {expandable && data.length > maxRows && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              {isExpanded ? 'Show Less' : `Show All (${data.length})`}
            </button>
          )}
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {displayData.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {columns[0]?.render ? columns[0].render(row[columns[0].key]) : row[columns[0].key]}
                  </p>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-sm font-semibold text-gray-300">
                    {columns[1]?.render ? columns[1].render(row[columns[1].key]) : row[columns[1].key]}
                  </p>
                </div>
              </div>
            ))}
            {expandable && !isExpanded && data.length > maxRows && (
              <div className="pt-2 text-center">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 underline transition-colors hover:bg-gray-700 px-2 py-1 rounded"
                >
                  +{data.length - maxRows} more items - Click to view all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ChartCard: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    height?: string;
  }> = ({ title, subtitle, children, actions, height = "320px" }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden" style={{ height }}>
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>}
        </div>
        {actions && <div className="ml-3 flex-shrink-0">{actions}</div>}
      </div>
      <div className="p-4 h-full" style={{ height: `calc(${height} - 60px)` }}>
        {children}
      </div>
    </div>
  );


  const DistributorPaymentsDue: React.FC = () => {
    const paymentsDue = getDistributorPaymentsDue();
    
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg h-fit">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
          <BellIcon className="h-4 w-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-white">Distributor Payments Due</h3>
          {paymentsDue.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {paymentsDue.length}
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {paymentsDue.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">No payments due today</p>
            ) : (
              paymentsDue.slice(0, 4).map((payment, idx) => {
                const isOverdue = new Date(payment.dueDate) < new Date();
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white truncate">{payment.name}</p>
                      <span className={`text-sm font-bold ${isOverdue ? 'text-red-400' : 'text-orange-400'}`}>
                        {formatCurrency(payment.amountDue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                      {isOverdue && <span className="text-red-400 font-medium">OVERDUE</span>}
                    </div>
                  </div>
                );
              })
            )}
            {paymentsDue.length > 4 && (
              <div className="pt-2 text-center border-t border-gray-700">
                <p className="text-xs text-gray-400">+{paymentsDue.length - 4} more payments due</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const darkTooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#ffffff'
  };

  const SettlementAlert: React.FC = () => {
    // Use all-time stats instead of filtered period data for settlement decisions
    const allTimeStats = filteredDashboardStats;
    const pharmacyCash = allTimeStats.pharmacyCashPosition;
    const hasBusinessPartners = businessPartners.length > 0;
    
    // Check if there are actual partner dues to pay
    const partnerPayables = allTimeStats.businessPartnerPayables;
    const totalPartnerDues = partnerPayables.reduce((sum, p) => sum + p.netPayable, 0);
    
    // Show alert only when:
    // 1. There's pharmacy cash available, AND
    // 2. There are business partners, AND  
    // 3. There are actual partner dues to pay
    if (pharmacyCash <= 0 || !hasBusinessPartners || totalPartnerDues <= 0) return null;
    
    return (
      <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/30 border border-emerald-600/50 rounded-lg p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-pulse">💰</div>
            <div>
              <h3 className="font-semibold text-emerald-400 text-xl">Settlement Opportunity Available</h3>
              <p className="text-gray-300 mb-2">
                Partner dues: <span className="font-mono text-emerald-400">{formatCurrency(totalPartnerDues)}</span> | Available cash: <span className="font-mono text-emerald-400">{formatCurrency(pharmacyCash)}</span>
              </p>
              <p className="text-sm text-emerald-300">
                Pay partner dues, track equity adjustments, and create a Settlement Point
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowSimpleSettlementWizard(true)}
              className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-transform text-lg"
            >
              🎯 Start Settlement
            </button>
            <p className="text-xs text-gray-400 text-center">
              {businessPartners.length} partner{businessPartners.length !== 1 ? 's' : ''} ready
            </p>
          </div>
        </div>
      </div>
    );
  };


  const DateFilter: React.FC = () => (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 mb-4">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Period:</span>
          </div>
          
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          >
            <option value="7days">7 Days</option>
            <option value="30days">30 Days</option>
            <option value="90days">90 Days</option>
            <option value="6months">6 Months</option>
            <option value="1year">1 Year</option>
          </select>
          
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.from}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.to}
              min={dateRange.from}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-400">
          {new Date(dateRange.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
          {new Date(dateRange.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300">Filter Period</span>
          </div>
          <div className="text-xs text-gray-400">
            {new Date(dateRange.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
            {new Date(dateRange.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last 1 Year</option>
          </select>
          
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.from}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <input
              type="date"
              value={dateRange.to}
              min={dateRange.from}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

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
        <DateFilter />
        

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
      <DateFilter />
      
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
      <DateFilter />
      
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
      <DateFilter />
      
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
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const fromDate = new Date(reportFilters.dateFrom);
      const toDate = new Date(reportFilters.dateTo);
      
      // Date filter
      if (transactionDate < fromDate || transactionDate > toDate) return false;
      
      // Search term
      if (reportFilters.searchTerm) {
        const searchLower = reportFilters.searchTerm.toLowerCase();
        return transaction.description.toLowerCase().includes(searchLower);
      }
      
      return true;
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
    // Calculate business performance summary using filtered transactions
    const pharmacyRevenue = filteredReportTransactions
      .filter(t => ['pharmacy_sale', 'patient_payment', 'distributor_credit_note'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const doctorRevenue = filteredReportTransactions
      .filter(t => t.category === 'consultation_fee')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredReportTransactions
      .filter(t => ['distributor_payment', 'doctor_expense', 'employee_payment', 'clinic_expense', 'sales_profit_distribution', 'patient_credit_sale'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const pharmacyExpenses = filteredReportTransactions
      .filter(t => ['distributor_payment', 'employee_payment', 'clinic_expense', 'sales_profit_distribution', 'patient_credit_sale'].includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const doctorExpenses = filteredReportTransactions
      .filter(t => t.category === 'doctor_expense')
      .reduce((sum, t) => sum + t.amount, 0);

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
        <SettlementAlert />
        
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
  };

  // Mobile Menu Drawer Component
  const MobileMenuDrawer: React.FC = () => (
    <>
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)} 
          />
          
          {/* Drawer */}
          <div className="fixed left-0 top-0 h-full w-80 bg-gray-900 shadow-xl border-r border-gray-700 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <img src={qbLogo} alt="QB Pharmacy" className="h-8 w-8 object-contain" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">QB Pharmacy</h2>
                    <p className="text-xs text-gray-400">Navigation Menu</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-gray-700 bg-gray-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.role?.replace('_', ' ').toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Primary */}
              {navigationItems.primary.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Dashboard
                  </h3>
                  <div className="space-y-1">
                    {navigationItems.primary.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                          activeTab === item.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Management */}
              {navigationItems.management.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Management
                  </h3>
                  <div className="space-y-1">
                    {navigationItems.management.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                          activeTab === item.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Statements */}
              {navigationItems.statements.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Statements & Reports
                  </h3>
                  <div className="space-y-1">
                    {navigationItems.statements.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                          activeTab === item.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* System */}
              {navigationItems.system.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    System Settings
                  </h3>
                  <div className="space-y-1">
                    {navigationItems.system.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setMobileMenuOpen(false);
                        }}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                          activeTab === item.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700 bg-gray-900">
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors text-sm font-medium"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <MobileMenuDrawer />
      
      <main className="p-5 max-w-7xl mx-auto pb-20 lg:pb-5">
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

        {activeTab === 'dashboard' && renderUnifiedDashboard()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'stakeholders' && <StakeholderManagement />}
        {activeTab === 'patients' && <PatientManagement />}
        {activeTab === 'statements' && <AccountStatement />}
        {activeTab === 'business_statement' && <BusinessAccountStatement />}
        {activeTab === 'doctor_statement' && <DoctorAccountStatement />}
        {activeTab === 'distributor_statement' && <DistributorAccountStatement />}
        {activeTab === 'payment_estimation' && <DistributorPaymentEstimation />}
        {activeTab === 'data_import' && <DataImport />}
        {activeTab === 'configuration' && <ConfigurationManagement />}
      </main>

      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSubmit={handleTransactionSubmit}
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

      {/* Mobile Bottom Tab Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-2 py-1 z-40">
        <div className="flex justify-around items-center">
          {/* Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={clsx(
              'flex flex-col items-center py-2 px-3 min-w-0 transition-colors rounded-md',
              activeTab === 'dashboard'
                ? 'text-blue-400 bg-blue-900/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Squares2X2Icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium truncate">Dashboard</span>
          </button>

          {/* Add Transaction */}
          <button
            onClick={() => setShowTransactionForm(true)}
            className="flex flex-col items-center py-2 px-3 min-w-0 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors rounded-md"
          >
            <PlusIcon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium truncate">Add</span>
          </button>

          {/* Reports */}
          <button
            onClick={() => setActiveTab('reports')}
            className={clsx(
              'flex flex-col items-center py-2 px-3 min-w-0 transition-colors rounded-md',
              activeTab === 'reports'
                ? 'text-blue-400 bg-blue-900/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <DocumentTextIcon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium truncate">Reports</span>
          </button>

          {/* Process Payments */}
          <button
            onClick={() => setShowPaymentProcessor(true)}
            className="flex flex-col items-center py-2 px-3 min-w-0 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors rounded-md"
          >
            <CreditCardIcon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium truncate">Pay</span>
          </button>

          {/* More (opens hamburger menu) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center py-2 px-3 min-w-0 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors rounded-md"
          >
            <Bars3Icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium truncate">More</span>
          </button>
        </div>
      </div>

      {/* Add bottom padding to main content on mobile */}
      <div className="lg:hidden h-16"></div>

      {/* Notification Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 pt-20 px-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <BellIcon className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-96">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No notifications</p>
                  <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-750 transition-colors ${
                        !notification.isRead ? 'bg-blue-900/20 border-l-2 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-white' : 'text-gray-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                            title="Remove notification"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <ProfileSettings
          isOpen={showProfileSettings}
          onClose={() => setShowProfileSettings(false)}
        />
      )}
    </div>
  );
};

export default DarkCorporateDashboard;