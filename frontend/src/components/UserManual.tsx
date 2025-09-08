import React, { useState } from 'react';
import { 
  BookOpenIcon, 
  ChevronRightIcon, 
  ChevronDownIcon,
  UserIcon,
  UsersIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
  TruckIcon,
  Cog6ToothIcon,
  DocumentArrowUpIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

interface ManualSection {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  content: React.ReactNode;
}

const UserManual: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const manualSections: ManualSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpenIcon,
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Welcome to QB Pharma Portal</h4>
          <p className="text-gray-300">
            This comprehensive pharmaceutical management system helps you manage stakeholders, 
            track transactions, process settlements, and generate detailed reports.
          </p>
          <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30">
            <h5 className="font-medium text-blue-300 mb-2">First Time Users:</h5>
            <ol className="list-decimal list-inside text-gray-300 space-y-1">
              <li>Start with the Dashboard to get an overview of your business</li>
              <li>Set up stakeholders (doctors, distributors, patients) in the Management section</li>
              <li>Import or enter transaction data</li>
              <li>Configure system settings according to your business needs</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      icon: Squares2X2Icon,
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Business Dashboard</h4>
          <p className="text-gray-300">
            The main dashboard provides a comprehensive view of your business performance with real-time analytics.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
              <h5 className="font-medium text-white mb-2">Key Features:</h5>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Financial metrics and performance indicators</li>
                <li>Transaction volume and trends</li>
                <li>Stakeholder activity overview</li>
                <li>Settlement status tracking</li>
                <li>Interactive date range filtering</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'stakeholder-management',
      title: 'Stakeholder Management',
      icon: UsersIcon,
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Managing Stakeholders</h4>
          <p className="text-gray-300">
            Manage all your business relationships including doctors, distributors, patients, and employees.
          </p>
          <div className="grid gap-4">
            <div className="bg-gray-800/50 p-4 rounded border border-gray-600">
              <h5 className="font-medium text-green-400 mb-2">👨‍⚕️ Doctors</h5>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Add doctor profiles with contact information</li>
                <li>Set commission rates and consultation fees</li>
                <li>Track referral activity and earnings</li>
                <li>Generate doctor-specific statements</li>
              </ul>
            </div>
            <div className="bg-gray-800/50 p-4 rounded border border-gray-600">
              <h5 className="font-medium text-blue-400 mb-2">🚛 Distributors</h5>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Manage distributor network and territories</li>
                <li>Track sales performance and payments</li>
                <li>Set credit limits and payment terms</li>
                <li>Monitor outstanding balances</li>
              </ul>
            </div>
            <div className="bg-gray-800/50 p-4 rounded border border-gray-600">
              <h5 className="font-medium text-purple-400 mb-2">🤝 Patients</h5>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Patient registration and profile management</li>
                <li>Credit tracking and payment history</li>
                <li>Treatment records and consultations</li>
                <li>Insurance and billing information</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'transactions',
      title: 'Transaction Management',
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Managing Transactions</h4>
          <p className="text-gray-300">
            Record, track, and analyze all business transactions across your pharmaceutical operations.
          </p>
          <div className="space-y-3">
            <div className="bg-orange-900/30 p-4 rounded border border-orange-500/30">
              <h5 className="font-medium text-orange-300 mb-2">Transaction Types:</h5>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li><strong>Sales:</strong> Product sales to distributors and direct customers</li>
                <li><strong>Commissions:</strong> Doctor referral payments and consultation fees</li>
                <li><strong>Credits:</strong> Patient credit transactions and adjustments</li>
                <li><strong>Settlements:</strong> Periodic settlement payments and adjustments</li>
              </ul>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
              <h5 className="font-medium text-white mb-2">Data Import:</h5>
              <p className="text-gray-300 text-sm">
                Import transaction data from Excel/CSV files with automatic validation and duplicate detection.
                Supports bulk uploads with detailed error reporting.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'payment-estimation',
      title: 'Payment Estimation',
      icon: CurrencyDollarIcon,
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Payment Estimation System</h4>
          <p className="text-gray-300">
            Calculate estimated payments for distributors based on sales performance and configured rates.
          </p>
          <div className="space-y-3">
            <div className="bg-green-900/30 p-4 rounded border border-green-500/30">
              <h5 className="font-medium text-green-300 mb-2">How It Works:</h5>
              <ol className="list-decimal list-inside text-gray-300 space-y-1">
                <li>Configure payment rates and commission structures</li>
                <li>Select date range and distributor criteria</li>
                <li>System calculates based on sales volume and performance</li>
                <li>Review and adjust estimates before finalizing</li>
                <li>Generate payment reports and documentation</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'statements',
      title: 'Account Statements',
      icon: CreditCardIcon,
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Statement Generation</h4>
          <p className="text-gray-300">
            Generate detailed financial statements for different stakeholders and business activities.
          </p>
          <div className="grid gap-3">
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
              <h5 className="font-medium text-blue-300 mb-1">📊 Business Statement</h5>
              <p className="text-gray-300 text-sm">Comprehensive business partnership statements with financial summaries</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
              <h5 className="font-medium text-green-300 mb-1">👨‍⚕️ Doctor Statement</h5>
              <p className="text-gray-300 text-sm">Commission tracking and consultation fee statements for medical professionals</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
              <h5 className="font-medium text-purple-300 mb-1">🚛 Distributor Statement</h5>
              <p className="text-gray-300 text-sm">Payment history, credit balances, and sales performance reports</p>
            </div>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-600">
              <h5 className="font-medium text-orange-300 mb-1">💳 Account Statement</h5>
              <p className="text-gray-300 text-sm">Individual account statements with transaction history and balances</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'system-settings',
      title: 'System Configuration',
      icon: Cog6ToothIcon,
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">System Settings</h4>
          <p className="text-gray-300">
            Configure system-wide settings, user preferences, and business rules.
          </p>
          <div className="space-y-3">
            <div className="bg-gray-800/50 p-4 rounded border border-gray-600">
              <h5 className="font-medium text-white mb-2">Configuration Options:</h5>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li><strong>User Management:</strong> Add users, assign roles, manage permissions</li>
                <li><strong>Business Rules:</strong> Set commission rates, payment terms, credit limits</li>
                <li><strong>Settlement Points:</strong> Configure automatic settlement periods</li>
                <li><strong>Notification Settings:</strong> Email alerts and system notifications</li>
                <li><strong>Data Backup:</strong> Automatic backups and data retention policies</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      title: 'Business Reports',
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Business Analytics & Reports</h4>
          <p className="text-gray-300">
            Generate comprehensive business reports and analytics to track performance and make informed decisions.
          </p>
          <div className="space-y-3">
            <div className="bg-indigo-900/30 p-4 rounded border border-indigo-500/30">
              <h5 className="font-medium text-indigo-300 mb-2">Available Reports:</h5>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Daily business analytics with financial insights</li>
                <li>Sales performance by distributor and territory</li>
                <li>Doctor commission and referral activity</li>
                <li>Patient credit utilization and payment patterns</li>
                <li>Settlement history and equity calculations</li>
                <li>Custom date range reporting with filters</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting & Support',
      icon: BookOpenIcon,
      content: (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Common Issues & Solutions</h4>
          <div className="space-y-3">
            <div className="bg-red-900/30 p-4 rounded border border-red-500/30">
              <h5 className="font-medium text-red-300 mb-2">🚨 Common Issues:</h5>
              <div className="space-y-2">
                <div>
                  <p className="text-white font-medium">Data Import Errors</p>
                  <p className="text-gray-300 text-sm">Check file format, required columns, and data validation rules</p>
                </div>
                <div>
                  <p className="text-white font-medium">Settlement Calculation Issues</p>
                  <p className="text-gray-300 text-sm">Verify settlement points are configured and transaction dates are within range</p>
                </div>
                <div>
                  <p className="text-white font-medium">Permission Errors</p>
                  <p className="text-gray-300 text-sm">Contact system administrator to verify user role and permissions</p>
                </div>
              </div>
            </div>
            <div className="bg-green-900/30 p-4 rounded border border-green-500/30">
              <h5 className="font-medium text-green-300 mb-2">💡 Tips for Best Performance:</h5>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>Regular data backups and system maintenance</li>
                <li>Use appropriate date ranges for better report performance</li>
                <li>Keep stakeholder information up to date</li>
                <li>Review and reconcile settlements regularly</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <BookOpenIcon className="w-12 h-12 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              QB Pharma User Manual
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive guide to using the QB Pharma pharmaceutical management portal. 
            Learn how to manage stakeholders, process transactions, and generate reports effectively.
          </p>
        </div>

        <div className="space-y-4">
          {manualSections.map((section) => {
            const isExpanded = expandedSections.includes(section.id);
            const Icon = section.icon;
            
            return (
              <div key={section.id} className="bg-gray-800/50 rounded-lg border border-gray-600 overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                >
                  <div className="flex items-center">
                    <Icon className="w-6 h-6 text-blue-400 mr-3" />
                    <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-600/50">
                    <div className="pt-4">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-600/30">
            <h3 className="text-xl font-semibold text-white mb-3">Need Additional Help?</h3>
            <p className="text-gray-300 mb-4">
              For technical support or feature requests, contact your system administrator or IT support team.
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-400">
              <span>Version: 1.0</span>
              <span>•</span>
              <span>Last Updated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManual;