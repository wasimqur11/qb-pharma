import React, { useState, useMemo } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useTransactions } from '../contexts/TransactionContext';
import type { StakeholderType, AccountStatementEntry, TransactionCategory } from '../types';
import clsx from 'clsx';

const AccountStatement: React.FC = () => {
  const { doctors, businessPartners, employees, distributors, patients } = useStakeholders();
  const { transactions, getStakeholderTransactions } = useTransactions();
  
  const [selectedStakeholder, setSelectedStakeholder] = useState<string>('');
  const [stakeholderType, setStakeholderType] = useState<StakeholderType | 'all'>('doctor');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  // Helper function to determine cash flow impact
  const getCashFlowImpact = (category: TransactionCategory): { type: 'Revenue' | 'Expense' | 'Distribution' | 'Credit Issued' | 'Credit Received' | 'Credit Reduction', color: string } => {
    const revenueCategories: TransactionCategory[] = ['pharmacy_sale', 'consultation_fee', 'patient_payment'];
    const expenseCategories: TransactionCategory[] = ['distributor_payment', 'doctor_expense', 'employee_payment', 'clinic_expense'];

    if (revenueCategories.includes(category)) {
      return { type: 'Revenue', color: 'text-green-400' };
    } else if (expenseCategories.includes(category)) {
      return { type: 'Expense', color: 'text-red-400' };
    } else if (category === 'sales_profit_distribution') {
      return { type: 'Distribution', color: 'text-purple-400' }; // Profit distribution to partners
    } else if (category === 'patient_credit_sale') {
      return { type: 'Credit Issued', color: 'text-orange-400' }; // We give credit to patient
    } else if (category === 'distributor_credit_purchase') {
      return { type: 'Credit Received', color: 'text-blue-400' }; // We receive credit from distributor
    } else if (category === 'distributor_credit_note') {
      return { type: 'Credit Reduction', color: 'text-indigo-400' }; // We return items, reducing distributor credit
    } else {
      return { type: 'Credit Issued', color: 'text-gray-400' }; // fallback
    }
  };

  const getAllStakeholders = () => {
    const stakeholders = [
      ...doctors.map(d => ({ ...d, type: 'doctor' as const, typeName: 'Doctor' })),
      ...employees.map(e => ({ ...e, type: 'employee' as const, typeName: 'Employee' })),
      ...businessPartners.map(s => ({ ...s, type: 'business_partner' as const, typeName: 'Business Partner' })),
      ...distributors.map(d => ({ ...d, type: 'distributor' as const, typeName: 'Distributor' })),
      ...patients.map(p => ({ ...p, type: 'patient' as const, typeName: 'Patient' }))
    ];
    if (stakeholderType === 'all') return stakeholders;
    return stakeholders.filter(s => s.type === stakeholderType);
  };

  const generateStatements = (stakeholderId: string, type: StakeholderType): AccountStatementEntry[] => {
    const stakeholderTransactions = getStakeholderTransactions(stakeholderId);
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    
    // Filter transactions by date range
    const filteredTransactions = stakeholderTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    // Sort by date
    const sortedTransactions = filteredTransactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Convert to statement entries with running balance
    const statements: AccountStatementEntry[] = [];
    let runningBalance = 0;
    
    sortedTransactions.forEach((transaction, index) => {
      // Determine if this is a debit or credit based on transaction category
      const isCredit = ['consultation_fee', 'pharmacy_sale', 'patient_payment'].includes(transaction.category);
      const debit = isCredit ? 0 : transaction.amount;
      const credit = isCredit ? transaction.amount : 0;
      
      runningBalance += credit - debit;
      
      statements.push({
        id: transaction.id,
        date: new Date(transaction.date),
        description: transaction.description,
        debit,
        credit,
        balance: runningBalance,
        category: transaction.category
      });
    });
    
    return statements;
  };

  const selectedStakeholderData = useMemo(() => {
    if (!selectedStakeholder) return null;
    const allStakeholders = getAllStakeholders();
    return allStakeholders.find(s => s.id === selectedStakeholder);
  }, [selectedStakeholder, stakeholderType]);

  const statementEntries = useMemo(() => {
    if (!selectedStakeholder || !selectedStakeholderData) return [];
    return generateStatements(selectedStakeholder, selectedStakeholderData.type);
  }, [selectedStakeholder, selectedStakeholderData, dateRange, transactions]);

  const filteredEntries = useMemo(() => {
    return statementEntries.filter(entry =>
      entry.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [statementEntries, searchTerm]);

  const summaryStats = useMemo(() => {
    const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit, 0);
    const netBalance = totalCredits - totalDebits;
    
    return { totalDebits, totalCredits, netBalance };
  }, [filteredEntries]);

  const exportToPDF = () => {
    // Mock export functionality
    alert('Statement exported to PDF (demo functionality)');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Account Statements</h2>
          <p className="text-gray-400 text-sm">View detailed transaction history for all stakeholders</p>
        </div>
        {selectedStakeholder && (
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export PDF
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Stakeholder Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Stakeholder Type</label>
            <select
              value={stakeholderType}
              onChange={(e) => {
                setStakeholderType(e.target.value as any);
                setSelectedStakeholder('');
              }}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="doctor">Doctors</option>
              <option value="employee">Employees</option>
              <option value="business_partner">Business Partners</option>
              <option value="distributor">Distributors</option>
              <option value="patient">Patients</option>
            </select>
          </div>

          {/* Select Stakeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Stakeholder</label>
            <select
              value={selectedStakeholder}
              onChange={(e) => setSelectedStakeholder(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            >
              <option value="">Choose stakeholder</option>
              {getAllStakeholders().map(stakeholder => (
                <option key={stakeholder.id} value={stakeholder.id}>
                  {stakeholder.name} ({stakeholder.typeName})
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">From Date</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">To Date</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      {selectedStakeholder && selectedStakeholderData ? (
        <>
          {/* Statement Header */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedStakeholderData.name}</h3>
                <p className="text-gray-400 text-sm">{selectedStakeholderData.typeName} Account Statement</p>
                <p className="text-gray-400 text-sm">
                  Period: {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Current Balance</p>
                <p className={clsx(
                  'text-xl font-bold',
                  summaryStats.netBalance >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {formatCurrency(Math.abs(summaryStats.netBalance))}
                </p>
                <p className="text-xs text-gray-500">
                  {summaryStats.netBalance >= 0 ? 'Credit Balance' : 'Debit Balance'}
                </p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Credits</p>
                <p className="text-lg font-semibold text-green-400">{formatCurrency(summaryStats.totalCredits)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total Debits</p>
                <p className="text-lg font-semibold text-red-400">{formatCurrency(summaryStats.totalDebits)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">Net Balance</p>
                <p className={clsx(
                  'text-lg font-semibold',
                  summaryStats.netBalance >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {formatCurrency(Math.abs(summaryStats.netBalance))}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full"
              />
            </div>
            <p className="text-gray-400 text-sm">
              Showing {filteredEntries.length} transactions
            </p>
          </div>

          {/* Statement Table */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Cash Flow Impact</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Debit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Credit</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {entry.date.toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {entry.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {(() => {
                            const impact = getCashFlowImpact(entry.category);
                            return (
                              <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full', 
                                impact.type === 'Revenue' ? 'bg-green-900/50 text-green-400' :
                                impact.type === 'Expense' ? 'bg-red-900/50 text-red-400' :
                                impact.type === 'Distribution' ? 'bg-purple-900/50 text-purple-400' :
                                impact.type === 'Credit Issued' ? 'bg-orange-900/50 text-orange-400' :
                                impact.type === 'Credit Received' ? 'bg-blue-900/50 text-blue-400' :
                                impact.type === 'Credit Reduction' ? 'bg-indigo-900/50 text-indigo-400' :
                                'bg-gray-900/50 text-gray-400'
                              )}>
                                {impact.type}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          {entry.debit > 0 ? (
                            <span className="text-red-400 font-medium">{formatCurrency(entry.debit)}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          {entry.credit > 0 ? (
                            <span className="text-green-400 font-medium">{formatCurrency(entry.credit)}</span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <span className={clsx(
                            'font-medium',
                            entry.balance >= 0 ? 'text-green-400' : 'text-red-400'
                          )}>
                            {formatCurrency(Math.abs(entry.balance))}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                        No transactions found for the selected criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-700 rounded-full">
              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Select a Stakeholder</h3>
              <p className="text-gray-400 text-sm">
                Choose a stakeholder type and specific person to view their account statement
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountStatement;