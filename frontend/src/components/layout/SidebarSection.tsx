import React from 'react';
import clsx from 'clsx';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useSidebar } from '../../contexts/SidebarContext';
import SidebarItem from './SidebarItem';
import type { NavItem } from './SidebarItem';

interface SidebarSectionProps {
  title: string;
  items: NavItem[];
  activeTab: string;
  onTabClick: (id: string) => void;
  colorScheme: {
    header: string;
    headerDot: string;
    active: string;
    activeText: string;
    activeBorder: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  items,
  activeTab,
  onTabClick,
  colorScheme,
  isExpanded,
  onToggle
}) => {
  const { isCollapsed } = useSidebar();

  // Don't render if no items
  if (!items || items.length === 0) return null;

  // Check if any item in this section is active
  const hasActiveItem = items.some(item => activeTab === item.id);

  return (
    <div className="mb-2">
      {/* Section Header */}
      {!isCollapsed ? (
        <button
          onClick={onToggle}
          className={clsx(
            'w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
            hasActiveItem ? colorScheme.header : 'text-gray-500 hover:text-gray-400'
          )}
        >
          <span>{title}</span>
          <ChevronDownIcon
            className={clsx(
              'h-4 w-4 transition-transform duration-200',
              isExpanded ? 'rotate-0' : '-rotate-90'
            )}
          />
        </button>
      ) : (
        <div className="flex justify-center py-2">
          <div className={clsx('w-6 h-0.5 rounded', hasActiveItem ? colorScheme.headerDot : 'bg-gray-700')} />
        </div>
      )}

      {/* Section Items */}
      {(isExpanded || isCollapsed) && (
        <div className={clsx('space-y-0.5', !isCollapsed && 'mt-1')}>
          {items.map(item => (
            <SidebarItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={onTabClick}
              colorScheme={colorScheme}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarSection;
