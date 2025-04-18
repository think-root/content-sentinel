import { useState, useCallback } from 'react';
import { getRepositories } from '../api';
import type { Repository } from '../types';
import { saveRepositoriesToCache, getRepositoriesFromCache } from '../utils/cache-utils';
import { compareRepositories } from '../utils/data-comparison';
import { isApiConfigured } from "../utils/api-settings";

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;

interface RepositoriesState {
  repositories: Repository[];
  stats: {
    all: number;
    posted: number;
    unposted: number;
  };
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  loading: boolean;
  newDataAvailable: boolean;
  newDataDetails: {
    newCount: number;
    updatedCount: number;
  };
}

interface UseRepositoriesProps {
  isCacheBust: boolean;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const useRepositories = ({ isCacheBust, setErrorWithScroll }: UseRepositoriesProps) => {
  const cachedRepositories = isCacheBust ? null : getRepositoriesFromCache();

  const [state, setState] = useState<RepositoriesState>({
    repositories: cachedRepositories?.repositories || [],
    stats: cachedRepositories?.stats || { all: 0, posted: 0, unposted: 0 },
    pagination: cachedRepositories?.pagination || {
      currentPage: 1,
      pageSize: parseInt(localStorage.getItem('dashboardItemsPerPage') || '10', 10),
      totalPages: 1,
      totalItems: 0
    },
    loading: !cachedRepositories,
    newDataAvailable: false,
    newDataDetails: {
      newCount: 0,
      updatedCount: 0
    }
  });

  const fetchRepositoriesFromAPI = async (
    statusFilter?: boolean,
    fetchAll: boolean = false,
    itemsPerPage: number = state.pagination.pageSize,
    sortBy?: 'id' | 'date_added' | 'date_posted',
    sortOrder?: 'ASC' | 'DESC',
    page?: number,
    isBackgroundFetch: boolean = false
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));

      const response = await getRepositories(
        itemsPerPage,
        statusFilter,
        fetchAll,
        sortBy,
        sortOrder,
        fetchAll ? undefined : page,
        fetchAll ? 0 : itemsPerPage
      );

      if (response && response.data && response.data.items) {
        const processedItems = response.data.items.map((item: Repository) => ({
          ...item,
          posted: Boolean(item.posted)
        }));

        const cacheKey = JSON.stringify({ statusFilter, fetchAll, itemsPerPage, sortBy, sortOrder, page });
        localStorage.setItem('cache_repositories_key', cacheKey);

        const newData = {
          repositories: processedItems,
          stats: {
            all: response.data.all,
            posted: response.data.posted,
            unposted: response.data.unposted,
          }
        };

        const cachedData = getRepositoriesFromCache();

        if (isBackgroundFetch && cachedData) {
          const comparison = compareRepositories(newData, cachedData);

          if (comparison.hasChanges) {
            setTimeout(() => {
              setState(prev => ({
                ...prev,
                newDataAvailable: true,
                newDataDetails: {
                  newCount: comparison.newCount,
                  updatedCount: comparison.updatedCount
                }
              }));
            }, 100);

            if (!isCacheBust) {
              saveRepositoriesToCache({
                repositories: processedItems,
                stats: {
                  all: response.data.all,
                  posted: response.data.posted,
                  unposted: response.data.unposted,
                },
                pagination: {
                  currentPage: fetchAll ? 1 : response.data.page,
                  pageSize: fetchAll ? 0 : response.data.page_size,
                  totalPages: response.data.total_pages,
                  totalItems: response.data.total_items
                },
                timestamp: Date.now()
              });
            }
          }
        } else if (!isBackgroundFetch || isCacheBust) {
          setState(prev => ({
            ...prev,
            repositories: processedItems,
            stats: {
              all: response.data.all,
              posted: response.data.posted,
              unposted: response.data.unposted,
            },
            pagination: {
              currentPage: fetchAll ? 1 : response.data.page,
              pageSize: fetchAll ? 0 : response.data.page_size,
              totalPages: response.data.total_pages,
              totalItems: response.data.total_items
            }
          }));

          saveRepositoriesToCache({
            repositories: processedItems,
            stats: {
              all: response.data.all,
              posted: response.data.posted,
              unposted: response.data.unposted,
            },
            pagination: {
              currentPage: fetchAll ? 1 : response.data.page,
              pageSize: fetchAll ? 0 : response.data.page_size,
              totalPages: response.data.total_pages,
              totalItems: response.data.total_items
            },
            timestamp: Date.now()
          });
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (!isBackgroundFetch) {
        throw error;
      }
    } finally {
      if (!isBackgroundFetch) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const fetchRepositories = useCallback(async (
    statusFilter?: boolean,
    append: boolean = false,
    fetchAll: boolean = false,
    itemsPerPage: number = state.pagination.pageSize,
    sortBy?: 'id' | 'date_added' | 'date_posted',
    sortOrder?: 'ASC' | 'DESC',
    page?: number,
    forceFetch: boolean = false
  ) => {
    try {
      const cacheKey = JSON.stringify({
        statusFilter,
        fetchAll,
        itemsPerPage,
        sortBy,
        sortOrder,
        page,
      });
      const currentCacheKey = localStorage.getItem("cache_repositories_key");
      const hasCache = getRepositoriesFromCache() !== null;

      if ((!hasCache || currentCacheKey !== cacheKey) && !forceFetch) {
        if (!append) {
          setState((prev) => ({ ...prev, loading: true }));
        }
      }

      const isBackgroundFetch = hasCache && currentCacheKey === cacheKey && !forceFetch;
      await fetchRepositoriesFromAPI(
        statusFilter,
        fetchAll,
        itemsPerPage,
        sortBy,
        sortOrder,
        page,
        isBackgroundFetch
      );
    } catch {
      if (!isApiConfigured()) {
        setState(prev => ({ ...prev, loading: false }));
      } else {
        setErrorWithScroll("Failed to connect to Content Alchemist API", "content-alchemist-error");
        setState((prev) => ({ ...prev, loading: false }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.pagination.pageSize, setErrorWithScroll, isCacheBust]);

  const applyNewData = useCallback(() => {
    if (state.newDataAvailable) {
      const repoCache = getRepositoriesFromCache();
      if (repoCache) {
        setState(prev => ({
          ...prev,
          repositories: repoCache.repositories,
          stats: repoCache.stats,
          pagination: repoCache.pagination,
          newDataAvailable: false
        }));
      }
    }
  }, [state.newDataAvailable]);

  return {
    repositories: state.repositories,
    stats: state.stats,
    pagination: state.pagination,
    loading: state.loading,
    newDataAvailable: state.newDataAvailable,
    newDataDetails: state.newDataDetails,
    fetchRepositories,
    applyNewData,
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading }))
  };
};