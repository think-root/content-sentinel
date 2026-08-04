import { useCallback } from 'react';
import {
  DEFAULT_REPOSITORY_SORT_BY,
  DEFAULT_REPOSITORY_SORT_ORDER,
  DEFAULT_REPOSITORY_STATUS_FILTER,
  normalizeRepositoryFilterState,
} from '../utils/repositoryListUtils';

/**
 * Typed storage keys used by repository dashboard
 */
export type RepositoryStorageKey =
  | 'dashboardSearchTerm'
  | 'dashboardStatusFilter'
  | 'dashboardSortBy'
  | 'dashboardSortOrder'
  | 'dashboardItemsPerPage'
  | 'postsShowFilters'
  | 'archiveUrlFilter'
  | 'archiveTextFilter'
  | 'archiveDateAddedFrom'
  | 'archiveDateAddedTo'
  | 'archiveDatePostedFrom'
  | 'archiveDatePostedTo'
  | 'archiveDateArchivedFrom'
  | 'archiveDateArchivedTo'
  | 'archiveSortBy'
  | 'archiveSortOrder'
  | 'archivePageSize'
  | 'archiveShowFilters'
  | 'archiveOlderThanDays';

export function useRepositoryLocalStorage() {
  const getStoredValue = useCallback(<T>(key: RepositoryStorageKey, defaultValue: T): T => {
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

  const setStoredValue = useCallback(<T>(key: RepositoryStorageKey, value: T): void => {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, []);

  const removeStoredValue = useCallback((key: RepositoryStorageKey): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, []);

  /**
   * Initialize all repository filter parameters from localStorage.
   * Returns the full saved filter parameter set with defaults applied for missing values.
   *
   * Default values:
   * - postsShowFilters: false
   * - dashboardSearchTerm: '' (empty string)
   * - dashboardStatusFilter: 'all'
   * - dashboardSortBy: 'date_added'
   * - dashboardSortOrder: 'DESC'
   * - dashboardItemsPerPage: 10
   */
  const initializeFromStorage = useCallback(() => {
    const repositoryFilters = normalizeRepositoryFilterState(
      getStoredValue('dashboardStatusFilter', DEFAULT_REPOSITORY_STATUS_FILTER),
      getStoredValue('dashboardSortBy', DEFAULT_REPOSITORY_SORT_BY),
      getStoredValue('dashboardSortOrder', DEFAULT_REPOSITORY_SORT_ORDER)
    );

    return {
      postsShowFilters: getStoredValue('postsShowFilters', false),
      dashboardSearchTerm: getStoredValue('dashboardSearchTerm', ''),
      dashboardStatusFilter: repositoryFilters.statusFilter,
      dashboardSortBy: repositoryFilters.sortBy,
      dashboardSortOrder: repositoryFilters.sortOrder,
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
