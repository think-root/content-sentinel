import { useState } from 'react';
import { NAV_KEYS, DEFAULT_TAB, type DashboardTabKey } from '@/config/nav-items';
import { storage } from '../lib/storage';

interface UseTabPersistenceReturn {
  activeTab: DashboardTabKey;
  setActiveTab: (tab: DashboardTabKey) => void;
}

const TAB_STORAGE_KEY = 'dashboardActiveTab';

const isValidTab = (tab: string): tab is DashboardTabKey =>
  (NAV_KEYS as readonly string[]).includes(tab);

// Helper function to get initial tab synchronously
const getInitialTab = (defaultTab: DashboardTabKey): DashboardTabKey => {
  const savedTab = storage.get(TAB_STORAGE_KEY);
  return savedTab && isValidTab(savedTab) ? savedTab : defaultTab;
};

export const useTabPersistence = (
  defaultTab: DashboardTabKey = DEFAULT_TAB
): UseTabPersistenceReturn => {
  // Use lazy initialization to load saved tab synchronously during state initialization
  const [activeTab, setActiveTab] = useState<DashboardTabKey>(() => getInitialTab(defaultTab));

  // Save tab to localStorage when it changes
  const setActiveTabAndSave = (tab: DashboardTabKey) => {
    if (isValidTab(tab)) {
      storage.set(TAB_STORAGE_KEY, tab);
    }
    setActiveTab(tab);
  };

  return {
    activeTab,
    setActiveTab: setActiveTabAndSave
  };
};
