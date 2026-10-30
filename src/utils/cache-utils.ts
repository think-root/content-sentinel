import type { Repository } from '../types';
import type { ArchivedRepository } from '../types/archive';
import type { CronJob, CronJobHistory } from '../api/maestro';
import type { ApiConfig } from '../api/api-configs';
import { storage, type StorageKey } from '../lib/storage';

interface RepositoriesCache {
  repositories: Repository[];
  stats: { all: number; posted: number; unposted: number };
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  timestamp: number;
}

// Kept separate from RepositoriesCache: archived rows have a different shape and no posted/unposted stats
interface ArchiveCache {
  items: ArchivedRepository[];
  all: number;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  timestamp: number;
}

interface CacheResult<T> {
  data: T;
  isStale: boolean;
}

interface PreviewsCache {
  latestPost?: Repository;
  nextPost?: Repository;
  timestamp: number;
}

interface CronJobsCache {
  cronJobs: CronJob[];
  timestamp: number;
}

interface CronJobHistoryCache {
  history: CronJobHistory[];
  total: number;
  timestamp: number;
}

interface ApiConfigsCache {
  configs: ApiConfig[];
  timestamp: number;
}

interface OverviewHistoryCache {
  history: CronJobHistory[];
  timeRange: string;
  timestamp: number;
}

const CACHE_EXPIRY = 30 * 60 * 1000;

// Check if cache is expired without deleting the data
export const isExpired = (key: StorageKey): boolean => {
  const cachedData = storage.get(key);
  if (!cachedData) return true;

  try {
    const data = JSON.parse(cachedData) as { timestamp: number };
    return Date.now() - data.timestamp > CACHE_EXPIRY;
  } catch {
    return true;
  }
};

export const saveRepositoriesToCache = (data: RepositoriesCache) => {
  storage.set('cache_repositories', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getRepositoriesFromCache = (): CacheResult<RepositoriesCache> | null => {
  const cachedData = storage.get('cache_repositories');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as RepositoriesCache;
    const isStale = Date.now() - data.timestamp > CACHE_EXPIRY;
    
    return {
      data,
      isStale
    };
  } catch {
    return null;
  }
};

export const saveArchiveToCache = (data: ArchiveCache) => {
  storage.set('cache_archive', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getArchiveFromCache = (): CacheResult<ArchiveCache> | null => {
  const cachedData = storage.get('cache_archive');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as ArchiveCache;
    const isStale = Date.now() - data.timestamp > CACHE_EXPIRY;

    return {
      data,
      isStale
    };
  } catch {
    return null;
  }
};

export const savePreviewsToCache = (data: PreviewsCache) => {
  storage.set('cache_previews', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getPreviewsFromCache = (): CacheResult<PreviewsCache> | null => {
  const cachedData = storage.get('cache_previews');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as PreviewsCache;
    const isStale = Date.now() - data.timestamp > CACHE_EXPIRY;
    
    return {
      data,
      isStale
    };
  } catch {
    return null;
  }
};

export const saveCronJobsToCache = (data: CronJobsCache) => {
  storage.set('cache_cron_jobs', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getCronJobsFromCache = (): CacheResult<CronJobsCache> | null => {
  const cachedData = storage.get('cache_cron_jobs');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as CronJobsCache;
    const isStale = Date.now() - data.timestamp > CACHE_EXPIRY;
    
    return {
      data,
      isStale
    };
  } catch {
    return null;
  }
};

export const saveCronJobHistoryToCache = (data: CronJobHistoryCache) => {
  storage.set('cache_cron_job_history', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getCronJobHistoryFromCache = (): CacheResult<CronJobHistoryCache> | null => {
  const cachedData = storage.get('cache_cron_job_history');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as CronJobHistoryCache;
    const isStale = Date.now() - data.timestamp > CACHE_EXPIRY;
    
    return {
      data,
      isStale
    };
  } catch {
    return null;
  }
};

export const saveApiConfigsToCache = (data: ApiConfigsCache) => {
  storage.set('cache_api_configs', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getApiConfigsFromCache = (): CacheResult<ApiConfigsCache> | null => {
  const cachedData = storage.get('cache_api_configs');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as ApiConfigsCache;
    const isStale = Date.now() - data.timestamp > CACHE_EXPIRY;

    return {
      data,
      isStale
    };
  } catch {
    return null;
  }
};

export const saveOverviewHistoryToCache = (data: OverviewHistoryCache) => {
  storage.set('cache_overview_history', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getOverviewHistoryFromCache = (): CacheResult<OverviewHistoryCache> | null => {
  const cachedData = storage.get('cache_overview_history');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as OverviewHistoryCache;
    const isStale = Date.now() - data.timestamp > CACHE_EXPIRY;

    return {
      data,
      isStale
    };
  } catch {
    return null;
  }
};

export const saveOverviewTimeRangePreference = (range: string) => {
  storage.set('pref_overview_time_range', range);
};

export const getOverviewTimeRangePreference = (): string | null => {
  return storage.get('pref_overview_time_range');
};

export const clearAllCaches = () => {
  const clearedCaches: string[] = [];
  const cacheKeys: StorageKey[] = [
    'cache_repositories',
    'cache_archive',
    'cache_previews',
    'cache_cron_jobs',
    'cache_cron_job_history',
    'cache_api_configs',
    'cache_overview_history',
    'promptLanguageValidationCache',
    'settingsLanguageValidationCache'
  ];
  
  cacheKeys.forEach(key => {
    if (storage.get(key)) {
      storage.remove(key);
      clearedCaches.push(key);
      console.log(`✓ Cleared cache: ${key}`);
    }
  });
  
  console.log(`Cache clearing completed. Cleared ${clearedCaches.length} cache entries:`, clearedCaches);
  
  return {
    success: true,
    clearedCount: clearedCaches.length,
    clearedCaches
  };
};
