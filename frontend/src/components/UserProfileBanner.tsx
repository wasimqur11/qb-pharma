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
    <div className={`${roleConfig.bgGradient} rounded-lg shadow-sm border border-gray-700/50 mb-4 overflow-hidden`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: User Info */}
          <div className="flex items-center space-x-3">
            {/* Compact Avatar */}
            <div className="h-10 w-10 rounded-lg bg-white bg-opacity-20 flex items-center justify-center border border-white border-opacity-30">
              <div className="scale-75">
                {roleConfig.icon}
              </div>
            </div>
            
            {/* User Details */}
            <div className="text-white">
              <h2 className="text-lg font-semibold leading-tight">{user.name}</h2>
              <p className="text-white text-opacity-80 text-xs">{roleConfig.title}</p>
            </div>
          </div>

          {/* Right: Status & Time */}
          <div className="flex items-center space-x-4">
            {/* Active Status */}
            <div className="flex items-center text-white text-opacity-90">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs font-medium hidden sm:inline">Active</span>
            </div>
            
            {/* Current Time - Hidden on mobile */}
            <div className="text-white text-opacity-80 text-xs font-mono hidden md:block">
              {currentTime}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileBanner;