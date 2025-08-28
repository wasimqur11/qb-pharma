import React from 'react';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  BuildingOfficeIcon, 
  UsersIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const UserProfileBanner: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const getRoleConfig = () => {
    switch (user.role) {
      case 'super_admin': return {
        icon: <ShieldCheckIcon className="h-6 w-6 text-white" />,
        bgGradient: 'bg-gradient-to-r from-purple-600 to-purple-800',
        badge: 'bg-purple-100 text-purple-900 border-purple-200',
        title: 'Super Administrator',
        description: 'System-wide access & pharma unit management',
        accessLevel: 'Full System Access'
      };
      case 'admin': return {
        icon: <BuildingOfficeIcon className="h-6 w-6 text-white" />,
        bgGradient: 'bg-gradient-to-r from-red-600 to-red-800',
        badge: 'bg-red-100 text-red-900 border-red-200',
        title: 'Unit Administrator',
        description: 'Complete unit management & user administration',
        accessLevel: 'Full Unit Access'
      };
      case 'manager': return {
        icon: <UsersIcon className="h-6 w-6 text-white" />,
        bgGradient: 'bg-gradient-to-r from-blue-600 to-blue-800',
        badge: 'bg-blue-100 text-blue-900 border-blue-200',
        title: 'Department Manager',
        description: 'Department oversight & team management',
        accessLevel: 'Department Access'
      };
      case 'operator': return {
        icon: <UserIcon className="h-6 w-6 text-white" />,
        bgGradient: 'bg-gradient-to-r from-green-600 to-green-800',
        badge: 'bg-green-100 text-green-900 border-green-200',
        title: 'Data Entry Operator',
        description: 'Transaction processing & data management',
        accessLevel: 'Operational Access'
      };
      case 'doctor': return {
        icon: <UserIcon className="h-6 w-6 text-white" />,
        bgGradient: 'bg-gradient-to-r from-indigo-600 to-indigo-800',
        badge: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        title: 'Medical Professional',
        description: 'Consultation reports & commission tracking',
        accessLevel: 'Personal Account Access'
      };
      case 'partner': return {
        icon: <UsersIcon className="h-6 w-6 text-white" />,
        bgGradient: 'bg-gradient-to-r from-yellow-600 to-yellow-700',
        badge: 'bg-yellow-100 text-yellow-900 border-yellow-200',
        title: 'Business Partner',
        description: 'Profit sharing & settlement management',
        accessLevel: 'Partner Account Access'
      };
      case 'distributor': return {
        icon: <BuildingOfficeIcon className="h-6 w-6 text-white" />,
        bgGradient: 'bg-gradient-to-r from-pink-600 to-pink-800',
        badge: 'bg-pink-100 text-pink-900 border-pink-200',
        title: 'Distribution Partner',
        description: 'Purchase tracking & payment management',
        accessLevel: 'Distributor Account Access'
      };
      default: return {
        icon: <UserIcon className="h-6 w-6 text-white" />,
        bgGradient: 'bg-gradient-to-r from-gray-600 to-gray-800',
        badge: 'bg-gray-100 text-gray-900 border-gray-200',
        title: 'User',
        description: 'Basic system access',
        accessLevel: 'Limited Access'
      };
    }
  };

  const roleConfig = getRoleConfig();
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
      {/* Header Section with Gradient */}
      <div className={`${roleConfig.bgGradient} px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Professional Avatar */}
            <div className="h-14 w-14 rounded-full bg-white bg-opacity-20 flex items-center justify-center border-2 border-white border-opacity-30 backdrop-blur-sm">
              {roleConfig.icon}
            </div>
            
            {/* User Identity */}
            <div className="text-white">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-white text-opacity-90 text-sm">{user.email}</p>
            </div>
          </div>

          {/* Role Badge */}
          <div className="text-right">
            <span className={`inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg border-2 ${roleConfig.badge} shadow-sm`}>
              {roleConfig.title}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* Role Description */}
          <div className="flex-1">
            <p className="text-gray-700 font-medium text-sm">{roleConfig.description}</p>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center text-xs text-gray-500">
                <ClockIcon className="h-4 w-4 mr-1" />
                Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'First time'}
              </div>
              <div className="text-xs text-gray-500">
                Current time: {currentTime}
              </div>
            </div>
          </div>

          {/* Access Level Indicator */}
          <div className="text-right ml-6">
            <div className="inline-flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-gray-900">{roleConfig.accessLevel}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Active Session</p>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className={`h-1 ${roleConfig.bgGradient}`}></div>
    </div>
  );
};

export default UserProfileBanner;