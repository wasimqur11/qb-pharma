import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const roleConfigs: Record<string, {
  icon: React.ReactNode;
  bgGradient: string;
  title: string;
}> = {
  super_admin: {
    icon: <ShieldCheckIcon className="h-6 w-6 text-white" />,
    bgGradient: 'bg-gradient-to-r from-purple-600 to-purple-800',
    title: 'Super Administrator',
  },
  admin: {
    icon: <BuildingOfficeIcon className="h-6 w-6 text-white" />,
    bgGradient: 'bg-gradient-to-r from-red-600 to-red-800',
    title: 'Unit Administrator',
  },
  manager: {
    icon: <UsersIcon className="h-6 w-6 text-white" />,
    bgGradient: 'bg-gradient-to-r from-blue-600 to-blue-800',
    title: 'Department Manager',
  },
  operator: {
    icon: <UserIcon className="h-6 w-6 text-white" />,
    bgGradient: 'bg-gradient-to-r from-green-600 to-green-800',
    title: 'Data Entry Operator',
  },
  doctor: {
    icon: <UserIcon className="h-6 w-6 text-white" />,
    bgGradient: 'bg-gradient-to-r from-indigo-600 to-indigo-800',
    title: 'Medical Professional',
  },
  partner: {
    icon: <UsersIcon className="h-6 w-6 text-white" />,
    bgGradient: 'bg-gradient-to-r from-yellow-600 to-yellow-700',
    title: 'Business Partner',
  },
  distributor: {
    icon: <BuildingOfficeIcon className="h-6 w-6 text-white" />,
    bgGradient: 'bg-gradient-to-r from-pink-600 to-pink-800',
    title: 'Distribution Partner',
  },
};

const defaultRoleConfig = {
  icon: <UserIcon className="h-6 w-6 text-white" />,
  bgGradient: 'bg-gradient-to-r from-gray-600 to-gray-800',
  title: 'User',
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const UserProfileBanner: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(formatTime(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!user) return null;

  const roleConfig = (user.role && roleConfigs[user.role]) ?? defaultRoleConfig;

  return (
    <div className={`${roleConfig.bgGradient} rounded-lg shadow-sm border border-gray-700/50 mb-4 overflow-hidden`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: User Info */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-white bg-opacity-20 flex items-center justify-center border border-white border-opacity-30">
              <div className="scale-75">
                {roleConfig.icon}
              </div>
            </div>
            <div className="text-white">
              <h2 className="text-lg font-semibold leading-tight">{user.name}</h2>
              <p className="text-white text-opacity-80 text-xs">{roleConfig.title}</p>
            </div>
          </div>

          {/* Right: Status & Time */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-white text-opacity-90">
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              <span className="text-xs font-medium hidden sm:inline">Active</span>
            </div>
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
