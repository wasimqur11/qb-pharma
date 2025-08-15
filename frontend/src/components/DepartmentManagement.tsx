import React, { useState } from 'react';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import type { Department } from '../types';
import { useConfiguration } from '../contexts/ConfigurationContext';
import clsx from 'clsx';

interface DepartmentFormData {
  name: string;
  description: string;
}

interface DepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => void;
  editData?: Department | null;
  existingDepartments: Department[];
}

const DepartmentForm: React.FC<DepartmentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editData,
  existingDepartments
}) => {
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: editData?.name || '',
    description: editData?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Department name is required');
      return;
    }

    // Check for duplicate names
    const nameExists = existingDepartments.some(dept => 
      dept.name.toLowerCase().trim() === formData.name.toLowerCase().trim() && 
      (!editData || dept.id !== editData.id)
    );

    if (nameExists) {
      alert(`A department with the name "${formData.name}" already exists`);
      return;
    }

    onSubmit(formData);
    setFormData({ name: '', description: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700 bg-gray-750">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <BuildingOfficeIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {editData ? 'Edit' : 'Add'} Department
              </h2>
              <p className="text-xs text-gray-400">
                {editData ? 'Update' : 'Create new'} department information
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Department Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter department name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              {editData ? 'Update' : 'Add'} Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DepartmentManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const { 
    departments, 
    addDepartment, 
    updateDepartment, 
    deleteDepartment, 
    toggleDepartmentStatus 
  } = useConfiguration();

  const filteredDepartments = departments.filter(dept => 
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDepartmentSubmit = (data: DepartmentFormData) => {
    if (editingDepartment) {
      updateDepartment(editingDepartment.id, data);
      setEditingDepartment(null);
    } else {
      addDepartment({
        name: data.name,
        description: data.description,
        isActive: true
      });
    }
    setShowAddForm(false);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setShowAddForm(true);
  };

  const handleDelete = (departmentId: string) => {
    const department = departments.find(d => d.id === departmentId);
    if (!department) return;

    if (confirm(`Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`)) {
      deleteDepartment(departmentId);
    }
  };

  const toggleActive = (departmentId: string) => {
    toggleDepartmentStatus(departmentId);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Department Management</h2>
          <p className="text-gray-400 text-sm">Configure and manage organizational departments</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-64"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>Showing {filteredDepartments.length} of {departments.length} departments</span>
        </div>
      </div>

      {/* Departments Table */}
      {filteredDepartments.length > 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredDepartments.map((department) => (
                  <tr key={department.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-300">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <BuildingOfficeIcon className="h-4 w-4 text-white" />
                        </div>
                        {department.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      <div className="max-w-xs truncate" title={department.description || ''}>
                        {department.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => toggleActive(department.id)}
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors',
                          department.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        )}
                      >
                        {department.isActive ? (
                          <>
                            <CheckIcon className="h-3 w-3" />
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
                      {department.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(department)}
                          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(department.id)}
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
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-gray-700 rounded-full">
              <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white">
              {searchTerm ? 'No results found' : 'No departments configured yet'}
            </h3>
            <p className="text-gray-400 text-sm">
              {searchTerm 
                ? `No departments match "${searchTerm}"`
                : 'Get started by adding your first department'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Add Department
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BuildingOfficeIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{departments.length}</p>
              <p className="text-xs text-gray-400">Total Departments</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <CheckIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {departments.filter(d => d.isActive).length}
              </p>
              <p className="text-xs text-gray-400">Active Departments</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <ExclamationTriangleIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {departments.filter(d => !d.isActive).length}
              </p>
              <p className="text-xs text-gray-400">Inactive Departments</p>
            </div>
          </div>
        </div>
      </div>

      <DepartmentForm
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setEditingDepartment(null);
        }}
        onSubmit={handleDepartmentSubmit}
        editData={editingDepartment}
        existingDepartments={departments}
      />
    </div>
  );
};

export default DepartmentManagement;