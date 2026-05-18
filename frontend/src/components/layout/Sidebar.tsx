import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import SidebarSection from './SidebarSection';
import type { NavItem } from './SidebarItem';
import qbLogo from '../../assets/qblogo.png';

interface NavigationItems {
  primary: NavItem[];
  management: NavItem[];
  statements: NavItem[];
  system: NavItem[];
}

interface SidebarProps {
  navigationItems: NavigationItems;
  activeTab: string;
  onTabClick: (id: string) => void;
}

// Color schemes for each section
const colorSchemes = {
  primary: {
    header: 'text-blue-400',
    headerDot: 'bg-blue-400',
    active: 'bg-blue-500/10',
    activeText: 'text-blue-400',
    activeBorder: 'border-blue-500'
  },
  management: {
    header: 'text-green-400',
    headerDot: 'bg-green-400',
    active: 'bg-green-500/10',
    activeText: 'text-green-400',
    activeBorder: 'border-green-500'
  },
  statements: {
    header: 'text-purple-400',
    headerDot: 'bg-purple-400',
    active: 'bg-purple-500/10',
    activeText: 'text-purple-400',
    activeBorder: 'border-purple-500'
  },
  system: {
    header: 'text-orange-400',
    headerDot: 'bg-orange-400',
    active: 'bg-orange-500/10',
    activeText: 'text-orange-400',
    activeBorder: 'border-orange-500'
  }
};

const Sidebar: React.FC<SidebarProps> = ({
  navigationItems,
  activeTab,
  onTabClick
}) => {
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebar();
  const { user, logout } = useAuth();

  const getSectionKey = (tab: string): string => {
    for (const [key, items] of Object.entries(navigationItems)) {
      if (items.some(item => item.id === tab)) return key;
    }
    return 'primary';
  };

  const [expandedSection, setExpandedSection] = useState<string>(() => getSectionKey(activeTab));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setExpandedSection(getSectionKey(activeTab));
  }, [activeTab]);

  const handleSectionToggle = (sectionKey: string) => {
    setExpandedSection(prev => prev === sectionKey ? '' : sectionKey);
  };

  const handleNavClick = (id: string) => {
    onTabClick(id);
    setSearchQuery('');
    closeMobile();
  };

  const filterItems = (items: NavItem[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => item.label.toLowerCase().includes(q));
  };

  const isSearching = searchQuery.trim().length > 0;

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className={clsx(
        'flex items-center gap-3 px-4 py-4 border-b border-gray-700',
        isCollapsed && 'justify-center px-2'
      )}>
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
          <img src={qbLogo} alt="QB Pharmacy" className="h-10 w-10 object-contain" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-white truncate">QB Pharmacy</h1>
            <p className="text-xs text-gray-400 truncate">Management System</p>
          </div>
        )}
      </div>

      {/* User Info - Mobile Only */}
      {isMobileOpen && (
        <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/50 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-sm">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role?.replace('_', ' ').toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Box */}
      {!isCollapsed && (
        <div className="px-3 py-2 border-b border-gray-700">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 text-sm text-gray-200 placeholder-gray-500 rounded-lg pl-8 pr-7 py-2 border border-gray-700 focus:border-gray-500 focus:outline-none"
            />
            {isSearching && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 p-0.5 text-gray-500 hover:text-gray-300"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Sections */}
      <div className={clsx(
        'flex-1 overflow-y-auto py-4 scrollbar-hide',
        isCollapsed ? 'px-2' : 'px-3'
      )}>
        <SidebarSection
          title="Overview"
          items={filterItems(navigationItems.primary)}
          activeTab={activeTab}
          onTabClick={handleNavClick}
          colorScheme={colorSchemes.primary}
          isExpanded={isSearching ? filterItems(navigationItems.primary).length > 0 : expandedSection === 'primary'}
          onToggle={() => !isSearching && handleSectionToggle('primary')}
        />

        <SidebarSection
          title="Management"
          items={filterItems(navigationItems.management)}
          activeTab={activeTab}
          onTabClick={handleNavClick}
          colorScheme={colorSchemes.management}
          isExpanded={isSearching ? filterItems(navigationItems.management).length > 0 : expandedSection === 'management'}
          onToggle={() => !isSearching && handleSectionToggle('management')}
        />

        <SidebarSection
          title="Reports & Statements"
          items={filterItems(navigationItems.statements)}
          activeTab={activeTab}
          onTabClick={handleNavClick}
          colorScheme={colorSchemes.statements}
          isExpanded={isSearching ? filterItems(navigationItems.statements).length > 0 : expandedSection === 'statements'}
          onToggle={() => !isSearching && handleSectionToggle('statements')}
        />

        <SidebarSection
          title="System"
          items={filterItems(navigationItems.system)}
          activeTab={activeTab}
          onTabClick={handleNavClick}
          colorScheme={colorSchemes.system}
          isExpanded={isSearching ? filterItems(navigationItems.system).length > 0 : expandedSection === 'system'}
          onToggle={() => !isSearching && handleSectionToggle('system')}
        />
      </div>

      {/* Collapse Toggle - Desktop Only */}
      <div className="hidden lg:block border-t border-gray-700 p-2">
        <button
          onClick={toggleCollapsed}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm',
            isCollapsed && 'justify-center'
          )}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeftIcon className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

      {/* Logout - Mobile Only */}
      {isMobileOpen && (
        <div className="border-t border-gray-700 p-3 lg:hidden">
          <button
            onClick={() => {
              closeMobile();
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-gray-900 border-r border-gray-700 z-40 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobile}
          />

          {/* Drawer */}
          <aside className="fixed left-0 top-0 h-full w-72 bg-gray-900 border-r border-gray-700 flex flex-col shadow-xl">
            {/* Close Button */}
            <button
              onClick={closeMobile}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Spacer for desktop layout */}
      <div
        className={clsx(
          'hidden lg:block flex-shrink-0 transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      />
    </>
  );
};

export default Sidebar;
