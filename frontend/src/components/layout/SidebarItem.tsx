import React from 'react';
import clsx from 'clsx';
import { useSidebar } from '../../contexts/SidebarContext';

// Type exported at bottom of file
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  tooltip?: string;
}

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  onClick: (id: string) => void;
  colorScheme: {
    active: string;
    activeText: string;
    activeBorder: string;
  };
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  onClick,
  colorScheme
}) => {
  const { isCollapsed } = useSidebar();
  const Icon = item.icon;

  return (
    <button
      onClick={() => onClick(item.id)}
      title={isCollapsed ? item.label : item.tooltip}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
        isActive
          ? `${colorScheme.active} ${colorScheme.activeText} border-l-4 ${colorScheme.activeBorder}`
          : 'text-gray-400 hover:text-white hover:bg-gray-800/50 border-l-4 border-transparent',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && (
        <span className="truncate">{item.label}</span>
      )}
    </button>
  );
};

export default SidebarItem;
export type { NavItem };
