import { useState } from 'react';
import { NAV_KEYS, DEFAULT_TAB, type DashboardTabKey } from '@/config/nav-items';

interface UseTabPersistenceReturn {
  activeTab: DashboardTabKey;
  setActiveTab: (tab: DashboardTabKey) => void;
}

const TAB_STORAGE_KEY = 'dashboardActiveTab';

const isValidTab = (tab: string): tab is DashboardTabKey =>
  (NAV_KEYS as readonly string[]).includes(tab);

// Helper function to get initial tab synchronously
const getInitialTab = (defaultTab: DashboardTabKey): DashboardTabKey => {
  try {
    const savedTab = localStorage.getItem(TAB_STORAGE_KEY);

    // Check if saved tab is valid
    if (savedTab && isValidTab(savedTab)) {
      return savedTab;
    }
  } catch (error) {
    // Handle localStorage access errors (e.g., in private mode)
    console.warn('Failed to access localStorage for tab persistence:', error);
  }

  // Fall back to default tab
  return defaultTab;
};

export const useTabPersistence = (
  defaultTab: DashboardTabKey = DEFAULT_TAB
): UseTabPersistenceReturn => {
  // Use lazy initialization to load saved tab synchronously during state initialization
  const [activeTab, setActiveTab] = useState<DashboardTabKey>(() => getInitialTab(defaultTab));

  // Save tab to localStorage when it changes
  const setActiveTabAndSave = (tab: DashboardTabKey) => {
    try {
      // Validate tab before saving
      if (isValidTab(tab)) {
        localStorage.setItem(TAB_STORAGE_KEY, tab);
      }
      setActiveTab(tab);
    } catch (error) {
      // Handle localStorage write errors
      console.warn('Failed to save tab to localStorage:', error);
      setActiveTab(tab); // Still update state even if we can't save
    }
  };

  return {
    activeTab,
    setActiveTab: setActiveTabAndSave
  };
};
