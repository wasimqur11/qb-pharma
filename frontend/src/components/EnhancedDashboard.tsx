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
  DocumentTextIcon, UserIcon, ArrowTrendingUpIcon, EyeIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const EnhancedDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'performance'>('overview');
  const stats: DashboardStats = mockDashboardStats;

  const formatCurrency = (amount: number) => {
    return `₨${amount.toLocaleString()}`;
  };

  const Sidebar: React.FC = () => (
    <div className="w-64 bg-white shadow-xl border-r border-gray-200 h-screen fixed left-0 top-0 z-40">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
            <BuildingOfficeIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">QB Pharmacy</h2>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {[
          { id: 'overview', icon: HomeIcon, label: 'Overview', active: activeTab === 'overview' },
          { id: 'analytics', icon: ChartBarIcon, label: 'Analytics', active: activeTab === 'analytics' },
          { id: 'performance', icon: ArrowTrendingUpIcon, label: 'Performance', active: activeTab === 'performance' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={clsx(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200',
              item.active 
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <item.icon className={clsx('h-5 w-5', item.active ? 'text-blue-600' : 'text-gray-400')} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
        
        <div className="pt-6 mt-6 border-t border-gray-200 space-y-2">
          {[
            { icon: UserGroupIcon, label: 'Stakeholders' },
            { icon: DocumentTextIcon, label: 'Transactions' },
            { icon: CreditCardIcon, label: 'Payments' },
            { icon: DocumentArrowUpIcon, label: 'Reports' },
          ].map((item, idx) => (
            <button
              key={idx}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200"
            >
              <item.icon className="h-5 w-5 text-gray-400" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );

  const TopBar: React.FC = () => (
    <div className="ml-64 bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab} Dashboard</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          })}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <BellIcon className="h-5 w-5" />
        </button>
        <button className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Cog6ToothIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-gray-700">Admin User</span>
        </div>
      </div>
    </div>
  );

  const MetricCard: React.FC<{
    title: string;
    amount: number;
    icon: React.ElementType;
    trend?: { value: string; direction: 'up' | 'down' };
    bgGradient: string;
  }> = ({ title, amount, icon: Icon, trend, bgGradient }) => (
    <div className={`relative overflow-hidden rounded-2xl ${bgGradient} p-6 shadow-xl backdrop-blur-sm border border-white/20`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-white/90 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white mb-2">{formatCurrency(amount)}</p>
          {trend && (
            <div className="flex items-center gap-1">
              {trend.direction === 'up' ? 
                <ArrowUpIcon className="h-4 w-4 text-white" /> : 
                <ArrowDownIcon className="h-4 w-4 text-white" />
              }
              <span className="text-sm font-medium text-white/90">{trend.value} from last month</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mb-16"></div>
    </div>
  );

  const KPICard: React.FC<{ kpi: typeof kpiData[0] }> = ({ kpi }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800">{kpi.metric}</h4>
        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
          {kpi.trend}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
        <span className="text-sm text-gray-500">/ {kpi.target} target</span>
      </div>
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
          style={{ width: `${(kpi.value / kpi.target) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  const PayableCard: React.FC<{ 
    title: string; 
    payables: PayableBalance[];
    icon: React.ElementType;
    accentColor: string;
  }> = ({ title, payables, icon: Icon, accentColor }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${accentColor}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <EyeIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-4">
          {payables.map((payable) => (
            <div key={payable.stakeholderId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm font-medium text-gray-900">{payable.stakeholderName}</span>
                <p className="text-xs text-gray-500">Due amount</p>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(payable.netPayable)}
              </span>
            </div>
          ))}
          
          <div className="pt-4 border-t-2 border-gray-100">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900">Total Outstanding</span>
              <span className={`text-xl font-bold ${
                accentColor === 'bg-red-500' ? 'text-red-600' : 
                accentColor === 'bg-blue-500' ? 'text-blue-600' : 
                accentColor === 'bg-green-500' ? 'text-green-600' : 'text-purple-600'
              }`}>
                {formatCurrency(payables.reduce((sum, p) => sum + p.netPayable, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Today's Revenue"
          amount={stats.todayRevenue}
          icon={CurrencyDollarIcon}
          trend={{ value: "+12%", direction: "up" }}
          bgGradient="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700"
        />
        <MetricCard
          title="Cash Position"
          amount={stats.cashPosition}
          icon={BanknotesIcon}
          trend={{ value: "+8%", direction: "up" }}
          bgGradient="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-700"
        />
        <MetricCard
          title="Monthly Profit"
          amount={stats.monthlyProfit}
          icon={ChartBarIcon}
          trend={{ value: "+15%", direction: "up" }}
          bgGradient="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700"
        />
        <MetricCard
          title="Total Payables"
          amount={106000}
          icon={ClockIcon}
          trend={{ value: "-5%", direction: "down" }}
          bgGradient="bg-gradient-to-br from-orange-500 via-orange-600 to-red-700"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">7-Day Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorPharmacy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorConsultation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="pharmacy" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPharmacy)" />
            <Area type="monotone" dataKey="consultation" stackId="1" stroke="#10b981" fillOpacity={1} fill="url(#colorConsultation)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Payables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PayableCard 
          title="Doctor Payables"
          payables={stats.doctorPayables}
          icon={UserGroupIcon}
          accentColor="bg-red-500"
        />
        <PayableCard 
          title="Employee Salaries"
          payables={stats.employeeSalaryDue}
          icon={UsersIcon}
          accentColor="bg-green-500"
        />
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-8">
      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {expenseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} kpi={kpi} />
        ))}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Doctor Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Doctor</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Patients</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenue</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {doctorPerformance.map((doctor, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-4 font-medium text-gray-900">{doctor.name}</td>
                  <td className="py-4 px-4 text-gray-700">{doctor.patients}</td>
                  <td className="py-4 px-4 text-gray-700">{formatCurrency(doctor.revenue)}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${doctor.efficiency}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{doctor.efficiency}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <TopBar />
      
      <main className="ml-64 px-8 py-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'performance' && renderPerformance()}
      </main>
    </div>
  );
};

export default EnhancedDashboard;