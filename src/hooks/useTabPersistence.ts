import { useState } from 'react';

interface UseTabPersistenceReturn {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TAB_STORAGE_KEY = 'dashboardActiveTab';
const VALID_TABS = ['overview', 'repositories', 'automation', 'settings'] as const;

// Helper function to get initial tab synchronously
const getInitialTab = (defaultTab: string): string => {
  try {
    const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
    
    // Check if saved tab is valid
    if (savedTab && (VALID_TABS as readonly string[]).includes(savedTab)) {
      return savedTab;
    }
  } catch (error) {
    // Handle localStorage access errors (e.g., in private mode)
    console.warn('Failed to access localStorage for tab persistence:', error);
  }
  
  // Fall back to default tab
  return defaultTab;
};

export const useTabPersistence = (defaultTab: string = 'overview'): UseTabPersistenceReturn => {
  // Use lazy initialization to load saved tab synchronously during state initialization
  const [activeTab, setActiveTab] = useState<string>(() => getInitialTab(defaultTab));

  // Save tab to localStorage when it changes
  const setActiveTabAndSave = (tab: string) => {
    try {
      // Validate tab before saving
      if ((VALID_TABS as readonly string[]).includes(tab)) {
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