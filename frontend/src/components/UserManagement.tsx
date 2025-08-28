import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Shield, User, Eye, EyeOff } from 'lucide-react';
import type { User, UserRole, PharmaUnit, Doctor, BusinessPartner, Distributor } from '../types';
import { ROLE_TEMPLATES, getAvailableRoles, isStakeholderRole } from '../utils/permissions';

interface UserManagementProps {
  currentUser: User;
  pharmaUnit?: PharmaUnit;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, pharmaUnit }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Mock data - replace with actual data fetching
  useEffect(() => {
    // Load users for current pharma unit
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'admin1',
        role: 'admin',
        name: 'John Admin',
        email: 'admin@qbpharma.com',
        phone: '+1234567890',
        pharmaUnitId: pharmaUnit?.id,
        pharmaUnitName: pharmaUnit?.name,
        permissions: ROLE_TEMPLATES.admin.defaultPermissions,
        isActive: true,
        createdBy: currentUser.id,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      // Add more mock users...
    ];
    setUsers(mockUsers);
  }, [pharmaUnit, currentUser]);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      const matchesActive = showInactive || user.isActive;
      
      return matchesSearch && matchesRole && matchesActive;
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole, showInactive]);

  const availableRoles = getAvailableRoles(currentUser.role);

  const getRoleDisplayInfo = (role: UserRole) => {
    const template = ROLE_TEMPLATES[role];
    const colors = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      operator: 'bg-green-100 text-green-800',
      doctor: 'bg-indigo-100 text-indigo-800',
      partner: 'bg-yellow-100 text-yellow-800',
      distributor: 'bg-pink-100 text-pink-800',
    };
    
    return {
      name: template.displayName,
      color: colors[role],
      requiresLinking: template.requiresLinking
    };
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowCreateModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleToggleActive = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage users for {pharmaUnit?.name || 'All Units'}
          </p>
        </div>
        <button
          onClick={handleCreateUser}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>
                {getRoleDisplayInfo(role).name}
              </option>
            ))}
          </select>

          {/* Show Inactive Toggle */}
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              showInactive ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300'
            }`}
          >
            {showInactive ? <Eye size={16} /> : <EyeOff size={16} />}
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </button>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Users ({filteredUsers.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const roleInfo = getRoleDisplayInfo(user.role);
                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleInfo.color}`}>
                        {roleInfo.name}
                      </span>
                      {roleInfo.requiresLinking && (
                        <div className="text-xs text-gray-500 mt-1">
                          {user.linkedStakeholderId ? '🔗 Linked' : '⚠️ Not Linked'}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(user.id)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
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

      {/* Create/Edit User Modal would go here */}
      {showCreateModal && (
        <CreateUserModal
          user={editingUser}
          availableRoles={availableRoles}
          pharmaUnit={pharmaUnit}
          onClose={() => setShowCreateModal(false)}
          onSave={(userData) => {
            if (editingUser) {
              setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData } : u));
            } else {
              const newUser: User = {
                id: Date.now().toString(),
                ...userData,
                pharmaUnitId: pharmaUnit?.id,
                pharmaUnitName: pharmaUnit?.name,
                permissions: ROLE_TEMPLATES[userData.role].defaultPermissions,
                isActive: true,
                createdBy: currentUser.id,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              setUsers(prev => [...prev, newUser]);
            }
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Create User Modal Component (simplified)
interface CreateUserModalProps {
  user: User | null;
  availableRoles: UserRole[];
  pharmaUnit?: PharmaUnit;
  onClose: () => void;
  onSave: (userData: Partial<User>) => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  user,
  availableRoles,
  pharmaUnit,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || availableRoles[0],
    linkedStakeholderId: user?.linkedStakeholderId || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const roleInfo = ROLE_TEMPLATES[formData.role];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {user ? 'Edit User' : 'Create New User'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {ROLE_TEMPLATES[role].displayName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {roleInfo.description}
            </p>
          </div>

          {roleInfo.requiresLinking && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to {formData.role === 'doctor' ? 'Doctor' : formData.role === 'partner' ? 'Business Partner' : 'Distributor'}
              </label>
              <select
                value={formData.linkedStakeholderId}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedStakeholderId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select {formData.role}...</option>
                {/* TODO: Load actual stakeholders based on role */}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                This user will only see data related to the selected {formData.role}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              {user ? 'Update' : 'Create'} User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;