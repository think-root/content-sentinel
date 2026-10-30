import { useCallback } from 'react';
import {
  DEFAULT_REPOSITORY_SORT_BY,
  DEFAULT_REPOSITORY_SORT_ORDER,
  DEFAULT_REPOSITORY_STATUS_FILTER,
  normalizeRepositoryFilterState,
} from '../utils/repositoryListUtils';
import { storage } from '../lib/storage';

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

/**
 * A stored number or boolean can be any value of its type, not just the
 * default's literal: `getStoredValue(key, 10)` returns `number`, not `10`.
 */
type StoredValue<T> = T extends number ? number : T extends boolean ? boolean : T;

export function useRepositoryLocalStorage() {
  const getStoredValue = useCallback(<T>(key: RepositoryStorageKey, defaultValue: T): StoredValue<T> => {
    const saved = storage.get(key);
    if (saved === null) return defaultValue as StoredValue<T>;

    if (typeof defaultValue === 'boolean') {
      return (saved === 'true') as StoredValue<T>;
    }

    if (typeof defaultValue === 'number') {
      return storage.getInt(key, defaultValue) as StoredValue<T>;
    }

    return saved as StoredValue<T>;
  }, []);

  const setStoredValue = useCallback(<T>(key: RepositoryStorageKey, value: T): void => {
    storage.set(key, String(value));
  }, []);

  const removeStoredValue = useCallback((key: RepositoryStorageKey): void => {
    storage.remove(key);
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
