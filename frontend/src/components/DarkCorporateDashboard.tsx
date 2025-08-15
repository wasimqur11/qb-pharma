import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
// No mock data imports - clean slate for real pharmacy
import type { DashboardStats, PayableBalance, Transaction } from '../types';
import qbLogo from '../assets/qblogo.png';
import TransactionForm from './TransactionForm';
import StakeholderManagement from './StakeholderManagement';
import AccountStatement from './AccountStatement';
import PaymentProcessor from './PaymentProcessor';
import TransactionHistory from './TransactionHistory';
import BusinessAccountStatement from './BusinessAccountStatement';
import DoctorAccountStatement from './DoctorAccountStatement';
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
  const [activeTab, setActiveTab] = useState<'pharmacy_dashboard' | 'doctor_dashboard' | 'combined_analytics' | 'reports' | 'stakeholders' | 'statements' | 'business_statement' | 'doctor_statement'>('pharmacy_dashboard');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showPaymentProcessor, setShowPaymentProcessor] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  // Empty stats for fresh pharmacy setup
  const stats: DashboardStats = {
    todayRevenue: 0,
    cashPosition: 0,
    monthlyProfit: 0,
    doctorPayables: [],
    businessPartnerPayables: [],
    employeeSalaryDue: [],
    distributorCredits: []
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const handleTransactionSubmit = (data: any) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      category: data.category,
      stakeholderId: data.stakeholderId,
      stakeholderType: data.stakeholderType,
      amount: parseFloat(data.amount),
      description: data.description,
      date: new Date(data.date),
      createdBy: 'Admin User',
      createdAt: new Date()
    };

    setTransactions(prev => [newTransaction, ...prev]);
    setShowTransactionForm(false);
    
    // Show success message
    alert(`Transaction added successfully: ${formatCurrency(newTransaction.amount)} for ${data.description}`);
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
        <nav className="flex items-center gap-1 -mb-px">
          {[
            { id: 'pharmacy_dashboard', label: 'Pharmacy Business', icon: BuildingOfficeIcon },
            { id: 'doctor_dashboard', label: 'Doctor Dashboard', icon: UserGroupIcon },
            { id: 'combined_analytics', label: 'Combined Analytics', icon: ChartBarIcon },
            { id: 'reports', label: 'Reports', icon: DocumentTextIcon },
            { id: 'stakeholders', label: 'Stakeholders', icon: UsersIcon },
            { id: 'statements', label: 'Statements', icon: DocumentArrowUpIcon },
            { id: 'business_statement', label: 'Pharmacy Statement', icon: BuildingOfficeIcon },
            { id: 'doctor_statement', label: 'Doctor Statement', icon: UserGroupIcon },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-all duration-200',
                activeTab === item.id 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10' 
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
          value={formatCurrency(stats.cashPosition)}
          change="+0%"
          changeType="increase"
          subtitle="Today's pharmacy revenue"
          icon={CurrencyDollarIcon}
        />
        <MetricCard
          title="Business Cash"
          value={formatCurrency(stats.cashPosition)}
          change="+0%"
          changeType="increase"
          subtitle="Available business funds"
          icon={BanknotesIcon}
        />
        <MetricCard
          title="Business Profit"
          value={formatCurrency(stats.todayRevenue)}
          change="+0%"
          changeType="increase"
          subtitle="Pharmacy business profit"
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Owner Profit Due"
          value={formatCurrency(stats.monthlyProfit)}
          change="+0%"
          changeType="increase"
          subtitle="Total owed to business owners"
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
            <LineChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
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
                data={[]}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {[].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PayablesTable payables={stats.employeeSalaryDue} title="Employee Salary Due" />
        <PayablesTable payables={stats.businessPartnerPayables} title="Business Partner Commission Due" />
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
          value={formatCurrency(0)}
          change="+0%"
          changeType="increase"
          subtitle="12 patients treated"
          icon={UserGroupIcon}
        />
        <MetricCard
          title="Doctor Expenses"
          value={formatCurrency(0)}
          change="+0%"
          changeType="decrease"
          subtitle="Equipment & supplies"
          icon={CurrencyDollarIcon}
        />
        <MetricCard
          title="Net Doctor Income"
          value={formatCurrency(0)}
          change="+0%"
          changeType="increase"
          subtitle="This month"
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Patient Count"
          value="0"
          change="+0%"
          changeType="increase"
          subtitle="This month"
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
            <LineChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} />
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
                data={[]}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {[].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
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
          <BarChart data={[]} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
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

  const renderReports = () => (
    <div className="space-y-6">
      <TransactionHistory transactions={transactions} />
      
      <DataTable
        title="Doctor Performance Analysis"
        data={[]}
        columns={[
          { key: 'name', label: 'Doctor Name' },
          { key: 'patients', label: 'Patients Treated' },
          { key: 'revenue', label: 'Revenue Generated', render: (value) => <span className="text-green-400">{formatCurrency(value)}</span> },
          { 
            key: 'efficiency', 
            label: 'Efficiency Rating',
            render: (value) => (
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-700 rounded-full h-2">
                  <div 
                    className={clsx(
                      'h-2 rounded-full transition-all duration-300',
                      value >= 90 ? 'bg-green-500' : value >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-white">{value}%</span>
              </div>
            )
          },
        ]}
      />
    </div>
  );

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
        {activeTab === 'statements' && <AccountStatement />}
        {activeTab === 'business_statement' && <BusinessAccountStatement />}
        {activeTab === 'doctor_statement' && <DoctorAccountStatement />}
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