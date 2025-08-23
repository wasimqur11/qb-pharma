import React from 'react';
import { mockDashboardStats } from '../data/mockData';
import type { DashboardStats, PayableBalance } from '../types';
import qbLogo from '../assets/qblogo.png';
import { 
  CurrencyDollarIcon, 
  BanknotesIcon, 
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  UsersIcon,
  TruckIcon,
  PlusIcon,
  CreditCardIcon,
  DocumentArrowUpIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const stats: DashboardStats = mockDashboardStats;

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const StatCard: React.FC<{
    title: string;
    amount: number;
    icon: React.ElementType;
    trend?: string;
    bgGradient: string;
    iconColor: string;
  }> = ({ title, amount, icon: Icon, trend, bgGradient, iconColor }) => (
    <div className={`relative overflow-hidden rounded-xl ${bgGradient} p-6 shadow-lg backdrop-blur-sm border border-white/20`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(amount)}</p>
          {trend && <p className="text-xs text-white/70 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconColor} bg-white/20`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );

  const PayableCard: React.FC<{ 
    title: string; 
    payables: PayableBalance[];
    icon: React.ElementType;
    accentColor: string;
  }> = ({ title, payables, icon: Icon, accentColor }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${accentColor}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <div className="space-y-3">
          {payables.map((payable) => (
            <div key={payable.stakeholderId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <span className="text-sm font-medium text-gray-900">{payable.stakeholderName}</span>
                <p className="text-xs text-gray-500">Due amount</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(payable.netPayable)}
                </span>
              </div>
            </div>
          ))}
          
          <div className="pt-3 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Due</span>
              <span className={`text-xl font-bold ${accentColor === 'bg-red-500' ? 'text-red-600' : 
                accentColor === 'bg-blue-500' ? 'text-blue-600' : 
                accentColor === 'bg-green-500' ? 'text-green-600' : 'text-purple-600'}`}>
                {formatCurrency(payables.reduce((sum, p) => sum + p.netPayable, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const DistributorCreditsCard: React.FC = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-orange-500">
            <TruckIcon className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Distributor Credits</h3>
        </div>
        
        <div className="space-y-3">
          {stats.distributorCredits.map((distributor) => (
            <div key={distributor.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <span className="text-sm font-medium text-gray-900">{distributor.name}</span>
                <p className="text-xs text-gray-500">Credit balance</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(distributor.creditBalance)}
                </span>
              </div>
            </div>
          ))}
          
          <div className="pt-3 border-t-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Credits</span>
              <span className="text-xl font-bold text-orange-600">
                {formatCurrency(stats.distributorCredits.reduce((sum, d) => sum + d.creditBalance, 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const QuickActionButton: React.FC<{
    title: string;
    icon: React.ElementType;
    color: string;
    onClick: () => void;
  }> = ({ title, icon: Icon, color, onClick }) => (
    <button 
      onClick={onClick}
      className={`${color} hover:opacity-90 text-white font-medium py-4 px-6 rounded-xl transition duration-200 flex items-center gap-3 shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
    >
      <Icon className="h-5 w-5" />
      <span>{title}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg flex items-center justify-center">
              <img src={qbLogo} alt="QB Pharmacy" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">QB Pharmacy</h1>
              <p className="text-gray-600">Financial Dashboard & Management System</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Today's Revenue"
            amount={stats.todayRevenue}
            icon={CurrencyDollarIcon}
            trend="Pharmacy + Consultation fees"
            bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
            iconColor="bg-green-600"
          />
          
          <StatCard
            title="Cash Position"
            amount={stats.cashPosition}
            icon={BanknotesIcon}
            trend="Available liquid funds"
            bgGradient="bg-gradient-to-br from-blue-500 to-cyan-600"
            iconColor="bg-blue-600"
          />
          
          <StatCard
            title="Monthly Profit"
            amount={stats.monthlyProfit}
            icon={ChartBarIcon}
            trend="Current month performance"
            bgGradient="bg-gradient-to-br from-purple-500 to-indigo-600"
            iconColor="bg-purple-600"
          />
        </div>

        {/* Payables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PayableCard 
            title="Doctor Payables"
            payables={stats.doctorPayables}
            icon={UserGroupIcon}
            accentColor="bg-red-500"
          />
          
          <PayableCard 
            title="Sales Partner Payables"
            payables={stats.businessPartnerPayables}
            icon={UsersIcon}
            accentColor="bg-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PayableCard 
            title="Employee Salary Due"
            payables={stats.employeeSalaryDue}
            icon={UsersIcon}
            accentColor="bg-green-500"
          />
          
          <DistributorCreditsCard />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gray-800">
              <PlusIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton
              title="Add Transaction"
              icon={PlusIcon}
              color="bg-gradient-to-r from-blue-600 to-blue-700"
              onClick={() => console.log('Add Transaction')}
            />
            <QuickActionButton
              title="Make Payment"
              icon={CreditCardIcon}
              color="bg-gradient-to-r from-green-600 to-green-700"
              onClick={() => console.log('Make Payment')}
            />
            <QuickActionButton
              title="Upload Credits"
              icon={DocumentArrowUpIcon}
              color="bg-gradient-to-r from-yellow-500 to-yellow-600"
              onClick={() => console.log('Upload Credits')}
            />
            <QuickActionButton
              title="View Reports"
              icon={ChartPieIcon}
              color="bg-gradient-to-r from-purple-600 to-purple-700"
              onClick={() => console.log('View Reports')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;