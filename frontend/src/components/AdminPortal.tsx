import React, { useState, useEffect } from 'react';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CommandLineIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useConfiguration } from '../contexts/ConfigurationContext';
import type { TransactionShortcut } from '../contexts/ConfigurationContext';
import apiClient from '../utils/apiClient';
import type { User, UserRole, TransactionCategory } from '../types';

const AdminPortal: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'operator' as UserRole
  });

  // Tab state - default to 'users'
  const [activeAdminTab, setActiveAdminTab] = useState<'users' | 'shortcuts'>('users');

  // Shortcut configuration
  const {
    transactionShortcuts,
    addTransactionShortcut,
    updateTransactionShortcut,
    removeTransactionShortcut,
    resetShortcutsToDefault
  } = useConfiguration();

  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<TransactionShortcut | null>(null);
  const [shortcutForm, setShortcutForm] = useState({
    shortcut: '',
    category: 'pharmacy_sale' as TransactionCategory,
    label: ''
  });
  const [shortcutError, setShortcutError] = useState('');
  const [recordingShortcut, setRecordingShortcut] = useState(false);

  // Transaction categories for dropdown
  const transactionCategories: { value: TransactionCategory; label: string }[] = [
    { value: 'pharmacy_sale', label: 'Pharmacy Sale' },
    { value: 'consultation_fee', label: 'Consultation Fee' },
    { value: 'distributor_payment', label: 'Distributor Payment' },
    { value: 'medicine_purchase', label: 'Medicine Purchase' },
    { value: 'clinic_expense', label: 'Clinic Expense' },
    { value: 'employee_payment', label: 'Employee Payment' },
    { value: 'business_partner_investment', label: 'Business Partner Investment' },
    { value: 'doctor_expense', label: 'Doctor Expense' },
    { value: 'partner_withdrawal', label: 'Partner Withdrawal' },
    { value: 'sales_profit_distribution', label: 'Sales Profit Distribution' },
    { value: 'patient_credit_sale', label: 'Patient Credit Sale' },
    { value: 'patient_credit_payment', label: 'Patient Credit Payment' }
  ];

  const roles: { value: UserRole; label: string; color: string }[] = [
    { value: 'admin', label: 'Administrator', color: 'bg-red-900/80 text-red-200 border border-red-700/50' },
    { value: 'manager', label: 'Manager', color: 'bg-blue-900/80 text-blue-200 border border-blue-700/50' },
    { value: 'operator', label: 'Operator', color: 'bg-green-900/80 text-green-200 border border-green-700/50' },
    { value: 'doctor', label: 'Doctor', color: 'bg-purple-900/80 text-purple-200 border border-purple-700/50' },
    { value: 'partner', label: 'Business Partner', color: 'bg-yellow-900/80 text-yellow-200 border border-yellow-700/50' },
    { value: 'distributor', label: 'Distributor', color: 'bg-indigo-900/80 text-indigo-200 border border-indigo-700/50' }
  ];

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.isActive) ||
                           (statusFilter === 'inactive' && !user.isActive);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users');
      if (response.success) {
        setUsers(response.data?.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await apiClient.post('/api/auth/register', formData);
      if (response.success) {
        await loadUsers();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await apiClient.put(`/api/users/${selectedUser.id}`, formData);
      if (response.success) {
        await loadUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        resetForm();
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await apiClient.delete(`/api/users/${selectedUser.id}`);
      if (response.success) {
        await loadUsers();
        setShowDeleteModal(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const response = await apiClient.put(`/api/users/${user.id}`, {
        isActive: !user.isActive
      });
      if (response.success) {
        await loadUsers();
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'operator'
    });
  };

  // Shortcut management functions
  const resetShortcutForm = () => {
    setShortcutForm({
      shortcut: '',
      category: 'pharmacy_sale',
      label: ''
    });
    setShortcutError('');
    setRecordingShortcut(false);
  };

  const openAddShortcutModal = () => {
    resetShortcutForm();
    setEditingShortcut(null);
    setShowShortcutModal(true);
  };

  const openEditShortcutModal = (shortcut: TransactionShortcut) => {
    setEditingShortcut(shortcut);
    setShortcutForm({
      shortcut: shortcut.shortcut,
      category: shortcut.category,
      label: shortcut.label
    });
    setShortcutError('');
    setShowShortcutModal(true);
  };

  const handleSaveShortcut = () => {
    // Validation
    if (!shortcutForm.shortcut.trim()) {
      setShortcutError('Please record a keyboard shortcut');
      return;
    }
    if (!shortcutForm.label.trim()) {
      setShortcutError('Please enter a label for this shortcut');
      return;
    }

    if (editingShortcut) {
      // Update existing
      const success = updateTransactionShortcut(editingShortcut.id, shortcutForm);
      if (!success) {
        setShortcutError('This shortcut key is already in use');
        return;
      }
    } else {
      // Add new
      const success = addTransactionShortcut(shortcutForm);
      if (!success) {
        setShortcutError('This shortcut key is already in use');
        return;
      }
    }

    setShowShortcutModal(false);
    resetShortcutForm();
    setEditingShortcut(null);
  };

  const handleDeleteShortcut = (id: string) => {
    removeTransactionShortcut(id);
  };

  const handleRecordShortcut = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.preventDefault();

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    // Add the key (ignore modifier keys themselves)
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      parts.push(e.key.toUpperCase());
    }

    if (parts.length > 0 && !['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      setShortcutForm(prev => ({ ...prev, shortcut: parts.join('+') }));
      setRecordingShortcut(false);
      setShortcutError('');
    }
  };

  const getCategoryLabel = (category: TransactionCategory) => {
    const cat = transactionCategories.find(c => c.value === category);
    return cat?.label || category;
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      name: user.name,
      phone: user.phone || '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const getRoleInfo = (role: UserRole) => {
    return roles.find(r => r.value === role) || { value: role, label: role, color: 'bg-slate-900/80 text-slate-200 border border-slate-700/50' };
  };

  // Temporarily allow all authenticated users for testing
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-red-900">Please Login</h3>
          <p className="mt-1 text-sm text-red-500">You need to be logged in to access this portal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <ShieldCheckIcon className="h-8 w-8 mr-3 text-blue-400" />
            Admin Portal
          </h1>
          <p className="text-slate-400 mt-1">
            Manage system settings and users
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeAdminTab === 'users'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <UsersIcon className="h-5 w-5" />
          <span>User Management</span>
        </button>
        <button
          onClick={() => setActiveAdminTab('shortcuts')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
            activeAdminTab === 'shortcuts'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <CommandLineIcon className="h-5 w-5" />
          <span>Keyboard Shortcuts</span>
        </button>
      </div>

      {/* Users Tab Content */}
      {activeAdminTab === 'users' && (
        <div className="space-y-4">
          {/* Users Header */}
          <div className="flex justify-between items-center">
            <p className="text-slate-400">
              Manage system users and permissions ({filteredUsers.length} users)
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <UserPlusIcon className="h-5 w-5" />
              <span>Add User</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
                className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={loadUsers}
                disabled={loading}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-slate-400 text-sm">{user.email}</div>
                        <div className="text-slate-500 text-xs">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleInfo(user.role).color}`}>
                        {getRoleInfo(user.role).label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className={`text-sm ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Edit user"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          className="p-1 text-slate-400 hover:text-yellow-400 transition-colors"
                          title={user.isActive ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.isActive ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete user"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      )}

      {/* Shortcuts Tab Content */}
      {activeAdminTab === 'shortcuts' && (
        <div className="space-y-4">
          {/* Shortcuts Header */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-400">
                Configure keyboard shortcuts for quick transaction entry
              </p>
              <p className="text-slate-500 text-sm mt-1">
                Press the shortcut keys anywhere in the app to open the transaction form with the category pre-selected
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={resetShortcutsToDefault}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <ArrowPathIcon className="h-5 w-5" />
                <span>Reset to Default</span>
              </button>
              <button
                onClick={openAddShortcutModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Shortcut</span>
              </button>
            </div>
          </div>

          {/* Shortcuts Table */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Shortcut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Label</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Transaction Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {transactionShortcuts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        No shortcuts configured. Click "Add Shortcut" to create one.
                      </td>
                    </tr>
                  ) : (
                    transactionShortcuts.map((shortcut) => (
                      <tr key={shortcut.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <code className="bg-slate-900 text-cyan-400 px-2 py-1 rounded font-mono text-sm">
                            {shortcut.shortcut}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-white">
                          {shortcut.label}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/80 text-blue-200 border border-blue-700/50">
                            {getCategoryLabel(shortcut.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditShortcutModal(shortcut)}
                              className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                              title="Edit shortcut"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteShortcut(shortcut.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                              title="Delete shortcut"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Usage Tips */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <h3 className="text-white font-medium mb-3">Tips</h3>
            <ul className="text-slate-400 text-sm space-y-2">
              <li>• Press <code className="bg-slate-900 text-cyan-400 px-1 rounded">Ctrl+Enter</code> anywhere to open a blank transaction form</li>
              <li>• Shortcuts won't trigger when you're typing in input fields</li>
              <li>• Use <code className="bg-slate-900 text-cyan-400 px-1 rounded">Ctrl</code>, <code className="bg-slate-900 text-cyan-400 px-1 rounded">Shift</code>, or <code className="bg-slate-900 text-cyan-400 px-1 rounded">Alt</code> modifiers with number or letter keys</li>
              <li>• Each shortcut key combination must be unique</li>
            </ul>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Create New User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700">
            <div className="flex items-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">Delete User</h3>
            </div>

            <p className="text-slate-300 mb-6">
              Are you sure you want to delete <strong>{selectedUser.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Shortcut Modal */}
      {showShortcutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingShortcut ? 'Edit Shortcut' : 'Add New Shortcut'}
            </h3>

            <div className="space-y-4">
              {/* Shortcut Key Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Keyboard Shortcut
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={recordingShortcut ? 'Press keys...' : shortcutForm.shortcut}
                    onFocus={() => setRecordingShortcut(true)}
                    onBlur={() => setRecordingShortcut(false)}
                    onKeyDown={handleRecordShortcut}
                    readOnly
                    placeholder="Click and press shortcut keys"
                    className={`w-full px-3 py-2 bg-slate-900/50 border rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono ${
                      recordingShortcut ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-600'
                    }`}
                  />
                  {recordingShortcut && (
                    <div className="absolute right-3 top-2.5 text-blue-400 text-sm">
                      Recording...
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Click the field and press your desired shortcut keys (e.g., Ctrl+1, Ctrl+Shift+S)
                </p>
              </div>

              {/* Label Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Display Label
                </label>
                <input
                  type="text"
                  value={shortcutForm.label}
                  onChange={(e) => setShortcutForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Pharmacy Sale"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Transaction Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Transaction Type
                </label>
                <select
                  value={shortcutForm.category}
                  onChange={(e) => setShortcutForm(prev => ({ ...prev, category: e.target.value as TransactionCategory }))}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {transactionCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Error Message */}
              {shortcutError && (
                <div className="text-red-400 text-sm bg-red-900/20 border border-red-700/50 rounded-lg p-2">
                  {shortcutError}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowShortcutModal(false);
                  setEditingShortcut(null);
                  resetShortcutForm();
                }}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveShortcut}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingShortcut ? 'Save Changes' : 'Add Shortcut'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;