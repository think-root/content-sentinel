import { useCallback, useRef, useState } from 'react';
import { getArchivedRepositories } from '../api';
import type { ArchiveFilterKey, ArchiveFilterState, ArchivedRepository } from '../types/archive';
import {
  DEFAULT_ARCHIVE_FILTERS,
  DEFAULT_ARCHIVE_PAGE_SIZE,
  buildArchiveRequestBody,
  hasValidArchiveDateRanges,
  normalizeArchiveSortBy,
  normalizeArchiveSortOrder,
} from '../utils/archiveUtils';
import { getArchiveFromCache, saveArchiveToCache } from '../utils/cache-utils';
import { getApiSettings, isApiConfigured } from '../utils/api-settings';
import { useRepositoryLocalStorage } from './useRepositoryLocalStorage';

const CACHE_KEY_STORAGE = 'cache_archive_key';

/** Maps every filter field to the localStorage key that persists it. */
const FILTER_STORAGE_KEYS = {
  url: 'archiveUrlFilter',
  text: 'archiveTextFilter',
  dateAddedFrom: 'archiveDateAddedFrom',
  dateAddedTo: 'archiveDateAddedTo',
  datePostedFrom: 'archiveDatePostedFrom',
  datePostedTo: 'archiveDatePostedTo',
  dateArchivedFrom: 'archiveDateArchivedFrom',
  dateArchivedTo: 'archiveDateArchivedTo',
  sortBy: 'archiveSortBy',
  sortOrder: 'archiveSortOrder',
  pageSize: 'archivePageSize',
} as const;

interface ArchiveState {
  items: ArchivedRepository[];
  all: number;
  loading: boolean;
  stale: boolean;
  newDataAvailable: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  filters: ArchiveFilterState;
  showFilters: boolean;
}

