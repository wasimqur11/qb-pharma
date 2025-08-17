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
  UserIcon
} from '@heroicons/react/24/outline';
import type { Partner, Doctor, BusinessPartner, Employee, Distributor, Patient, StakeholderType } from '../types';
import { useStakeholders } from '../contexts/StakeholderContext';
import StakeholderForm from './StakeholderForm';
import BulkUpload from './BulkUpload';
import clsx from 'clsx';

type StakeholderData = Partner | Doctor | BusinessPartner | Employee | Distributor | Patient;

interface TableColumn {
  key: string;
  label: string;
  width?: string;
  render?: (value: any) => React.ReactNode;
}

const StakeholderManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StakeholderType>('doctor');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
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

  const stakeholderTypes = [
    { id: 'doctor', label: 'Doctors', icon: UserGroupIcon, color: 'text-green-400' },
    { id: 'business_partner', label: 'Business Partners', icon: UsersIcon, color: 'text-orange-400' },
    { id: 'employee', label: 'Employees', icon: UsersIcon, color: 'text-purple-400' },
    { id: 'distributor', label: 'Distributors', icon: TruckIcon, color: 'text-cyan-400' },
    { id: 'patient', label: 'Patients', icon: UserIcon, color: 'text-pink-400' }
  ];

  const currentType = stakeholderTypes.find(t => t.id === activeTab);
  const currentData = (stakeholderData as any)[activeTab] || [];
  const filteredData = currentData.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStakeholderSubmit = (data: any) => {
    if (editingItem) {
      // Update existing
      switch (activeTab) {
        case 'doctor':
          updateDoctor(editingItem.id, data);
          break;
        case 'business_partner':
          updateBusinessPartner(editingItem.id, data);
          break;
        case 'employee':
          updateEmployee(editingItem.id, data);
          break;
        case 'distributor':
          updateDistributor(editingItem.id, data);
          break;
      }
      setEditingItem(null);
    } else {
      // Add new
      switch (activeTab) {
        case 'doctor':
          addDoctor({
            name: data.name,
            email: data.email,
            phone: data.phone,
            consultationFee: parseFloat(data.consultationFee),
            commissionRate: parseFloat(data.commissionRate)
          });
          break;
        case 'business_partner':
          addBusinessPartner({
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
          addEmployee(employeeData);
          console.log('Employee added successfully');
          break;
        case 'distributor':
          addDistributor({
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
    }
    setShowAddForm(false);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDelete = (itemId: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      switch (activeTab) {
        case 'doctor':
          deleteDoctor(itemId);
          break;
        case 'business_partner':
          deleteBusinessPartner(itemId);
          break;
        case 'employee':
          deleteEmployee(itemId);
          break;
        case 'distributor':
          deleteDistributor(itemId);
          break;
      }
    }
  };

  const handleBulkUpload = (uploadedData: any[]) => {
    // Validation functions (same as in StakeholderForm)
    const validateEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const validateIndianMobile = (phone: string): boolean => {
      const cleanPhone = phone.replace(/[\s\-\+]/g, '');
      const mobileRegex = /^(?:91)?[6-9]\d{9}$/;
      return mobileRegex.test(cleanPhone);
    };

    const formatIndianMobile = (phone: string): string => {
      const cleaned = phone.replace(/[^\d+]/g, '');
      if (cleaned.startsWith('+91') && cleaned.length === 13) {
        return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
      } else if (cleaned.startsWith('91') && cleaned.length === 12) {
        return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
      } else if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
      }
      return phone;
    };

    // Validate email and phone formats
    const invalidEmails: string[] = [];
    const invalidPhones: string[] = [];
    const duplicateNames: string[] = [];
    const duplicateEmails: string[] = [];
    
    uploadedData.forEach(item => {
      // Format validation
      if (item.email && !validateEmail(item.email)) {
        invalidEmails.push(item.email);
      }
      if (item.phone && !validateIndianMobile(item.phone)) {
        invalidPhones.push(item.phone);
      }

      // Check against existing data
      const nameExists = currentData.some(existing => 
        existing.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      );
      const emailExists = currentData.some(existing => 
        existing.email.toLowerCase().trim() === item.email.toLowerCase().trim()
      );
      
      if (nameExists) duplicateNames.push(item.name);
      if (emailExists) duplicateEmails.push(item.email);
    });
    
    if (invalidEmails.length > 0 || invalidPhones.length > 0 || duplicateNames.length > 0 || duplicateEmails.length > 0) {
      let errorMessage = 'Upload failed due to validation errors:\n';
      
      if (invalidEmails.length > 0) {
        errorMessage += `\nInvalid email addresses: ${invalidEmails.join(', ')}`;
      }
      if (invalidPhones.length > 0) {
        errorMessage += `\nInvalid phone numbers: ${invalidPhones.join(', ')}`;
        errorMessage += '\n(Must be Indian mobile numbers: 10 digits starting with 6,7,8,9)';
      }
      if (duplicateNames.length > 0) {
        errorMessage += `\nNames already exist: ${duplicateNames.join(', ')}`;
      }
      if (duplicateEmails.length > 0) {
        errorMessage += `\nEmails already exist: ${duplicateEmails.join(', ')}`;
      }
      errorMessage += '\n\nPlease correct these issues and try again.';
      alert(errorMessage);
      return;
    }
    
    // Process and add items using context
    uploadedData.forEach(item => {
      const processedItem = {
        ...item,
        phone: item.phone ? formatIndianMobile(item.phone) : item.phone
      };

      switch (activeTab) {
        case 'distributor':
          addDistributor({
            name: processedItem.name,
            contactPerson: processedItem.contactPerson,
            email: processedItem.email,
            phone: processedItem.phone,
            address: processedItem.address,
            creditBalance: processedItem.creditBalance ? parseFloat(processedItem.creditBalance) : 0,
            initialBalanceDate: processedItem.initialBalanceDate,
            paymentSchedule: processedItem.paymentSchedule || 'weekly',
            paymentPercentage: processedItem.paymentPercentage ? parseFloat(processedItem.paymentPercentage) : 10,
            nextPaymentDue: processedItem.nextPaymentDue || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 7 days from now
            lastPaymentDate: processedItem.lastPaymentDate || undefined
          });
          break;
        // Add other stakeholder types if needed for bulk upload in future
      }
    });
    
    setShowBulkUpload(false);
    alert(`Successfully uploaded ${uploadedData.length} ${currentType?.label.toLowerCase()}`);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

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
    
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${type === 'distributor' ? 'min-w-[1400px]' : 'min-w-[800px]'}`}>
            <thead className="bg-gray-750">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${col.width || ''}`}>
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-750 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 py-3 text-sm text-gray-300 ${col.key === 'address' ? '' : 'whitespace-nowrap'} ${col.width || ''}`}>
                      {col.render ? col.render((item as any)[col.key]) : (item as any)[col.key]}
                    </td>
                  ))}
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Stakeholder Management</h2>
          <p className="text-gray-400 text-sm">Manage all business partners, doctors, employees, and distributors</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'distributor' && (
            <button
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              <DocumentArrowUpIcon className="h-4 w-4" />
              Bulk Upload
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Add {currentType?.label.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-1">
          {stakeholderTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id as any)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === type.id
                    ? 'border-blue-500 text-blue-400 bg-gray-800/50'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                )}
              >
                <Icon className={clsx('h-4 w-4', activeTab === type.id ? type.color : 'text-gray-500')} />
                {type.label}
                <span className="ml-1 px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full text-xs">
                  {(stakeholderData as any)[type.id]?.length || 0}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${currentType?.label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>Showing {filteredData.length} of {currentData.length || 0} {currentType?.label.toLowerCase()}</span>
        </div>
      </div>

      {/* Stakeholder Table */}
      {filteredData.length > 0 ? (
        <StakeholderTable data={filteredData} type={activeTab} />
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stakeholderTypes.map(type => {
          const Icon = type.icon;
          return (
            <div key={type.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <Icon className={clsx('h-4 w-4', type.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{(stakeholderData as any)[type.id]?.length || 0}</p>
                  <p className="text-xs text-gray-400">{type.label}</p>
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

      <BulkUpload
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onUpload={handleBulkUpload}
        uploadType="distributors"
      />
    </div>
  );
};

export default StakeholderManagement;