import { useState, useCallback, useEffect } from 'react';
import { getCronJobs, type CronJob } from '../api/index';
import { saveCronJobsToCache, getCronJobsFromCache } from '../utils/cache-utils';
import { compareCronJobs } from '../utils/data-comparison';
import { isApiConfigured } from '../utils/api-settings';

interface CronJobsState {
  cronJobs: CronJob[];
  loading: boolean;
  stale: boolean;
  newDataAvailable: boolean;
}

interface UseCronJobsProps {
  isCacheBust: boolean;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const useCronJobs = ({ isCacheBust, setErrorWithScroll }: UseCronJobsProps) => {
  const cachedCronJobsResult = isCacheBust ? null : getCronJobsFromCache();
  const cachedCronJobs = cachedCronJobsResult?.data;
  const isCachedDataStale = cachedCronJobsResult?.isStale || false;

  const [state, setState] = useState<CronJobsState>({
    cronJobs: cachedCronJobs?.cronJobs || [],
    loading: !cachedCronJobs, // Only show loading when there's no cached data at all
    stale: isCachedDataStale,
    newDataAvailable: false
  });

  const fetchCronJobsFromAPI = async (isBackgroundFetch: boolean = false) => {
    try {
      const cronJobsResponse = await getCronJobs();

      const cachedDataResult = getCronJobsFromCache();
      const cachedData = cachedDataResult?.data;

      if (isBackgroundFetch && cachedData) {
        const hasChanges = compareCronJobs(cronJobsResponse, cachedData.cronJobs);

        if (hasChanges) {
          setTimeout(() => {
            setState(prev => ({ ...prev, newDataAvailable: true }));
          }, 100);

          if (!isCacheBust) {
            saveCronJobsToCache({
              cronJobs: cronJobsResponse,
              timestamp: Date.now()
            });
          }
        }
      } else if (!isBackgroundFetch || isCacheBust) {
        setState(prev => ({
          ...prev,
          cronJobs: cronJobsResponse,
          stale: false // Reset stale state when we get fresh data
        }));

        saveCronJobsToCache({
          cronJobs: cronJobsResponse,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      if (!isBackgroundFetch || isCacheBust) {
        throw error;
      }
    } finally {
      if (!isBackgroundFetch || isCacheBust) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const fetchCronJobs = useCallback(async (forceFetch: boolean = false) => {
    try {
      const cacheResult = getCronJobsFromCache();
      const hasCache = cacheResult?.data !== undefined;
      // const isCacheStale = cacheResult?.isStale || false;

      // Always perform background fetch when there's cache (even if stale)
      const isBackgroundFetch = hasCache && !forceFetch;
      
      // Only show loading skeletons when there's no cached data at all
      if (!hasCache && !forceFetch) {
        setState((prev) => ({ ...prev, loading: true }));
      }

      await fetchCronJobsFromAPI(isBackgroundFetch);

      // Update stale state if we just fetched fresh data
      if (!isBackgroundFetch || isCacheBust) {
        setState(prev => ({ ...prev, stale: false }));
      }
    } catch {
      if (!isApiConfigured()) {
        setState(prev => ({ ...prev, loading: false }));
      } else {
        setErrorWithScroll('Failed to connect to Content Maestro API', 'content-maestro-error');
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setErrorWithScroll, isCacheBust]);

  const applyNewData = useCallback(() => {
    if (state.newDataAvailable) {
      const cronJobsCacheResult = getCronJobsFromCache();
      if (cronJobsCacheResult?.data) {
        setState(prev => ({
          ...prev,
          cronJobs: cronJobsCacheResult.data.cronJobs,
          stale: false, // Reset stale state when applying new data
          newDataAvailable: false
        }));
      }
    }
  }, []);

  // Add initial loading effect
  useEffect(() => {
    fetchCronJobs(false);
  }, []);

  return {
    cronJobs: state.cronJobs,
    loading: state.loading,
    stale: state.stale,
    newDataAvailable: state.newDataAvailable,
    fetchCronJobs,
    applyNewData,
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading }))
  };
};