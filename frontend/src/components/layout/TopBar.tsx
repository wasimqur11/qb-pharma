import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CreditCardIcon,
  UserIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import qbLogo from '../../assets/qblogo.png';

interface TopBarProps {
  unreadCount: number;
  onNotificationsClick: () => void;
  onAddTransaction: () => void;
  onProcessPayments: () => void;
  onProfileSettings: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  unreadCount,
  onNotificationsClick,
  onAddTransaction,
  onProcessPayments,
  onProfileSettings
}) => {
  const { isCollapsed, openMobile } = useSidebar();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  return (
    <header className={clsx(
      'bg-gray-900 border-b border-gray-700 sticky top-0 z-30 transition-all duration-300',
      'lg:ml-0' // The margin is handled by the sidebar spacer
    )}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={openMobile}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
              title="Open Navigation Menu"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Mobile Logo */}
            <div className="flex items-center gap-3 lg:hidden">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src={qbLogo} alt="QB Pharmacy" className="h-8 w-8 object-contain" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-semibold text-white">QB Pharmacy</h1>
              </div>
            </div>

            {/* Desktop Title (shows when sidebar is collapsed) */}
            {isCollapsed && (
              <div className="hidden lg:flex items-center gap-3">
                <h1 className="text-base font-semibold text-white">QB Pharmacy Management</h1>
              </div>
            )}
          </div>

          {/* Right Section - Actions & User */}
          <div className="flex items-center gap-3">
            {/* Quick Actions - Desktop */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={onAddTransaction}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                title="Add new financial transaction (Ctrl+Enter)"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden xl:inline">Add Transaction</span>
                <span className="xl:hidden">Add</span>
                <span className="hidden 2xl:inline text-xs text-blue-200 ml-1">(Ctrl+Enter)</span>
              </button>

              {user?.role !== 'operator' && (
                <button
                  onClick={onProcessPayments}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                  title="Process stakeholder payments"
                >
                  <CreditCardIcon className="h-4 w-4" />
                  <span className="hidden xl:inline">Process Payments</span>
                  <span className="xl:hidden">Pay</span>
                </button>
              )}
            </div>

            {/* Search - Hidden on small screens */}
            <div className="hidden md:block relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                aria-label="Search transactions, stakeholders, and records"
                title="Search transactions, stakeholders, and records"
                className="pl-9 pr-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-40 lg:w-48 xl:w-56"
              />
            </div>

            {/* Notifications */}
            <button
              onClick={onNotificationsClick}
              className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
              title={`View notifications and alerts${unreadCount > 0 ? ` (${unreadCount} new)` : ''}`}
            >
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="relative pl-2 border-l border-gray-600 user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-label="User account menu"
                className="flex items-center gap-2 p-1 hover:bg-gray-700 rounded-md transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-400 hidden sm:block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <div className="p-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                    <p className="text-xs text-blue-400 mt-1">{user?.role?.replace('_', ' ')}</p>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onProfileSettings();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Cog6ToothIcon className="h-4 w-4" />
                      Profile Settings
                    </button>
                    <hr className="border-gray-700 my-1" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors flex items-center gap-2"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
