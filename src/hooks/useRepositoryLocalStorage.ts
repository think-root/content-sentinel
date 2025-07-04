import { useCallback } from 'react';

export function useRepositoryLocalStorage() {
  const getStoredValue = useCallback(<T>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved === null) return defaultValue;
      
      // Handle boolean values
      if (typeof defaultValue === 'boolean') {
        return (saved === 'true') as T;
      }
      
      // Handle number values
      if (typeof defaultValue === 'number') {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? defaultValue : (parsed as T);
      }
      
      // Handle string values
      return saved as T;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, []);

  const setStoredValue = useCallback(<T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, []);

  const removeStoredValue = useCallback((key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, []);

  const initializeFromStorage = useCallback(() => {
    return {
      dashboardExpanded: getStoredValue('dashboardExpanded', true),
      postsShowFilters: getStoredValue('postsShowFilters', false),
      dashboardSearchTerm: getStoredValue('dashboardSearchTerm', ''),
      dashboardStatusFilter: getStoredValue('dashboardStatusFilter', 'all' as 'all' | 'posted' | 'unposted'),
      dashboardSortBy: getStoredValue('dashboardSortBy', 'date_added' as 'id' | 'date_added' | 'date_posted'),
      dashboardSortOrder: getStoredValue('dashboardSortOrder', 'DESC' as 'ASC' | 'DESC'),
      dashboardItemsPerPage: getStoredValue('dashboardItemsPerPage', 10)
    };
  }, [getStoredValue]);

  return {
    getStoredValue,
    setStoredValue,
    removeStoredValue,
    initializeFromStorage
  };
}