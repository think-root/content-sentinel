import { useState, useCallback } from 'react';
import { getCronJobs, type CronJob } from '../api/index';
import { saveCronJobsToCache, getCronJobsFromCache } from '../utils/cache-utils';
import { compareCronJobs } from '../utils/data-comparison';
import { isApiConfigured } from '../utils/api-settings';

interface CronJobsState {
  cronJobs: CronJob[];
  loading: boolean;
  newDataAvailable: boolean;
}

interface UseCronJobsProps {
  isCacheBust: boolean;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const useCronJobs = ({ isCacheBust, setErrorWithScroll }: UseCronJobsProps) => {
  const cachedCronJobs = isCacheBust ? null : getCronJobsFromCache();

  const [state, setState] = useState<CronJobsState>({
    cronJobs: cachedCronJobs?.cronJobs || [],
    loading: !cachedCronJobs,
    newDataAvailable: false
  });

  const fetchCronJobsFromAPI = async (isBackgroundFetch: boolean = false) => {
    try {
      const cronJobsResponse = await getCronJobs();

      const cachedData = getCronJobsFromCache();

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
          cronJobs: cronJobsResponse
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
      const hasCache = getCronJobsFromCache() !== null;

      const isBackgroundFetch = hasCache && !forceFetch && !state.loading;
      if (!hasCache && !forceFetch) {
        setState((prev) => ({ ...prev, loading: true }));
      }

      await fetchCronJobsFromAPI(isBackgroundFetch);
    } catch {
      if (!isApiConfigured()) {
        // Don't show error if API is not configured
  
     setState(prev => ({ ...prev, loading: false }));
      } else {
        setErrorWithScroll('Failed to connect to Content Maestro API', 'content-maestro-error');
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loading, setErrorWithScroll, isCacheBust]);

  const applyNewData = useCallback(() => {
    if (state.newDataAvailable) {
      const cronJobsCache = getCronJobsFromCache();
      if (cronJobsCache) {
        setState(prev => ({
          ...prev,
          cronJobs: cronJobsCache.cronJobs,
          newDataAvailable: false
        }));
      }
    }
  }, [state.newDataAvailable]);

  return {
    cronJobs: state.cronJobs,
    loading: state.loading,
    newDataAvailable: state.newDataAvailable,
    fetchCronJobs,
    applyNewData,
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading }))
  };
};