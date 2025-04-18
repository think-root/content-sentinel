import { useEffect, useCallback } from 'react';
import { clearAllCaches, getRepositoriesFromCache, getPreviewsFromCache, getCronJobsFromCache } from '../utils/cache-utils';
import { isApiConfigured } from "../utils/api-settings";

interface UseCacheProps {
  fetchRepositories: (
    statusFilter?: boolean,
    append?: boolean,
    fetchAll?: boolean,
    itemsPerPage?: number,
    sortBy?: 'id' | 'date_added' | 'date_posted',
    sortOrder?: 'ASC' | 'DESC',
    page?: number,
    forceFetch?: boolean
  ) => Promise<void>;
  fetchPreviews: (forceFetch?: boolean) => Promise<void>;
  fetchCronJobs?: (forceFetch?: boolean) => Promise<void>;
}

export const useCache = ({ fetchRepositories, fetchPreviews, fetchCronJobs }: UseCacheProps) => {
  const checkCacheValidity = useCallback(() => {
    if (!isApiConfigured()) {
      return;
    }

    const repoCache = getRepositoriesFromCache();
    const previewsCache = getPreviewsFromCache();
    const cronJobsCache = getCronJobsFromCache();

    if (!repoCache || !previewsCache || !cronJobsCache) {
      console.log("Cache expired, refreshing data...");

      const savedStatusFilter = localStorage.getItem("dashboardStatusFilter") as
        | "all"
        | "posted"
        | "unposted"
        | null;
      const savedSortBy = localStorage.getItem("dashboardSortBy") as
        | "id"
        | "date_added"
        | "date_posted"
        | null;
      const savedSortOrder = localStorage.getItem("dashboardSortOrder") as "ASC" | "DESC" | null;
      const savedItemsPerPage = parseInt(localStorage.getItem("dashboardItemsPerPage") || "10", 10);

      const posted = savedStatusFilter === "all" ? undefined : savedStatusFilter === "posted";

      fetchRepositories(
        posted,
        false,
        savedItemsPerPage === 0,
        savedItemsPerPage,
        savedSortBy || "date_added",
        savedSortOrder || "DESC",
        1,
        true
      );
      fetchPreviews(true);

      if (fetchCronJobs) {
        fetchCronJobs(true);
      }
    }
  }, [fetchRepositories, fetchPreviews, fetchCronJobs]);

  useEffect(() => {
    window.clearAllCaches = () => {
      clearAllCaches();
      return 'All caches cleared successfully';
    };

    return () => {
      delete window.clearAllCaches;
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(checkCacheValidity, 300000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkCacheValidity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkCacheValidity]);

  return {
    checkCacheValidity
  };
};