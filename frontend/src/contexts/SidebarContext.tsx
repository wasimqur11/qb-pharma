import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'qb-pharma-sidebar-collapsed';

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from localStorage, default to expanded (false)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapsed = () => setIsCollapsed(prev => !prev);
  const setCollapsed = (collapsed: boolean) => setIsCollapsed(collapsed);
  const openMobile = () => setIsMobileOpen(true);
  const closeMobile = () => setIsMobileOpen(false);
  const toggleMobile = () => setIsMobileOpen(prev => !prev);

  const contextValue = useMemo((): SidebarContextType => ({
    isCollapsed,
    isMobileOpen,
    toggleCollapsed,
    setCollapsed,
    openMobile,
    closeMobile,
    toggleMobile
  }), [isCollapsed, isMobileOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export default SidebarContext;
