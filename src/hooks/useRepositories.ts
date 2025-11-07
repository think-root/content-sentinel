import { useState, useCallback, useRef, useEffect } from 'react';
import { getRepositories } from '../api';
import type { Repository } from '../types';
import { saveRepositoriesToCache, getRepositoriesFromCache } from '../utils/cache-utils';
import { compareRepositories } from '../utils/data-comparison';
import { isApiConfigured, getApiSettings } from "../utils/api-settings";
import { useRepositoryLocalStorage } from './useRepositoryLocalStorage';

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
  statsLoading: boolean;
  stale: boolean;
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
  const { getStoredValue } = useRepositoryLocalStorage();
  const cachedRepositoriesResult = isCacheBust ? null : getRepositoriesFromCache();
  const cachedRepositories = cachedRepositoriesResult?.data;
  const isFetching = useRef<boolean>(false);
  const pageSizeRef = useRef<number>(getStoredValue('dashboardItemsPerPage', 10));
  const loadingWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [state, setState] = useState<RepositoriesState>({
    repositories: cachedRepositories?.repositories || [],
    stats: cachedRepositories?.stats || { all: 0, posted: 0, unposted: 0 },
    pagination: cachedRepositories?.pagination || {
      currentPage: 1,
      pageSize: pageSizeRef.current,
      totalPages: 1,
      totalItems: 0
    },
    loading: !cachedRepositories || cachedRepositories.repositories.length === 0,
    statsLoading: !cachedRepositories || !cachedRepositories.stats || (cachedRepositories.stats.all === 0 && cachedRepositories.stats.posted === 0 && cachedRepositories.stats.unposted === 0), // окрема логіка для статистики
    stale: cachedRepositoriesResult?.isStale || false,
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
    // Guard against concurrent calls
    if (isFetching.current) {
      return;
    }

    try {
      isFetching.current = true;
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

        const settings = getApiSettings();
        const textLanguage = settings.displayLanguage || 'uk';
        const cacheKey = JSON.stringify({ statusFilter, fetchAll, itemsPerPage, sortBy, sortOrder, page, textLanguage });
        localStorage.setItem('cache_repositories_key', cacheKey);

        const newData = {
          repositories: processedItems,
          stats: {
            all: response.data.all,
            posted: response.data.posted,
            unposted: response.data.unposted,
          }
        };

        const cachedDataResult = getRepositoriesFromCache();
        const cachedData = cachedDataResult?.data;

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
            },
            stale: false
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
    } catch (error: any) {
      console.log('[useRepositories] Error in fetchRepositoriesFromAPI:', error.message);
      
      // Handle rate limit errors specifically without triggering error toast
      if (error?.message?.includes('Rate limit exceeded')) {
        console.warn('Rate limit exceeded. Please try again later.');
        return;
      }
      
      // Handle language availability errors - don't re-throw them
      if (error?.message?.includes('no text available for language')) {
        console.log('[useRepositories] Language error detected, fallback should handle this');
        // Don't re-throw language errors - let the fallback handle them
        return;
      }
      
      // If we're doing a background fetch and there's stale cache, keep the stale data
      if (isBackgroundFetch && cachedRepositories) {
        setState(prev => ({ ...prev, stale: true }));
      } else if (!isBackgroundFetch) {
        throw error;
      }
    } finally {
      isFetching.current = false;
      setState(prev => ({ ...prev, loading: false, statsLoading: false }));
    }
  };

  const fetchRepositories = useCallback(async (
    statusFilter?: boolean,
    append: boolean = false,
    fetchAll: boolean = false,
    itemsPerPage: number = pageSizeRef.current,
    sortBy?: 'id' | 'date_added' | 'date_posted',
    sortOrder?: 'ASC' | 'DESC',
    page?: number,
    forceFetch: boolean = false
  ) => {
    // Prevent “set loading then return” races: if already fetching and not forcing, do nothing
    if (isFetching.current && !forceFetch) {
      return;
    }
    try {
      const settings = getApiSettings();
      const textLanguage = settings.displayLanguage || 'uk';
      const cacheKey = JSON.stringify({
        statusFilter,
        fetchAll,
        itemsPerPage,
        sortBy,
        sortOrder,
        page,
        textLanguage,
      });
      const currentCacheKey = localStorage.getItem("cache_repositories_key");
      const cacheResult = getRepositoriesFromCache();
      const hasCache = cacheResult?.data !== undefined;
      
      // Only set loading to true if there's no cache at all (not just stale)
      if ((!hasCache || currentCacheKey !== cacheKey) && !forceFetch && !append) {
        setState((prev) => ({ ...prev, loading: true }));
      }

      if (!hasCache || !cacheResult?.data?.stats) {
        setState((prev) => ({ ...prev, statsLoading: true }));
      }

      // Always do background fetch if there's cache (even if stale), unless forceFetch is true
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
    } catch (error: any) {
      if (!isApiConfigured()) {
        setState(prev => ({ ...prev, loading: false }));
      } else {
        // Check if it's a language availability error
        if (error?.message?.includes('no text available for language')) {
          console.log('[Language Fallback] Language error caught in useRepositories:', error.message);
          // Don't show error toast for language errors - fallback should handle them
          setState((prev) => ({ ...prev, loading: false }));
        } else {
          setErrorWithScroll("Failed to connect to Content Alchemist API", "content-alchemist-error");
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setErrorWithScroll, isCacheBust]);

  const applyNewData = useCallback(() => {
    const repoCacheResult = getRepositoriesFromCache();
    if (repoCacheResult?.data) {
      setState(prev => ({
        ...prev,
        repositories: repoCacheResult.data.repositories,
        stats: repoCacheResult.data.stats,
        pagination: repoCacheResult.data.pagination,
        newDataAvailable: false
      }));
    }
  }, []);

  // Dev-only watchdog for prolonged loading to catch regressions without changing UI
  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }
    // When loading becomes true, start a one-shot timer to warn if it persists > 8s
    if (state.loading) {
      // Clear any existing timer before scheduling a new one
      if (loadingWatchdogRef.current) {
        clearTimeout(loadingWatchdogRef.current);
        loadingWatchdogRef.current = null;
      }
      loadingWatchdogRef.current = setTimeout(() => {
        // If still loading after 8s, emit a single warning with diagnostic context
        if (state.loading) {
          console.warn('[useRepositories] loading persisted > 8s', {
            isFetching: isFetching.current,
            pagination: state.pagination,
            stale: state.stale,
            cacheKey: localStorage.getItem('cache_repositories_key') || null,
          });
        }
        // Prevent repeated warnings during the same loading session
        loadingWatchdogRef.current = null;
      }, 8000);
    } else {
      // Loading flipped to false - cancel any pending watchdog timer
      if (loadingWatchdogRef.current) {
        clearTimeout(loadingWatchdogRef.current);
        loadingWatchdogRef.current = null;
      }
    }
    // Cleanup on unmount or dependency change
    return () => {
      if (loadingWatchdogRef.current) {
        clearTimeout(loadingWatchdogRef.current);
        loadingWatchdogRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loading]);

  useEffect(() => {
    // Load initial data with saved filter values using centralized storage utilities
    const savedSortBy = getStoredValue('dashboardSortBy', 'date_added' as 'id' | 'date_added' | 'date_posted');
    const savedSortOrder = getStoredValue('dashboardSortOrder', 'DESC' as 'ASC' | 'DESC');
    const savedStatusFilter = getStoredValue('dashboardStatusFilter', 'all' as 'all' | 'posted' | 'unposted');
    const savedItemsPerPage = getStoredValue('dashboardItemsPerPage', 10);
    
    const posted = savedStatusFilter === 'all' ? undefined : savedStatusFilter === 'posted';
    
    // Validate cache key against current parameters
    const settings = getApiSettings();
    const textLanguage = settings.displayLanguage || 'uk';
    const expectedCacheKey = JSON.stringify({
      statusFilter: posted,
      fetchAll: savedItemsPerPage === 0,
      itemsPerPage: savedItemsPerPage,
      sortBy: savedSortBy,
      sortOrder: savedSortOrder,
      page: 1,
      textLanguage,
    });
    const currentCacheKey = localStorage.getItem('cache_repositories_key');
    
    // Force fetch if cache key doesn't match current parameters
    const shouldForceFetch = currentCacheKey !== expectedCacheKey;
    
    fetchRepositories(
      posted,
      false,
      savedItemsPerPage === 0,
      savedItemsPerPage,
      savedSortBy,
      savedSortOrder,
      1,
      shouldForceFetch
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    repositories: state.repositories,
    stats: state.stats,
    pagination: state.pagination,
    loading: state.loading,
    statsLoading: state.statsLoading, // новий експорт
    stale: state.stale,
    newDataAvailable: state.newDataAvailable,
    newDataDetails: state.newDataDetails,
    fetchRepositories,
    applyNewData,
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading }))
  };
};