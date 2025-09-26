import { useState, useCallback, useEffect } from 'react';
import { getLatestPostedRepository, getNextRepository } from '../api';
import type { Repository } from '../types';
import { savePreviewsToCache, getPreviewsFromCache } from '../utils/cache-utils';
import { comparePreviews } from '../utils/data-comparison';
import { isApiConfigured } from '../utils/api-settings';

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;

interface PreviewsState {
  latestPost?: Repository;
  nextPost?: Repository;
  loading: boolean;
  stale: boolean;
  newDataAvailable: boolean;
}

interface UsePreviewsProps {
  isCacheBust: boolean;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const usePreviews = ({ isCacheBust, setErrorWithScroll }: UsePreviewsProps) => {
  const cachedPreviewsResult = isCacheBust ? null : getPreviewsFromCache();
  const cachedPreviews = cachedPreviewsResult?.data;

  const [state, setState] = useState<PreviewsState>({
    latestPost: cachedPreviews?.latestPost,
    nextPost: cachedPreviews?.nextPost,
    loading: !cachedPreviews || (!cachedPreviews.latestPost && !cachedPreviews.nextPost),
    stale: cachedPreviewsResult?.isStale || false,
    newDataAvailable: false
  });

  const fetchPreviewsFromAPI = async (isBackgroundFetch: boolean = false) => {
    try {
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const [latestResponse, nextResponse] = await Promise.all([
        getLatestPostedRepository(),
        getNextRepository(),
      ]);

      const latestPostData = latestResponse.data.items[0];
      const nextPostData = nextResponse.data.items[0];

      const newData = {
        latestPost: latestPostData,
        nextPost: nextPostData
      };

      const cachedDataResult = getPreviewsFromCache();
      const cachedData = cachedDataResult?.data;

      if (isBackgroundFetch && cachedData) {
        const hasChanges = comparePreviews(newData, cachedData);

        if (hasChanges) {
          setTimeout(() => {
            setState(prev => ({ ...prev, newDataAvailable: true }));
          }, 100);

          if (!isCacheBust) {
            savePreviewsToCache({
              latestPost: latestPostData,
              nextPost: nextPostData,
              timestamp: Date.now()
            });
          }
        }
      } else if (!isBackgroundFetch || isCacheBust) {
        setState(prev => ({
          ...prev,
          latestPost: latestPostData,
          nextPost: nextPostData
        }));

        savePreviewsToCache({
          latestPost: latestPostData,
          nextPost: nextPostData,
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

  const fetchPreviews = useCallback(async (forceFetch: boolean = false) => {
    try {
      const cacheResult = getPreviewsFromCache();
      const hasCache = cacheResult?.data !== undefined;

      // If there's any cache, do a background fetch (stale-while-revalidate)
      const isBackgroundFetch = hasCache && !forceFetch && !state.loading;
      
      if (!hasCache && !forceFetch) {
        setState((prev) => ({ ...prev, loading: true }));
      } else if (hasCache && !forceFetch) {
        // Set stale state if cache is stale
        setState(prev => ({ ...prev, stale: cacheResult?.isStale || false }));
      }

      await fetchPreviewsFromAPI(isBackgroundFetch);
    } catch {
      if (!isApiConfigured()) {
        setState(prev => ({ ...prev, loading: false }));
      } else {
        setErrorWithScroll('Failed to connect to Content Alchemist API', 'content-alchemist-error');
        setState(prev => ({ ...prev, loading: false }));
      }
    }
  }, [setErrorWithScroll, isCacheBust]);

  const applyNewData = useCallback(() => {
    if (state.newDataAvailable) {
      const previewsCacheResult = getPreviewsFromCache();
      if (previewsCacheResult?.data) {
        setState(prev => ({
          ...prev,
          latestPost: previewsCacheResult.data.latestPost,
          nextPost: previewsCacheResult.data.nextPost,
          newDataAvailable: false
        }));
      }
    }
  }, []);

  // Add useEffect for initial loading
  useEffect(() => {
    fetchPreviews(false);
  }, []);

  return {
    latestPost: state.latestPost,
    nextPost: state.nextPost,
    loading: state.loading,
    stale: state.stale,
    newDataAvailable: state.newDataAvailable,
    fetchPreviews,
    applyNewData,
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading }))
  };
};