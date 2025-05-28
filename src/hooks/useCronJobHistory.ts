import { useState, useCallback, useEffect } from 'react';
import { getCronJobHistory, type CronJobHistory } from '../api/index';
import { saveCronJobHistoryToCache, getCronJobHistoryFromCache } from '../utils/cache-utils';

interface CronJobHistoryState {
  history: CronJobHistory[];
  loading: boolean;
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
  const cachedHistory = isCacheBust ? null : getCronJobHistoryFromCache();

  const [state, setState] = useState<CronJobHistoryState>({
    history: cachedHistory?.history || [],
    loading: !cachedHistory,
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
    const hasCache = getCronJobHistoryFromCache() !== null;
    const isBackgroundFetch = hasCache && !forceFetch && !state.loading;

    try {
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

      const cachedData = getCronJobHistoryFromCache();

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
      } else if (!isBackgroundFetch || isCacheBust) {
        const newHistory = append ? [...state.history, ...historyResponse.data] : historyResponse.data;
        const hasMore = historyResponse.pagination.has_next;

        setState(prev => ({
          ...prev,
          history: newHistory,
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
  }, [state.loading, setErrorWithScroll, isCacheBust, state.nameFilter, state.successFilter, state.page, state.pageSize, state.sortOrder, state.startDate, state.endDate, state.history]);

  // Auto-fetch when filters or page change
  useEffect(() => {
    if (state.loading) {
      fetchCronJobHistory(true);
    }
  }, [state.loading, fetchCronJobHistory]);

  // Initial fetch with saved filters
  useEffect(() => {
    fetchCronJobHistory(false);
  }, [fetchCronJobHistory]);

  const applyNewData = useCallback(() => {
    if (state.newDataAvailable) {
      const historyCache = getCronJobHistoryFromCache();
      if (historyCache) {
        setState(prev => ({
          ...prev,
          history: historyCache.history,
          newDataAvailable: false
        }));
      }
    }
  }, [state.newDataAvailable]);

  const setNameFilter = (nameFilter?: string) => {
    const filterValue = nameFilter || 'all';
    localStorage.setItem('cronHistoryJobFilter', filterValue);
    setState(prev => ({
      ...prev,
      nameFilter,
      page: 1,
      history: [],
      hasMore: true,
      loading: true
    }));
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
      loading: true
    }));
  };

  const loadMore = () => {
    if (state.hasMore && !state.loading) {
      setState(prev => ({ ...prev, loading: true }));
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
      loading: true
    }));
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
      loading: true
    }));
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
      loading: true
    }));
  };

  const setPageSize = (pageSize: number) => {
    localStorage.setItem('cronHistoryPageSize', pageSize.toString());
    setState(prev => ({
      ...prev,
      pageSize,
      page: 1,
      history: [],
      hasMore: true,
      loading: true
    }));
  };

  const setPage = (page: number) => {
    setState(prev => ({
      ...prev,
      page,
      loading: true
    }));
  };

  const setSortOrder = (sortOrder: 'asc' | 'desc') => {
    localStorage.setItem('cronHistorySortOrder', sortOrder);
    setState(prev => ({
      ...prev,
      sortOrder,
      page: 1,
      history: [],
      hasMore: true,
      loading: true
    }));
  };

  return {
    history: state.history,
    loading: state.loading,
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
