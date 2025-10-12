import React, { useState } from 'react';
import {
  UserGroupIcon,
  UsersIcon,
  TruckIcon,
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  DocumentArrowUpIcon,
  UserIcon,
  ArrowDownTrayIcon,
  CreditCardIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import type { Partner, Doctor, BusinessPartner, Employee, Distributor, Patient, StakeholderType } from '../types';
import { useStakeholders } from '../contexts/StakeholderContext';
import { useAuth } from '../contexts/AuthContext';
import StakeholderForm from './StakeholderForm';
import DistributorBulkUpload from './DistributorBulkUpload';
import clsx from 'clsx';
import * as XLSX from 'xlsx';

type StakeholderData = Partner | Doctor | BusinessPartner | Employee | Distributor | Patient;

interface TableColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: any) => React.ReactNode;
}

const StakeholderManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<StakeholderType>(user?.role === 'operator' ? 'distributor' : 'doctor');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const {
    doctors,
    businessPartners,
    employees,
    distributors,
    patients,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    addBusinessPartner,
    updateBusinessPartner,
    deleteBusinessPartner,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addDistributor,
    updateDistributor,
    deleteDistributor
  } = useStakeholders();

  const stakeholderData = {
    doctor: doctors,
    employee: employees,
    business_partner: businessPartners,
    distributor: distributors,
    patient: patients
  };

  const allStakeholderTypes = [
    { id: 'doctor', label: 'Doctors', icon: UserGroupIcon, color: 'text-green-400' },
    { id: 'business_partner', label: 'Business Partners', icon: UsersIcon, color: 'text-orange-400' },
    { id: 'employee', label: 'Employees', icon: UsersIcon, color: 'text-purple-400' },
    { id: 'distributor', label: 'Distributors', icon: TruckIcon, color: 'text-cyan-400' }
    // Removed patients - they have their own dedicated tab
  ];

  // Filter stakeholder types based on user role
  const stakeholderTypes = user?.role === 'operator' 
    ? allStakeholderTypes.filter(type => ['distributor'].includes(type.id)) // Operators only see distributors
    : allStakeholderTypes;

  const currentType = stakeholderTypes.find(t => t.id === activeTab);
  const currentData = (stakeholderData as any)[activeTab] || [];
  const filteredData = currentData.filter((item: any) => {
    // Safety check: ensure item and item.name exist
    if (!item || typeof item.name !== 'string') {
      console.warn('Invalid item in stakeholder data:', item);
      return false;
    }
    return item.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Reset to page 1 when tab changes or search term changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const handleStakeholderSubmit = async (data: any) => {
    try {
      if (editingItem) {
        // Update existing
        switch (activeTab) {
          case 'doctor':
            await updateDoctor(editingItem.id, data);
            break;
          case 'business_partner':
            await updateBusinessPartner(editingItem.id, data);
            break;
          case 'employee':
            await updateEmployee(editingItem.id, data);
            break;
          case 'distributor':
            await updateDistributor(editingItem.id, data);
            break;
        }
        setEditingItem(null);
        alert(`${currentType?.label.slice(0, -1)} updated successfully!`);
      } else {
        // Add new
        switch (activeTab) {
          case 'doctor':
            await addDoctor({
              name: data.name,
              email: data.email,
              phone: data.phone,
              consultationFee: parseFloat(data.consultationFee),
              commissionRate: parseFloat(data.commissionRate)
            });
            break;
          case 'business_partner':
            await addBusinessPartner({
              name: data.name,
              email: data.email,
              phone: data.phone,
              ownershipPercentage: parseFloat(data.ownershipPercentage)
            });
            break;
          case 'employee':
            const employeeData = {
              name: data.name,
              email: data.email,
              phone: data.phone,
              department: data.department,
              salary: parseFloat(data.salary),
              salaryDueDate: data.salaryDueDate,
              lastPaidDate: data.lastPaidDate || undefined,
              salaryFrequency: data.salaryFrequency as 'monthly' | 'bi-weekly' | 'weekly'
            };
            console.log('Adding employee with data:', employeeData);
            await addEmployee(employeeData);
            console.log('Employee added successfully');
            break;
          case 'distributor':
            await addDistributor({
              name: data.name,
            contactPerson: data.contactPerson,
            email: data.email,
            phone: data.phone,
            address: data.address,
            creditBalance: data.creditBalance ? parseFloat(data.creditBalance) : 0,
            initialBalanceDate: data.initialBalanceDate,
            paymentSchedule: data.paymentSchedule as 'weekly' | 'bi-weekly' | 'monthly',
            paymentPercentage: parseFloat(data.paymentPercentage),
            nextPaymentDue: data.nextPaymentDue,
            lastPaymentDate: data.lastPaymentDate || undefined
            });
            break;
        }
        alert(`${currentType?.label.slice(0, -1)} added successfully!`);
      }
      setShowAddForm(false);
    } catch (error: any) {
      console.error('Error saving stakeholder:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save stakeholder';
      alert(`Error: ${errorMessage}. Please try again.`);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        switch (activeTab) {
          case 'doctor':
            await deleteDoctor(itemId);
            break;
          case 'business_partner':
            await deleteBusinessPartner(itemId);
            break;
          case 'employee':
            await deleteEmployee(itemId);
            break;
          case 'distributor':
            await deleteDistributor(itemId);
            break;
        }
      } catch (error) {
        console.error('Error deleting stakeholder:', error);
        alert('Failed to delete stakeholder. Please try again.');
      }
    }
  };


  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  // Calculate distributor summary metrics
  const getDistributorSummary = () => {
    try {
      if (activeTab !== 'distributor' || !distributors || !distributors.length) return null;

      const totalCreditBalance = distributors.reduce((sum, d) => sum + (Number(d.creditBalance) || 0), 0);
      const totalDistributors = distributors.length;
      const avgCreditBalance = totalDistributors > 0 ? totalCreditBalance / totalDistributors : 0;

      // Count upcoming payments (within 7 days)
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);

      const upcomingPayments = distributors.filter(d => {
        if (!d.nextPaymentDue) return false;
        try {
          const dueDate = new Date(d.nextPaymentDue);
          return !isNaN(dueDate.getTime()) && dueDate >= today && dueDate <= sevenDaysFromNow;
        } catch {
          return false;
        }
      }).length;

      return {
        totalCreditBalance: isNaN(totalCreditBalance) ? 0 : totalCreditBalance,
        totalDistributors,
        avgCreditBalance: isNaN(avgCreditBalance) ? 0 : avgCreditBalance,
        upcomingPayments
      };
    } catch (error) {
      console.error('Error calculating distributor summary:', error);
      return null;
    }
  };

  // Download distributor list as Excel
  const downloadDistributorExcel = () => {
    if (activeTab !== 'distributor' || !distributors.length) return;

    const excelData = filteredData.map((d: any) => ({
      'Company Name': d.name,
      'Contact Person': d.contactPerson,
      'Email': d.email,
      'Phone': d.phone,
      'Address': d.address,
      'Credit Balance': d.creditBalance || 0,
      'Payment Schedule': d.paymentSchedule,
      'Payment Percentage': d.paymentPercentage,
      'Next Payment Due': d.nextPaymentDue ? new Date(d.nextPaymentDue).toLocaleDateString() : 'NA',
      'Last Payment Date': d.lastPaymentDate ? new Date(d.lastPaymentDate).toLocaleDateString() : 'NA',
      'Created At': new Date(d.createdAt).toLocaleDateString()
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Distributors');

    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Company Name
      { wch: 20 }, // Contact Person
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 40 }, // Address
      { wch: 15 }, // Credit Balance
      { wch: 15 }, // Payment Schedule
      { wch: 18 }, // Payment Percentage
      { wch: 18 }, // Next Payment Due
      { wch: 18 }, // Last Payment Date
      { wch: 15 }  // Created At
    ];
    ws['!cols'] = columnWidths;

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `distributors_list_${timestamp}.xlsx`);
  };

  const getTableColumns = (type: string): TableColumn[] => {
    switch (type) {
      case 'doctor':
        return [
          { key: 'name', label: 'Doctor Name', width: 'w-48' },
          { key: 'email', label: 'Email', width: 'w-56' },
          { key: 'phone', label: 'Phone', width: 'w-40' },
          { key: 'consultationFee', label: 'Consultation Fee', render: (value: number) => formatCurrency(value), width: 'w-32' },
          { key: 'commissionRate', label: 'Commission %', render: (value: number) => `${value}%`, width: 'w-28' },
        ];
      case 'employee':
        return [
          { key: 'name', label: 'Employee Name', width: 'w-40' },
          { key: 'email', label: 'Email', width: 'w-48' },
          { key: 'phone', label: 'Phone', width: 'w-32' },
          { key: 'department', label: 'Department', width: 'w-28' },
          { key: 'salary', label: 'Monthly Salary', render: (value: number) => formatCurrency(value), width: 'w-28' },
          { key: 'salaryDueDate', label: 'Next Due Date', render: (value: string) => new Date(value).toLocaleDateString(), width: 'w-28' },
          { key: 'lastPaidDate', label: 'Last Paid', render: (value: string) => value ? new Date(value).toLocaleDateString() : 'NA', width: 'w-28' },
          { key: 'salaryFrequency', label: 'Frequency', render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1), width: 'w-24' },
        ];
      case 'business_partner':
        return [
          { key: 'name', label: 'Partner Name', width: 'w-48' },
          { key: 'email', label: 'Email', width: 'w-56' },
          { key: 'phone', label: 'Phone', width: 'w-40' },
          { key: 'ownershipPercentage', label: 'Ownership %', render: (value: number) => `${value}%`, width: 'w-28' },
        ];
      case 'distributor':
        return [
          { key: 'name', label: 'Company Name', width: 'w-40' },
          { key: 'contactPerson', label: 'Contact Person', width: 'w-32' },
          { key: 'email', label: 'Email', width: 'w-48' },
          { key: 'phone', label: 'Phone', width: 'w-32' },
          { key: 'address', label: 'Address', width: 'w-48', render: (value: string) => (
            <div className="truncate max-w-xs" title={value}>
              {value}
            </div>
          )},
          { key: 'creditBalance', label: 'Credit Balance', render: (value: number) => value ? formatCurrency(value) : 'NA', width: 'w-28' },
          { key: 'paymentSchedule', label: 'Pay Schedule', render: (value: string) => value.charAt(0).toUpperCase() + value.slice(1), width: 'w-24' },
          { key: 'paymentPercentage', label: 'Pay %', render: (value: number) => `${value}%`, width: 'w-16' },
          { key: 'nextPaymentDue', label: 'Next Due', render: (value: string) => new Date(value).toLocaleDateString(), width: 'w-24' },
          { key: 'lastPaymentDate', label: 'Last Paid', render: (value: string) => value ? new Date(value).toLocaleDateString() : 'NA', width: 'w-24' },
        ];
      case 'patient':
        return [
          { key: 'name', label: 'Patient Name', width: 'w-48' },
          { key: 'phone', label: 'Phone', width: 'w-40' },
          { key: 'email', label: 'Email', width: 'w-56', render: (value: string) => value || 'NA' },
          { key: 'creditLimit', label: 'Credit Limit', render: (value: number) => formatCurrency(value), width: 'w-32' },
          { key: 'currentCredit', label: 'Current Credit', render: (value: number) => formatCurrency(value), width: 'w-32' },
          { key: 'isActive', label: 'Status', width: 'w-24', render: (value: boolean) => (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {value ? 'Active' : 'Inactive'}
            </span>
          )},
        ];
      default:
        return [];
    }
  };

  const StakeholderTable: React.FC<{ data: StakeholderData[]; type: string }> = ({ data, type }) => {
    const columns = getTableColumns(type);

    // Safety check
    if (!data || !Array.isArray(data)) {
      console.error('Invalid data passed to StakeholderTable:', data);
      return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <p className="text-red-400">Error loading table data. Please refresh the page.</p>
        </div>
      );
    }

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${type === 'distributor' ? 'min-w-[1200px]' : 'min-w-[700px]'}`}>
            <thead className="bg-gray-750">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className={`px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${col.width || ''}`}>
                    <span className="hidden sm:inline">{col.label}</span>
                    <span className="sm:hidden">{col.label.length > 8 ? col.label.substring(0, 8) + '...' : col.label}</span>
                  </th>
                ))}
                <th className="px-2 sm:px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <span className="hidden sm:inline">Actions</span>
                  <span className="sm:hidden">Act</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {data.map((item) => {
                if (!item || !item.id) {
                  console.error('Invalid item in table data:', item);
                  return null;
                }
                return (
                  <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                    {columns.map(col => (
                      <td key={col.key} className={`px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-300 ${col.key === 'address' ? '' : 'whitespace-nowrap'} ${col.width || ''}`}>
                        {col.render ? col.render((item as any)[col.key]) : (item as any)[col.key]}
                      </td>
                    ))}
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Stakeholder Management</h2>
          <p className="text-gray-400 text-sm">Manage all business partners, doctors, employees, and distributors</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {activeTab === 'distributor' && (
            <>
              <button
                onClick={downloadDistributorExcel}
                disabled={!distributors.length}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                title="Download Excel"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Download Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
              >
                <DocumentArrowUpIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Bulk Upload</span>
                <span className="sm:hidden">Upload</span>
              </button>
            </>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Add {currentType?.label.slice(0, -1)}</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <div className="overflow-x-auto scrollbar-hide">
          <nav className="flex gap-0 sm:gap-1 min-w-max pb-px w-full">
            {stakeholderTypes.map(type => {
              const Icon = type.icon;
              const mobileLabels = {
                'doctor': 'Doctors',
                'business_partner': 'Partners',
                'employee': 'Employees',
                'distributor': 'Distributors',
                'patient': 'Patients'
              };
              return (
                <button
                  key={type.id}
                  onClick={() => setActiveTab(type.id as any)}
                  className={clsx(
                    'flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex-shrink-0 min-w-0',
                    activeTab === type.id
                      ? 'border-blue-500 text-blue-400 bg-gray-800/50'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  )}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Icon className={clsx('h-3 w-3 sm:h-4 sm:w-4', activeTab === type.id ? type.color : 'text-gray-500')} />
                    <span className="hidden sm:inline whitespace-nowrap">{type.label}</span>
                    <span className="sm:hidden text-xs font-medium">{mobileLabels[type.id as keyof typeof mobileLabels]}</span>
                  </div>
                  <span className="px-1 sm:px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs leading-none">
                    {(stakeholderData as any)[type.id]?.length || 0}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Distributor Summary - Only shown for distributor tab */}
      {activeTab === 'distributor' && (() => {
        const summary = getDistributorSummary();
        if (!summary) return null;

        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Credit Balance */}
            <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-600/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-red-300 font-medium uppercase tracking-wider mb-1">Total Credit Balance</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalCreditBalance)}</p>
                  <p className="text-xs text-red-400 mt-1">Amount we owe</p>
                </div>
                <div className="p-2 bg-red-600/30 rounded-lg">
                  <CreditCardIcon className="h-5 w-5 text-red-400" />
                </div>
              </div>
            </div>

            {/* Total Distributors */}
            <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-600/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-cyan-300 font-medium uppercase tracking-wider mb-1">Total Distributors</p>
                  <p className="text-2xl font-bold text-white">{summary.totalDistributors}</p>
                  <p className="text-xs text-cyan-400 mt-1">Active partners</p>
                </div>
                <div className="p-2 bg-cyan-600/30 rounded-lg">
                  <TruckIcon className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
            </div>

            {/* Average Credit Balance */}
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-600/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-purple-300 font-medium uppercase tracking-wider mb-1">Avg Credit Balance</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(summary.avgCreditBalance)}</p>
                  <p className="text-xs text-purple-400 mt-1">Per distributor</p>
                </div>
                <div className="p-2 bg-purple-600/30 rounded-lg">
                  <CreditCardIcon className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Upcoming Payments */}
            <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-600/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-orange-300 font-medium uppercase tracking-wider mb-1">Upcoming Payments</p>
                  <p className="text-2xl font-bold text-white">{summary.upcomingPayments}</p>
                  <p className="text-xs text-orange-400 mt-1">Due within 7 days</p>
                </div>
                <div className="p-2 bg-orange-600/30 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-orange-400" />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 sm:flex-initial">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${currentType?.label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full sm:w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>Showing {filteredData.length} of {currentData.length || 0} {currentType?.label.toLowerCase()}</span>
        </div>
      </div>

      {/* Stakeholder Table */}
      {filteredData.length > 0 ? (
        <>
          <StakeholderTable data={paginatedData} type={activeTab} />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
              {/* Items per page selector */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-gray-700 border border-gray-600 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-gray-400">per page</span>
              </div>

              {/* Page info and navigation */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = page === 1 ||
                                      page === totalPages ||
                                      (page >= currentPage - 1 && page <= currentPage + 1);

                      const showEllipsis = (page === currentPage - 2 && currentPage > 3) ||
                                          (page === currentPage + 2 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return <span key={page} className="px-2 text-gray-500">...</span>;
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={clsx(
                            'min-w-[32px] h-8 px-2 rounded text-sm font-medium transition-colors',
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700'
                          )}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next page"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gray-700 rounded-full">
              {currentType && <currentType.icon className="h-6 w-6 text-gray-400" />}
            </div>
            <h3 className="text-lg font-medium text-white">
              {searchTerm ? 'No results found' : `No ${currentType?.label.toLowerCase()} added yet`}
            </h3>
            <p className="text-gray-400 text-sm">
              {searchTerm 
                ? `No ${currentType?.label.toLowerCase()} match "${searchTerm}"`
                : `Get started by adding your first ${currentType?.label.slice(0, -1).toLowerCase()}`
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Add {currentType?.label.slice(0, -1)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {stakeholderTypes.map(type => {
          const Icon = type.icon;
          return (
            <div key={type.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="p-2 bg-gray-700 rounded-lg self-start sm:self-auto">
                  <Icon className={clsx('h-3 w-3 sm:h-4 sm:w-4', type.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{(stakeholderData as any)[type.id]?.length || 0}</p>
                  <p className="text-xs text-gray-400 truncate">{type.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <StakeholderForm
        isOpen={showAddForm || editingItem !== null}
        onClose={() => {
          setShowAddForm(false);
          setEditingItem(null);
        }}
        onSubmit={handleStakeholderSubmit}
        type={activeTab}
        editData={editingItem}
        existingStakeholders={currentData}
      />

      <DistributorBulkUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
      />
    </div>
  );
};

export default StakeholderManagement;