interface UseArchiveProps {
  isCacheBust: boolean;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const useArchive = ({ isCacheBust, setErrorWithScroll }: UseArchiveProps) => {
  const { getStoredValue, setStoredValue } = useRepositoryLocalStorage();
  const cachedResult = isCacheBust ? null : getArchiveFromCache();
  const cached = cachedResult?.data;
  const isFetching = useRef(false);
  const latestRequestIdRef = useRef(0);

  const [state, setState] = useState<ArchiveState>(() => {
    const filters: ArchiveFilterState = {
      url: getStoredValue('archiveUrlFilter', ''),
      text: getStoredValue('archiveTextFilter', ''),
      dateAddedFrom: getStoredValue('archiveDateAddedFrom', ''),
      dateAddedTo: getStoredValue('archiveDateAddedTo', ''),
      datePostedFrom: getStoredValue('archiveDatePostedFrom', ''),
      datePostedTo: getStoredValue('archiveDatePostedTo', ''),
      dateArchivedFrom: getStoredValue('archiveDateArchivedFrom', ''),
      dateArchivedTo: getStoredValue('archiveDateArchivedTo', ''),
      sortBy: normalizeArchiveSortBy(getStoredValue('archiveSortBy', DEFAULT_ARCHIVE_FILTERS.sortBy)),
      sortOrder: normalizeArchiveSortOrder(getStoredValue('archiveSortOrder', DEFAULT_ARCHIVE_FILTERS.sortOrder)),
      pageSize: getStoredValue('archivePageSize', DEFAULT_ARCHIVE_PAGE_SIZE),
    };

    return {
      items: cached?.items || [],
      all: cached?.all || 0,
      loading: !cached || cached.items.length === 0,
      stale: cachedResult?.isStale || false,
      newDataAvailable: false,
      currentPage: cached?.pagination.currentPage || 1,
      totalPages: cached?.pagination.totalPages || 1,
      totalItems: cached?.pagination.totalItems || 0,
      filters,
      showFilters: getStoredValue('archiveShowFilters', false),
    };
  });

  const fetchArchive = useCallback(async (
    forceFetch: boolean = false,
    overrides?: Partial<ArchiveFilterState> & { page?: number }
  ) => {
    if (isFetching.current && !forceFetch) {
      return;
    }

    const effectiveFilters: ArchiveFilterState = { ...state.filters, ...overrides };
    const effectivePage = overrides?.page ?? state.currentPage;

    // Bail out before claiming the request id: an inverted range sends no request, and bumping the
    // id here would strand an in-flight fetch (its finally block would skip clearing isFetching).
    // loading is cleared explicitly - the filter panel shows the range error instead.
    if (!hasValidArchiveDateRanges(effectiveFilters)) {
      setState(prev => (prev.loading ? { ...prev, loading: false } : prev));
      return;
    }

    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    const textLanguage = getApiSettings().displayLanguage || undefined;
    const requestBody = buildArchiveRequestBody(effectiveFilters, effectivePage, textLanguage);
    const cacheKey = JSON.stringify(requestBody);

    const cacheResult = getArchiveFromCache();
    const hasCache = cacheResult?.data !== undefined;
    const storedCacheKey = localStorage.getItem(CACHE_KEY_STORAGE);
    const isBackgroundFetch = hasCache && storedCacheKey === cacheKey && !forceFetch;

    try {
      isFetching.current = true;

      if (!isBackgroundFetch) {
        setState(prev => ({ ...prev, loading: true }));
      }

      const response = await getArchivedRepositories(requestBody);

      if (requestId !== latestRequestIdRef.current) {
        return;
      }

      if (!response?.data?.items) {
        throw new Error(response?.message || 'Invalid response format');
      }

      const { data } = response;
      // With pagination disabled ("All") the server echoes page 0 / total_pages 1 - normalize it for the UI
      const pagination = effectiveFilters.pageSize > 0
        ? {
            currentPage: data.page || effectivePage,
            pageSize: data.page_size,
            totalPages: data.total_pages || 1,
            totalItems: data.total_items,
          }
        : {
            currentPage: 1,
            pageSize: 0,
            totalPages: 1,
            totalItems: data.total_items || data.items.length,
          };

      localStorage.setItem(CACHE_KEY_STORAGE, cacheKey);

      const cachePayload = {
        items: data.items,
        all: data.all,
        pagination,
        timestamp: Date.now(),
      };

      // Under cache_bust the deferred newDataAvailable path is skipped entirely: applyNewData reads
      // from the cache, which is not written in that mode, so it would push stale rows back in.
      if (isBackgroundFetch && cacheResult?.data && !isCacheBust) {
        const hasChanges = JSON.stringify(data.items) !== JSON.stringify(cacheResult.data.items);

        if (hasChanges) {
          saveArchiveToCache(cachePayload);
          setState(prev => ({ ...prev, newDataAvailable: true, stale: false }));
        } else {
          setState(prev => ({ ...prev, stale: false }));
        }
        return;
      }

      saveArchiveToCache(cachePayload);
      setState(prev => ({
        ...prev,
        items: data.items,
        all: data.all,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        stale: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('Rate limit exceeded')) {
        console.warn('[useArchive] Rate limit exceeded. Please try again later.');
        return;
      }

      if (isBackgroundFetch) {
        setState(prev => ({ ...prev, stale: true }));
        return;
      }

      if (isApiConfigured()) {
        setErrorWithScroll(`Failed to fetch archived repositories: ${message}`, 'archive-error');
      }
    } finally {
      if (requestId === latestRequestIdRef.current) {
        isFetching.current = false;
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, [state.filters, state.currentPage, isCacheBust, setErrorWithScroll]);

  const setFilter = useCallback(<K extends ArchiveFilterKey>(key: K, value: ArchiveFilterState[K]) => {
    setStoredValue(FILTER_STORAGE_KEYS[key], value);
    setState(prev => ({ ...prev, filters: { ...prev.filters, [key]: value }, currentPage: 1 }));
    fetchArchive(true, { [key]: value, page: 1 } as Partial<ArchiveFilterState> & { page: number });
  }, [fetchArchive, setStoredValue]);

  const setPage = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
    fetchArchive(true, { page });
  }, [fetchArchive]);

  const resetFilters = useCallback(() => {
    (Object.keys(FILTER_STORAGE_KEYS) as ArchiveFilterKey[]).forEach(key => {
      setStoredValue(FILTER_STORAGE_KEYS[key], DEFAULT_ARCHIVE_FILTERS[key]);
    });
    setState(prev => ({ ...prev, filters: { ...DEFAULT_ARCHIVE_FILTERS }, currentPage: 1 }));
    fetchArchive(true, { ...DEFAULT_ARCHIVE_FILTERS, page: 1 });
  }, [fetchArchive, setStoredValue]);

  const toggleFilters = useCallback(() => {
    setState(prev => {
      const showFilters = !prev.showFilters;
      setStoredValue('archiveShowFilters', showFilters);
      return { ...prev, showFilters };
    });
  }, [setStoredValue]);

  const refreshArchive = useCallback(async () => {
    await fetchArchive(true);
  }, [fetchArchive]);

  const applyNewData = useCallback(() => {
    const cacheResult = getArchiveFromCache();
    if (!cacheResult?.data) return;

    const { data } = cacheResult;
    setState(prev => ({
      ...prev,
      items: data.items,
      all: data.all,
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalItems: data.pagination.totalItems,
      newDataAvailable: false,
    }));
  }, []);

  return {
    items: state.items,
    all: state.all,
    loading: state.loading,
    stale: state.stale,
    newDataAvailable: state.newDataAvailable,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalItems: state.totalItems,
    filters: state.filters,
    showFilters: state.showFilters,
    fetchArchive,
    setFilter,
    setPage,
    resetFilters,
    toggleFilters,
    refreshArchive,
    applyNewData,
  };
};
