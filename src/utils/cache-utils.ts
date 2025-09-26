import type { Repository } from '../types';
import type { CronJob, CronJobHistory } from '../api/index';

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

const CACHE_EXPIRY = 30 * 60 * 1000;

// Check if cache is expired without deleting the data
export const isExpired = (key: string): boolean => {
  const cachedData = localStorage.getItem(key);
  if (!cachedData) return true;

  try {
    const data = JSON.parse(cachedData) as { timestamp: number };
    return Date.now() - data.timestamp > CACHE_EXPIRY;
  } catch {
    return true;
  }
};

export const saveRepositoriesToCache = (data: RepositoriesCache) => {
  localStorage.setItem('cache_repositories', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getRepositoriesFromCache = (): CacheResult<RepositoriesCache> | null => {
  const cachedData = localStorage.getItem('cache_repositories');
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

export const savePreviewsToCache = (data: PreviewsCache) => {
  localStorage.setItem('cache_previews', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getPreviewsFromCache = (): CacheResult<PreviewsCache> | null => {
  const cachedData = localStorage.getItem('cache_previews');
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
  localStorage.setItem('cache_cron_jobs', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getCronJobsFromCache = (): CacheResult<CronJobsCache> | null => {
  const cachedData = localStorage.getItem('cache_cron_jobs');
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
  localStorage.setItem('cache_cron_job_history', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getCronJobHistoryFromCache = (): CacheResult<CronJobHistoryCache> | null => {
  const cachedData = localStorage.getItem('cache_cron_job_history');
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

export const clearAllCaches = () => {
  const clearedCaches: string[] = [];
  const cacheKeys = [
    'cache_repositories',
    'cache_previews',
    'cache_cron_jobs',
    'cache_cron_job_history',
    'cache_repositories_key',
    'promptSettings',
    'language_validation_cache'
  ];
  
  cacheKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
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
