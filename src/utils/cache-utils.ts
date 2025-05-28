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

export const saveRepositoriesToCache = (data: RepositoriesCache) => {
  localStorage.setItem('cache_repositories', JSON.stringify({
    ...data,
    timestamp: Date.now()
  }));
};

export const getRepositoriesFromCache = (): RepositoriesCache | null => {
  const cachedData = localStorage.getItem('cache_repositories');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as RepositoriesCache;
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      return null;
    }
    return data;
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

export const getPreviewsFromCache = (): PreviewsCache | null => {
  const cachedData = localStorage.getItem('cache_previews');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as PreviewsCache;
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      return null;
    }
    return data;
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

export const getCronJobsFromCache = (): CronJobsCache | null => {
  const cachedData = localStorage.getItem('cache_cron_jobs');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as CronJobsCache;
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      return null;
    }
    return data;
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

export const getCronJobHistoryFromCache = (): CronJobHistoryCache | null => {
  const cachedData = localStorage.getItem('cache_cron_job_history');
  if (!cachedData) return null;

  try {
    const data = JSON.parse(cachedData) as CronJobHistoryCache;
    if (Date.now() - data.timestamp > CACHE_EXPIRY) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

export const clearAllCaches = () => {
  localStorage.removeItem('cache_repositories');
  localStorage.removeItem('cache_previews');
  localStorage.removeItem('cache_cron_jobs');
  localStorage.removeItem('cache_cron_job_history');

  localStorage.removeItem('cache_repositories_key');
};
