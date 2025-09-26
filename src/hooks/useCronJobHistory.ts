import { useState, useCallback, useEffect } from 'react';
import { getCronJobHistory, type CronJobHistory } from '../api/index';
import { saveCronJobHistoryToCache, getCronJobHistoryFromCache } from '../utils/cache-utils';

interface CronJobHistoryState {
  history: CronJobHistory[];
  loading: boolean;
  stale: boolean;
  page: number;
  pageSize: number;
  nameFilter?: string;
  successFilter?: boolean;
  sortOrder: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  newDataAvailable: boolean;
  hasMore: boolean;
  totalItems: number;
  totalPages: number;
}

interface UseCronJobHistoryProps {
  isCacheBust: boolean;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const useCronJobHistory = ({ isCacheBust, setErrorWithScroll }: UseCronJobHistoryProps) => {
  const cachedHistoryResult = isCacheBust ? null : getCronJobHistoryFromCache();
  const cachedHistory = cachedHistoryResult?.data;
  const isStale = cachedHistoryResult?.isStale || false;

  const [state, setState] = useState<CronJobHistoryState>({
    history: cachedHistory?.history || [],
    loading: !cachedHistory,
    stale: isStale,
    page: 1,
    pageSize: parseInt(localStorage.getItem('cronHistoryPageSize') || '10', 10),
    sortOrder: (localStorage.getItem('cronHistorySortOrder') as 'asc' | 'desc') || 'desc',
    startDate: localStorage.getItem('cronHistoryStartDate') || undefined,
    endDate: localStorage.getItem('cronHistoryEndDate') || undefined,
    newDataAvailable: false,
    hasMore: true,
    totalItems: cachedHistory?.total || 0,
    totalPages: cachedHistory ? Math.ceil(cachedHistory.total / parseInt(localStorage.getItem('cronHistoryPageSize') || '10', 10)) : 0,
    nameFilter: localStorage.getItem('cronHistoryJobFilter') === 'all' ? undefined : localStorage.getItem('cronHistoryJobFilter') || undefined,
    successFilter: (() => {
      const saved = localStorage.getItem('cronHistoryStatusFilter');
      if (!saved || saved === 'all') return undefined;
      return saved === 'success';
    })()
  });

  const fetchCronJobHistory = useCallback(async (forceFetch: boolean = false, append: boolean = false) => {
    const cacheResult = getCronJobHistoryFromCache();
    const hasCache = cacheResult?.data !== undefined;
    // const isStale = cacheResult?.isStale || false;
    
    // Always do background fetch when there's cache (even if stale), unless we're forcing a fetch
    const isBackgroundFetch = hasCache && !forceFetch && !state.loading;

    try {
      // Only show loading skeletons when there's no cached data at all
      if (!hasCache && !forceFetch && !append) {
        setState((prev) => ({ ...prev, loading: true }));
      }

      const currentPage = append ? state.page + 1 : state.page;

      const historyResponse = await getCronJobHistory(
        state.nameFilter,
        currentPage,
        state.pageSize,
        state.successFilter,
        state.sortOrder,
        state.startDate,
        state.endDate
      );

      const cachedDataResult = getCronJobHistoryFromCache();
      const cachedData = cachedDataResult?.data;

      if (isBackgroundFetch && cachedData && !append) {
        const hasChanges = JSON.stringify(historyResponse.data) !== JSON.stringify(cachedData.history);
        if (hasChanges) {
          setTimeout(() => {
            setState(prev => ({ ...prev, newDataAvailable: true }));
          }, 100);

          if (!isCacheBust) {
            saveCronJobHistoryToCache({
              history: historyResponse.data,
              total: historyResponse.pagination.total_count,
              timestamp: Date.now()
            });
          }
        }
        // Update stale state to false after successful background fetch
        setState(prev => ({ ...prev, stale: false }));
      } else if (!isBackgroundFetch || isCacheBust) {
        const newHistory = append ? [...state.history, ...historyResponse.data] : historyResponse.data;
        const hasMore = historyResponse.pagination.has_next;

        setState(prev => ({
          ...prev,
          history: newHistory,
          stale: false,
          page: currentPage,
          hasMore,
          totalItems: historyResponse.pagination.total_count,
          totalPages: historyResponse.pagination.total_pages
        }));

        if (!append) {
          saveCronJobHistoryToCache({
            history: newHistory,
            total: historyResponse.pagination.total_count,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      const err = error as Error;
      if (!isBackgroundFetch || isCacheBust) {
        setErrorWithScroll('Failed to fetch cron job history: ' + (err.message || 'Unknown error'), 'cron-job-history-error');
        throw err;
      }
    } finally {
      if (!isBackgroundFetch || isCacheBust) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, [setErrorWithScroll, isCacheBust, state.nameFilter, state.successFilter, state.page, state.pageSize, state.sortOrder, state.startDate, state.endDate]);

  // Initial fetch with saved filters
  useEffect(() => {
    fetchCronJobHistory(false);
  }, []);

  const applyNewData = useCallback(() => {
    setState(prev => {
      if (!prev.newDataAvailable) return prev;
      
      const historyCacheResult = getCronJobHistoryFromCache();
      if (historyCacheResult?.data) {
        return {
          ...prev,
          history: historyCacheResult.data.history,
          totalItems: historyCacheResult.data.total,
          newDataAvailable: false
        };
      }
      return prev;
    });
  }, []);

  const setNameFilter = (nameFilter?: string) => {
    const filterValue = nameFilter || 'all';
    localStorage.setItem('cronHistoryJobFilter', filterValue);
    
    setState(prev => ({
      ...prev,
      nameFilter,
      page: 1,
      history: [],
      hasMore: true,
      loading: true,
      stale: false
    }));
    
    fetchCronJobHistory(true);
  };

  const setSuccessFilter = (successFilter?: boolean) => {
    const filterValue = successFilter === undefined ? 'all' : successFilter ? 'success' : 'failed';
    localStorage.setItem('cronHistoryStatusFilter', filterValue);
    
    setState(prev => ({
      ...prev,
      successFilter,
      page: 1,
      history: [],
      hasMore: true,
      loading: true,
      stale: false
    }));
    
    fetchCronJobHistory(true);
  };

  const loadMore = () => {
    if (state.hasMore && !state.loading) {
      fetchCronJobHistory(true, true);
    }
  };

  const setStartDate = (startDate?: string) => {
    if (startDate) {
      localStorage.setItem('cronHistoryStartDate', startDate);
    } else {
      localStorage.removeItem('cronHistoryStartDate');
    }
    
    setState(prev => ({
      ...prev,
      startDate,
      page: 1,
      history: [],
      hasMore: true,
      loading: true,
      stale: false
    }));
    
    fetchCronJobHistory(true);
  };

  const setEndDate = (endDate?: string) => {
    if (endDate) {
      localStorage.setItem('cronHistoryEndDate', endDate);
    } else {
      localStorage.removeItem('cronHistoryEndDate');
    }
    
    setState(prev => ({
      ...prev,
      endDate,
      page: 1,
      history: [],
      hasMore: true,
      loading: true,
      stale: false
    }));
    
    fetchCronJobHistory(true);
  };

  const resetFilters = () => {
    localStorage.setItem('cronHistoryJobFilter', 'all');
    localStorage.setItem('cronHistoryStatusFilter', 'all');
    localStorage.setItem('cronHistorySortOrder', 'desc');
    localStorage.removeItem('cronHistoryStartDate');
    localStorage.removeItem('cronHistoryEndDate');
    
    setState(prev => ({
      ...prev,
      nameFilter: undefined,
      successFilter: undefined,
      sortOrder: 'desc',
      startDate: undefined,
      endDate: undefined,
      page: 1,
      history: [],
      hasMore: true,
      loading: true,
      stale: false
    }));
    
    fetchCronJobHistory(true);
  };

  const setPageSize = (pageSize: number) => {
    localStorage.setItem('cronHistoryPageSize', pageSize.toString());
    
    setState(prev => ({
      ...prev,
      pageSize,
      page: 1,
      history: [],
      hasMore: true,
      loading: true,
      stale: false
    }));
    
    fetchCronJobHistory(true);
  };

  const setPage = (page: number) => {
    setState(prev => ({
      ...prev,
      page,
      loading: true,
      stale: false
    }));
    
    fetchCronJobHistory(true);
  };

  const setSortOrder = (sortOrder: 'asc' | 'desc') => {
    localStorage.setItem('cronHistorySortOrder', sortOrder);
    
    setState(prev => ({
      ...prev,
      sortOrder,
      page: 1,
      history: [],
      hasMore: true,
      loading: true,
      stale: false
    }));
    
    fetchCronJobHistory(true);
  };

  return {
    history: state.history,
    loading: state.loading,
    stale: state.stale,
    page: state.page,
    pageSize: state.pageSize,
    sortOrder: state.sortOrder,
    totalItems: state.totalItems,
    totalPages: state.totalPages,
    nameFilter: state.nameFilter,
    successFilter: state.successFilter,
    startDate: state.startDate,
    endDate: state.endDate,
    newDataAvailable: state.newDataAvailable,
    hasMore: state.hasMore,
    fetchCronJobHistory,
    applyNewData,
    setNameFilter,
    setSuccessFilter,
    setSortOrder,
    setStartDate,
    setEndDate,
    loadMore,
    resetFilters,
    setPageSize,
    setPage,
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading }))
  };
};
