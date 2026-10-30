// Every localStorage key the dashboard uses, in one place. The strings are
// persisted in users' browsers: renaming one silently drops what they saved.
export const STORAGE_KEYS = [
  // Settings dialog
  'api_settings',
  'theme',

  // Navigation
  'dashboardActiveTab',

  // Repositories list
  'dashboardSearchTerm',
  'dashboardStatusFilter',
  'dashboardSortBy',
  'dashboardSortOrder',
  'dashboardItemsPerPage',
  'postsShowFilters',

  // Collect form
  'dashboardMaxRepos',
  'dashboardSince',
  'dashboardSpokenLanguageCode',
  'dashboardResource',
  'dashboardPeriod',
  'dashboardLanguage',
  'dashboardLastEdited',

  // Archive
  'archiveUrlFilter',
  'archiveTextFilter',
  'archiveDateAddedFrom',
  'archiveDateAddedTo',
  'archiveDatePostedFrom',
  'archiveDatePostedTo',
  'archiveDateArchivedFrom',
  'archiveDateArchivedTo',
  'archiveSortBy',
  'archiveSortOrder',
  'archivePageSize',
  'archiveShowFilters',
  'archiveOlderThanDays',

  // Cron history
  'cronHistoryJobFilter',
  'cronHistoryStatusFilter',
  'cronHistorySortOrder',
  'cronHistoryPageSize',
  'cronHistoryStartDate',
  'cronHistoryEndDate',
  'cronHistoryShowFilters',

  // Overview
  'pref_overview_time_range',
  'repository_trends_sort',

  // AI settings
  'promptSettings',

  // API response caches, cleared by "Clear API Cache"
  'cache_repositories',
  'cache_repositories_key',
  'cache_archive',
  'cache_archive_key',
  'cache_previews',
  'cache_cron_jobs',
  'cache_cron_job_history',
  'cache_api_configs',
  'cache_overview_history',
  'promptLanguageValidationCache',
  'settingsLanguageValidationCache',
  'language_validation_cache',
] as const;

export type StorageKey = (typeof STORAGE_KEYS)[number];

// localStorage throws when it is unavailable (some private modes, disabled
// storage, a full quota); a preference that cannot be read or saved must not
// break the page.
export const storage = {
  get(key: StorageKey): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: StorageKey, value: string | number | boolean): void {
    try {
      localStorage.setItem(key, String(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  },

  remove(key: StorageKey): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing stored to remove.
    }
  },

  /** An integer, or the fallback when the key is missing or not a number. */
  getInt(key: StorageKey, fallback: number): number {
    const parsed = parseInt(storage.get(key) ?? '', 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  },
};
