import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
// No mock data imports - clean slate for real pharmacy
import type { DashboardStats, PayableBalance, Transaction } from '../types';
import { useTransactions } from '../contexts/TransactionContext';
import qbLogo from '../assets/qblogo.png';
import TransactionForm from './TransactionForm';
import StakeholderManagement from './StakeholderManagement';
import AccountStatement from './AccountStatement';
import PaymentProcessor from './PaymentProcessor';
import TransactionHistory from './TransactionHistory';
import BusinessAccountStatement from './BusinessAccountStatement';
import DoctorAccountStatement from './DoctorAccountStatement';
import DistributorAccountStatement from './DistributorAccountStatement';
import DepartmentManagement from './DepartmentManagement';
import PatientManagement from './PatientManagement';
import ConfigurationManagement from './ConfigurationManagement';
import { 
  CurrencyDollarIcon, BanknotesIcon, ChartBarIcon, UserGroupIcon,
  BuildingOfficeIcon, UsersIcon, TruckIcon, PlusIcon, CreditCardIcon,
  DocumentArrowUpIcon, ChartPieIcon, ArrowUpIcon, ArrowDownIcon,
  ClockIcon, CalendarIcon, BellIcon, Cog6ToothIcon, HomeIcon,
  DocumentTextIcon, UserIcon, ArrowTrendingUpIcon, EyeIcon,
  Squares2X2Icon, ChevronDownIcon, MagnifyingGlassIcon, FunnelIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const DarkCorporateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pharmacy_dashboard' | 'doctor_dashboard' | 'combined_analytics' | 'reports' | 'stakeholders' | 'patients' | 'statements' | 'business_statement' | 'doctor_statement' | 'distributor_statement' | 'configuration'>('pharmacy_dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);
  
  const { 
    transactions, 
    addTransaction, 
    getDashboardStats,
    getDistributorPaymentsDue 
  } = useTransactions();
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  
  // Get real-time dashboard stats from transaction context
  const stats: DashboardStats = getDashboardStats();

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
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
      'Partner Payments': transactions.filter(t => t.category === 'business_partner_payment').reduce((sum, t) => sum + t.amount, 0),
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
        .filter(t => ['distributor_payment', 'employee_payment', 'clinic_expense', 'business_partner_payment', 'doctor_expense'].includes(t.category))
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

  const handleTransactionSubmit = (data: any) => {
    addTransaction({
      category: data.category,
      stakeholderId: data.stakeholderId,
      stakeholderType: data.stakeholderType,
      amount: parseFloat(data.amount),
      description: data.description,
      date: new Date(data.date),
      createdBy: 'Admin User'
    });

    setShowTransactionForm(false);
    
    // Show success message
    alert(`Transaction added successfully: ${formatCurrency(parseFloat(data.amount))} for ${data.description}`);
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
      default:
        fromDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setDateRange({
      from: fromDate.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0]
    });
  };

  const Header: React.FC = () => (
    <div className="bg-gray-900 border-b border-gray-700">
      {/* Main Header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src={qbLogo} alt="QB Pharmacy" className="h-8 w-8 object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-white">QB Pharmacy</h1>
                <p className="text-xs text-gray-400">Enterprise Management System</p>
              </div>
              <div className="block sm:hidden">
                <h1 className="text-base font-semibold text-white">QB Pharmacy</h1>
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
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden xl:inline">Add Transaction</span>
                <span className="xl:hidden">Add</span>
              </button>
              
              <button
                onClick={() => setShowPaymentProcessor(true)}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <CreditCardIcon className="h-4 w-4" />
                <span className="hidden xl:inline">Process Payments</span>
                <span className="xl:hidden">Pay</span>
              </button>
            </div>

            {/* Mobile Quick Actions */}
            <div className="lg:hidden flex items-center gap-1">
              <button
                onClick={() => setShowTransactionForm(true)}
                className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="Add Transaction"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setShowPaymentProcessor(true)}
                className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                title="Process Payments"
              >
                <CreditCardIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Search - Hidden on small screens */}
            <div className="hidden md:block relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40 lg:w-48 xl:w-56"
              />
            </div>
            
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors">
              <BellIcon className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
            </button>
            
            {/* User Menu */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-600">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-gray-300" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">Admin</p>
                <p className="text-xs text-gray-400">admin@qb.com</p>
              </div>
              <ChevronDownIcon className="h-3 w-3 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 pb-0 border-b border-gray-800">
        <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
          {/* Primary Navigation */}
          {[
            { id: 'pharmacy_dashboard', label: 'Pharmacy', icon: BuildingOfficeIcon, category: 'dashboard' },
            { id: 'doctor_dashboard', label: 'Doctor', icon: UserGroupIcon, category: 'dashboard' },
            { id: 'combined_analytics', label: 'Analytics', icon: ChartBarIcon, category: 'dashboard' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
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
          
          {/* Management */}
          {[
            { id: 'stakeholders', label: 'Stakeholders', icon: UsersIcon, category: 'management' },
            { id: 'patients', label: 'Patients', icon: UserIcon, category: 'management' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
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
          
          {/* Reports & Statements */}
          {[
            { id: 'reports', label: 'Reports', icon: DocumentTextIcon, category: 'reports' },
            { id: 'statements', label: 'Statements', icon: DocumentArrowUpIcon, category: 'reports' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
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
          
          {/* Settings */}
          {[
            { id: 'configuration', label: 'Settings', icon: Cog6ToothIcon, category: 'settings' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
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
      
      {/* Sub-navigation for Statements */}
      {(activeTab === 'statements' || activeTab === 'business_statement' || activeTab === 'doctor_statement' || activeTab === 'distributor_statement') && (
        <div className="px-4 py-2 bg-gray-850 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 mr-3">Statement Type:</span>
            {[
              { id: 'statements', label: 'Account Statements', icon: DocumentArrowUpIcon },
              { id: 'business_statement', label: 'Pharmacy Business', icon: BuildingOfficeIcon },
              { id: 'doctor_statement', label: 'Doctor Practice', icon: UserGroupIcon },
              { id: 'distributor_statement', label: 'Distributor Accounts', icon: TruckIcon },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                  activeTab === item.id 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                )}
              >
                <item.icon className="h-3 w-3" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
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
  }> = ({ title, data, columns, maxRows = 5 }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg h-fit">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {data.slice(0, maxRows).map((row, idx) => (
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
          {data.length > maxRows && (
            <div className="pt-2 text-center">
              <p className="text-xs text-gray-400">+{data.length - maxRows} more items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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

  const PayablesTable: React.FC<{ payables: PayableBalance[]; title: string }> = ({ payables, title }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg h-fit">
      <div className="px-4 py-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {payables.slice(0, 4).map((payable, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white truncate">{payable.stakeholderName}</p>
                <span className="text-sm font-bold text-red-400">{formatCurrency(payable.netPayable)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Earned: {formatCurrency(payable.totalEarned)}</span>
                <span>Paid: {formatCurrency(payable.totalPaid)}</span>
              </div>
            </div>
          ))}
          {payables.length > 4 && (
            <div className="pt-2 text-center border-t border-gray-700">
              <p className="text-xs text-gray-400">+{payables.length - 4} more payables</p>
            </div>
          )}
        </div>
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

  const DateFilter: React.FC = () => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-5 overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <FunnelIcon className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-white">Dashboard Period Filter</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Quick Period Selection */}
        <div className="min-w-0">
          <label className="block text-xs font-medium text-gray-300 mb-2">Time Period</label>
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last 1 Year</option>
          </select>
        </div>

        {/* Custom Date Range */}
        <div className="min-w-0">
          <label className="block text-xs font-medium text-gray-300 mb-2">From Date</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="min-w-0">
          <label className="block text-xs font-medium text-gray-300 mb-2">To Date</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            className="w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <div className="flex items-end min-w-0">
          <div className="w-full min-w-0">
            <label className="block text-xs font-medium text-gray-300 mb-2">Current Range</label>
            <div className="px-2 py-2 bg-gray-750 border border-gray-600 rounded-lg text-xs text-gray-300 truncate">
              {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPharmacyDashboard = () => (
    <div className="space-y-5">
      <DateFilter />
      
      {/* Pharmacy Business Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Pharmacy Sales"
          value={formatCurrency(stats.todayPharmacyRevenue)}
          change="+0%"
          changeType="increase"
          subtitle="Today's pharmacy revenue"
          icon={CurrencyDollarIcon}
        />
        <MetricCard
          title="Total Pharmacy Revenue"
          value={formatCurrency(stats.pharmacyRevenue)}
          change="+0%"
          changeType="increase"
          subtitle="All-time pharmacy sales"
          icon={BanknotesIcon}
        />
        <MetricCard
          title="Pharmacy Cash Position"
          value={formatCurrency(stats.pharmacyCashPosition)}
          change="+0%"
          changeType="increase"
          subtitle="Pharmacy business funds"
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Pharmacy Monthly Profit"
          value={formatCurrency(stats.pharmacyMonthlyProfit)}
          change="+0%"
          changeType="increase"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        <PayablesTable payables={stats.employeeSalaryDue} title="Employee Salary Due" />
        <PayablesTable payables={stats.businessPartnerPayables} title="Business Partner Commission Due" />
        <DistributorPaymentsDue />
        <DataTable
          title="Distributor Credit Balances"
          data={stats.distributorCredits}
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
          change="+0%"
          changeType="increase"
          subtitle="Today's consultation revenue"
          icon={UserGroupIcon}
        />
        <MetricCard
          title="Total Doctor Revenue"
          value={formatCurrency(stats.doctorRevenue)}
          change="+0%"
          changeType="increase"
          subtitle="All-time consultation fees"
          icon={CurrencyDollarIcon}
        />
        <MetricCard
          title="Doctor Payables Due"
          value={formatCurrency(stats.doctorPayables.reduce((sum, p) => sum + p.netPayable, 0))}
          change="+0%"
          changeType="increase"
          subtitle="Outstanding doctor payments"
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Active Doctors"
          value={stats.doctorPayables.length.toString()}
          change="+0%"
          changeType="increase"
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

      {/* Doctor Data Tables */}
      <div className="grid grid-cols-1 gap-4">
        <PayablesTable payables={stats.doctorPayables} title="Doctor Outstanding Payments" />
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[].map((kpi, index) => (
          <div key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 h-fit">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 truncate">{kpi.metric}</h4>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-lg font-bold text-white">{kpi.value}</span>
              <span className="text-xs text-gray-500 truncate">/ {kpi.target}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-green-400 font-medium truncate">{kpi.trend}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => {
    // Calculate doctor performance data from real transactions
    const doctorPerformance = stats.doctorPayables.map(doctor => ({
      name: doctor.stakeholderName,
      revenue: doctor.totalEarned,
      payablesDue: doctor.netPayable,
      transactionCount: transactions.filter(t => t.stakeholderId === doctor.stakeholderId).length,
      lastActivity: transactions
        .filter(t => t.stakeholderId === doctor.stakeholderId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date
    }));

    // Calculate business performance summary
    const businessSummary = {
      pharmacyRevenue: stats.pharmacyRevenue,
      doctorRevenue: stats.doctorRevenue,
      totalRevenue: stats.pharmacyRevenue + stats.doctorRevenue,
      pharmacyProfit: stats.pharmacyMonthlyProfit,
      totalPayables: [...stats.doctorPayables, ...stats.businessPartnerPayables, ...stats.employeeSalaryDue]
        .reduce((sum, p) => sum + p.netPayable, 0),
      distributorCredits: stats.distributorCredits.reduce((sum, d) => sum + d.creditBalance, 0)
    };

    return (
      <div className="space-y-6">
        {/* Business Performance Summary */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Business Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-750 rounded-lg p-4">
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(businessSummary.totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
            </div>
            <div className="bg-gray-750 rounded-lg p-4">
              <p className="text-sm text-gray-400">Pharmacy Revenue</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency(businessSummary.pharmacyRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Pharmacy sales only</p>
            </div>
            <div className="bg-gray-750 rounded-lg p-4">
              <p className="text-sm text-gray-400">Doctor Revenue</p>
              <p className="text-2xl font-bold text-purple-400">{formatCurrency(businessSummary.doctorRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Consultation fees</p>
            </div>
            <div className="bg-gray-750 rounded-lg p-4">
              <p className="text-sm text-gray-400">Outstanding Payables</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrency(businessSummary.totalPayables)}</p>
              <p className="text-xs text-gray-500 mt-1">Amount owed</p>
            </div>
          </div>
        </div>

        {/* Doctor Performance Analysis */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Doctor Performance Analysis</h3>
            <p className="text-sm text-gray-400">Revenue and activity analysis per doctor</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Doctor Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue Generated</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Payables Due</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Transactions</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {doctorPerformance.length > 0 ? (
                  doctorPerformance.map((doctor, index) => (
                    <tr key={index} className="hover:bg-gray-750 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{doctor.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-green-400">{formatCurrency(doctor.revenue)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-red-400">{formatCurrency(doctor.payablesDue)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-300">{doctor.transactionCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-300">
                          {doctor.lastActivity ? new Date(doctor.lastActivity).toLocaleDateString() : 'No activity'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                      No doctor transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History */}
        <TransactionHistory transactions={transactions} />

        {/* Payables Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-md font-semibold text-white mb-4">Doctor Payables</h4>
            <div className="space-y-3">
              {stats.doctorPayables.slice(0, 5).map((payable, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{payable.stakeholderName}</span>
                  <span className="text-sm font-semibold text-red-400">{formatCurrency(payable.netPayable)}</span>
                </div>
              ))}
              {stats.doctorPayables.length === 0 && (
                <p className="text-sm text-gray-500">No doctor payables</p>
              )}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-md font-semibold text-white mb-4">Employee Salaries Due</h4>
            <div className="space-y-3">
              {stats.employeeSalaryDue.slice(0, 5).map((payable, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{payable.stakeholderName}</span>
                  <span className="text-sm font-semibold text-yellow-400">{formatCurrency(payable.netPayable)}</span>
                </div>
              ))}
              {stats.employeeSalaryDue.length === 0 && (
                <p className="text-sm text-gray-500">No employee salaries due</p>
              )}
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <h4 className="text-md font-semibold text-white mb-4">Distributor Credits</h4>
            <div className="space-y-3">
              {stats.distributorCredits.slice(0, 5).map((credit, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">{credit.name}</span>
                  <span className="text-sm font-semibold text-orange-400">{formatCurrency(credit.creditBalance)}</span>
                </div>
              ))}
              {stats.distributorCredits.length === 0 && (
                <p className="text-sm text-gray-500">No distributor credits</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      
      <main className="p-5 max-w-7xl mx-auto">
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

        {activeTab === 'pharmacy_dashboard' && renderPharmacyDashboard()}
        {activeTab === 'doctor_dashboard' && renderDoctorDashboard()}
        {activeTab === 'combined_analytics' && renderCombinedAnalytics()}
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'stakeholders' && <StakeholderManagement />}
        {activeTab === 'patients' && <PatientManagement />}
        {activeTab === 'statements' && <AccountStatement />}
        {activeTab === 'business_statement' && <BusinessAccountStatement />}
        {activeTab === 'doctor_statement' && <DoctorAccountStatement />}
        {activeTab === 'distributor_statement' && <DistributorAccountStatement />}
        {activeTab === 'configuration' && <ConfigurationManagement />}
      </main>

      <TransactionForm
        isOpen={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        onSubmit={handleTransactionSubmit}
      />

      <PaymentProcessor
        isOpen={showPaymentProcessor}
        onClose={() => setShowPaymentProcessor(false)}
        onProcessPayments={handlePaymentProcessed}
      />
    </div>
  );
};

export default DarkCorporateDashboard;