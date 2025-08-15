import React, { useState } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { mockDashboardStats } from '../data/mockData';
import { revenueData, expenseData, monthlyData, doctorPerformance, kpiData } from '../data/mockChartData';
import type { DashboardStats, PayableBalance } from '../types';
import { 
  CurrencyDollarIcon, BanknotesIcon, ChartBarIcon, UserGroupIcon,
  BuildingOfficeIcon, UsersIcon, TruckIcon, PlusIcon, CreditCardIcon,
  DocumentArrowUpIcon, ChartPieIcon, ArrowUpIcon, ArrowDownIcon,
  ClockIcon, CalendarIcon, BellIcon, Cog6ToothIcon, HomeIcon,
  DocumentTextIcon, UserIcon, ArrowTrendingUpIcon, EyeIcon,
  Squares2X2Icon, ChevronDownIcon, MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const CorporateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'reports'>('dashboard');
  const stats: DashboardStats = mockDashboardStats;

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString()}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const Header: React.FC = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">QB Pharmacy</h1>
              <p className="text-xs text-gray-500 font-medium">Enterprise Management System</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-gray-300"></div>
          
          <nav className="flex items-center gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
              { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
              { id: 'reports', label: 'Reports', icon: DocumentTextIcon },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <BellIcon className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
          </button>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin@qbpharma.com</p>
            </div>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={clsx(
          'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
          changeType === 'increase' && 'bg-green-50 text-green-700',
          changeType === 'decrease' && 'bg-red-50 text-red-700',
          changeType === 'neutral' && 'bg-gray-50 text-gray-700'
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
  }> = ({ title, data, columns }) => (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                    {col.render ? col.render(row[col.key]) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ChartCard: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
  }> = ({ title, subtitle, children, actions }) => (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  const PayablesTable: React.FC<{ payables: PayableBalance[]; title: string }> = ({ payables, title }) => (
    <DataTable
      title={title}
      data={payables}
      columns={[
        { key: 'stakeholderName', label: 'Name' },
        { key: 'totalEarned', label: 'Total Earned', render: (value) => formatCurrency(value) },
        { key: 'totalPaid', label: 'Total Paid', render: (value) => formatCurrency(value) },
        { 
          key: 'netPayable', 
          label: 'Outstanding', 
          render: (value) => (
            <span className="font-semibold text-red-600">{formatCurrency(value)}</span>
          )
        },
      ]}
    />
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(stats.todayRevenue)}
          change="+12.5%"
          changeType="increase"
          subtitle="Today's performance"
          icon={CurrencyDollarIcon}
        />
        <MetricCard
          title="Cash Balance"
          value={formatCurrency(stats.cashPosition)}
          change="+8.2%"
          changeType="increase"
          subtitle="Available funds"
          icon={BanknotesIcon}
        />
        <MetricCard
          title="Monthly Profit"
          value={formatCurrency(stats.monthlyProfit)}
          change="+15.3%"
          changeType="increase"
          subtitle="This month"
          icon={ChartBarIcon}
        />
        <MetricCard
          title="Outstanding"
          value={formatCurrency(106000)}
          change="-5.1%"
          changeType="decrease"
          subtitle="Total payables"
          icon={ClockIcon}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Revenue Trend" 
          subtitle="7-day performance overview"
          actions={
            <select className="text-sm border border-gray-300 rounded px-3 py-1">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense Distribution" subtitle="Current month breakdown">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #d1d5db',
                  borderRadius: '8px' 
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PayablesTable payables={stats.doctorPayables} title="Doctor Outstanding Payments" />
        <PayablesTable payables={stats.employeeSalaryDue} title="Employee Salary Due" />
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <ChartCard title="Monthly Performance Comparison" subtitle="Revenue vs Expenses vs Profit">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[2, 2, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[2, 2, 0, 0]} />
            <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">{kpi.metric}</h4>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
              <span className="text-sm text-gray-500">/ {kpi.target}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${Math.min((kpi.value / kpi.target) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-green-600 font-medium">{kpi.trend}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <DataTable
        title="Doctor Performance Analysis"
        data={doctorPerformance}
        columns={[
          { key: 'name', label: 'Doctor Name' },
          { key: 'patients', label: 'Patients Treated' },
          { key: 'revenue', label: 'Revenue Generated', render: (value) => formatCurrency(value) },
          { 
            key: 'efficiency', 
            label: 'Efficiency Rating',
            render: (value) => (
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className={clsx(
                      'h-2 rounded-full',
                      value >= 90 ? 'bg-green-500' : value >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{value}%</span>
              </div>
            )
          },
        ]}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h2>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'reports' && renderReports()}
      </main>
    </div>
  );
};

export default CorporateDashboard;