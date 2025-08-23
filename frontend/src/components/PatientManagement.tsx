import React, { useState } from 'react';
import {
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CreditCardIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import type { Patient } from '../types';
import { useStakeholders } from '../contexts/StakeholderContext';
import clsx from 'clsx';

interface PatientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  emergencyContact: string;
  emergencyPhone: string;
  creditLimit: string;
  notes: string;
}

interface PatientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PatientFormData) => void;
  editData?: Patient | null;
  existingPatients: Patient[];
}

const PatientForm: React.FC<PatientFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData,
  existingPatients
}) => {
  const [formData, setFormData] = useState<PatientFormData>({
    name: editData?.name || '',
    email: editData?.email || '',
    phone: editData?.phone || '',
    address: editData?.address || '',
    dateOfBirth: editData?.dateOfBirth || '',
    emergencyContact: editData?.emergencyContact || '',
    emergencyPhone: editData?.emergencyPhone || '',
    creditLimit: editData?.creditLimit?.toString() || '0',
    notes: editData?.notes || ''
  });

  // Validation functions
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Patient name is required');
      return;
    }

    if (!formData.phone.trim()) {
      alert('Phone number is required');
      return;
    }

    // Email validation (if provided)
    if (formData.email && !validateEmail(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Phone validation
    if (!validateIndianMobile(formData.phone)) {
      alert('Please enter a valid Indian mobile number (10 digits starting with 6, 7, 8, or 9)');
      return;
    }

    // Emergency phone validation (if provided)
    if (formData.emergencyPhone && !validateIndianMobile(formData.emergencyPhone)) {
      alert('Please enter a valid emergency contact number');
      return;
    }

    // Credit limit validation
    const creditLimit = parseFloat(formData.creditLimit);
    if (isNaN(creditLimit) || creditLimit < 0) {
      alert('Please enter a valid credit limit (0 or greater)');
      return;
    }

    // Duplicate validation
    const nameExists = existingPatients.some(patient => 
      patient.name.toLowerCase().trim() === formData.name.toLowerCase().trim() && 
      (!editData || patient.id !== editData.id)
    );

    const phoneExists = existingPatients.some(patient => 
      patient.phone === formatIndianMobile(formData.phone) && 
      (!editData || patient.id !== editData.id)
    );

    if (nameExists) {
      alert(`A patient with the name "${formData.name}" already exists`);
      return;
    }

    if (phoneExists) {
      alert(`A patient with the phone number "${formData.phone}" already exists`);
      return;
    }

    // Format and submit
    const submissionData = {
      ...formData,
      phone: formatIndianMobile(formData.phone),
      emergencyPhone: formData.emergencyPhone ? formatIndianMobile(formData.emergencyPhone) : formData.emergencyPhone
    };

    onSubmit(submissionData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      emergencyContact: '',
      emergencyPhone: '',
      creditLimit: '0',
      notes: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-600 rounded-lg shadow-lg">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {editData ? 'Edit' : 'Add'} Patient
              </h2>
              <p className="text-xs text-gray-400">
                {editData ? 'Update' : 'Create new'} patient information with credit management
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="px-5 py-4 max-h-[calc(90vh-140px)] overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Patient Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  placeholder="Enter patient full name"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <PhoneIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    placeholder="9876543210 or +91 98765 43210"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    placeholder="patient@example.com"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <CalendarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none transition-colors"
                  rows={2}
                  placeholder="Enter patient address"
                />
              </div>

              {/* Emergency Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                  placeholder="Emergency contact person"
                />
              </div>

              {/* Emergency Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Emergency Contact Phone
                </label>
                <div className="relative">
                  <PhoneIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>

              {/* Credit Limit */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Credit Limit (INR) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
                    placeholder="Maximum credit amount allowed"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum amount the patient can owe on credit
                </p>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none transition-colors"
                  rows={3}
                  placeholder="Additional notes about the patient"
                />
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-700 bg-gray-750">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm"
              >
                {editData ? 'Update' : 'Add'} Patient
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const PatientManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const {
    patients,
    addPatient,
    updatePatient,
    deletePatient,
    togglePatientStatus
  } = useStakeholders();

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && patient.isActive) ||
      (statusFilter === 'inactive' && !patient.isActive);

    return matchesSearch && matchesStatus;
  });

  const handlePatientSubmit = (data: PatientFormData) => {
    if (editingPatient) {
      updatePatient(editingPatient.id, {
        ...data,
        creditLimit: parseFloat(data.creditLimit),
        email: data.email || undefined,
        address: data.address || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        emergencyContact: data.emergencyContact || undefined,
        emergencyPhone: data.emergencyPhone || undefined,
        notes: data.notes || undefined
      });
      setEditingPatient(null);
    } else {
      addPatient({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone,
        address: data.address || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        emergencyContact: data.emergencyContact || undefined,
        emergencyPhone: data.emergencyPhone || undefined,
        creditLimit: parseFloat(data.creditLimit),
        notes: data.notes || undefined,
        isActive: true
      });
    }
    setShowAddForm(false);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setShowAddForm(true);
  };

  const handleDelete = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    if (confirm(`Are you sure you want to delete patient "${patient.name}"? This action cannot be undone.`)) {
      deletePatient(patientId);
    }
  };

  const toggleActive = (patientId: string) => {
    togglePatientStatus(patientId);
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const getCreditStatus = (patient: Patient) => {
    const utilizationPercentage = patient.creditLimit > 0 ? (patient.currentCredit / patient.creditLimit) * 100 : 0;
    
    if (utilizationPercentage >= 90) return { color: 'text-red-400', label: 'Critical' };
    if (utilizationPercentage >= 70) return { color: 'text-orange-400', label: 'High' };
    if (utilizationPercentage >= 30) return { color: 'text-yellow-400', label: 'Medium' };
    return { color: 'text-green-400', label: 'Good' };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Patient Management</h2>
          <p className="text-gray-400 text-sm">Manage patient records and credit accounts</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Add Patient
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm w-full"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="all">All Patients</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          
          <div className="text-sm text-gray-400">
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
        </div>
      </div>

      {/* Patients Table */}
      {filteredPatients.length > 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Credit Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredPatients.map((patient) => {
                  const creditStatus = getCreditStatus(patient);
                  return (
                    <tr key={patient.id} className="hover:bg-gray-750 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-pink-600 rounded-lg">
                            <UserIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-300">{patient.name}</div>
                            {patient.dateOfBirth && (
                              <div className="text-xs text-gray-400">
                                DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <div>{patient.phone}</div>
                        {patient.email && (
                          <div className="text-xs text-gray-400">{patient.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300">
                              {formatCurrency(patient.currentCredit)} / {formatCurrency(patient.creditLimit)}
                            </span>
                            <span className={clsx('text-xs font-medium', creditStatus.color)}>
                              {creditStatus.label}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div 
                              className={clsx(
                                'h-1.5 rounded-full',
                                creditStatus.color.includes('red') ? 'bg-red-500' :
                                creditStatus.color.includes('orange') ? 'bg-orange-500' :
                                creditStatus.color.includes('yellow') ? 'bg-yellow-500' : 'bg-green-500'
                              )}
                              style={{ 
                                width: `${patient.creditLimit > 0 ? Math.min((patient.currentCredit / patient.creditLimit) * 100, 100) : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => toggleActive(patient.id)}
                          className={clsx(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors',
                            patient.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          )}
                        >
                          {patient.isActive ? (
                            <>
                              <CheckCircleIcon className="h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <ExclamationTriangleIcon className="h-3 w-3" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(patient)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(patient.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
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
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gray-700 rounded-full">
              <UserIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white">
              {searchTerm ? 'No results found' : 'No patients added yet'}
            </h3>
            <p className="text-gray-400 text-sm">
              {searchTerm 
                ? `No patients match "${searchTerm}"`
                : 'Get started by adding your first patient'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Add Patient
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-600 rounded-lg">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{patients.length}</p>
              <p className="text-xs text-gray-400">Total Patients</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <CheckCircleIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {patients.filter(p => p.isActive).length}
              </p>
              <p className="text-xs text-gray-400">Active Patients</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <CreditCardIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {formatCurrency(patients.reduce((sum, p) => sum + p.currentCredit, 0))}
              </p>
              <p className="text-xs text-gray-400">Total Credits Outstanding</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <ExclamationTriangleIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {patients.filter(p => p.isActive && p.currentCredit >= p.creditLimit * 0.9).length}
              </p>
              <p className="text-xs text-gray-400">High Credit Risk</p>
            </div>
          </div>
        </div>
      </div>

      <PatientForm
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingPatient(null);
        }}
        onSubmit={handlePatientSubmit}
        editData={editingPatient}
        existingPatients={patients}
      />
    </div>
  );
};

export default PatientManagement;