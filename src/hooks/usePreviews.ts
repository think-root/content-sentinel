import { useState, useCallback } from 'react';
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
  newDataAvailable: boolean;
}

interface UsePreviewsProps {
  isCacheBust: boolean;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const usePreviews = ({ isCacheBust, setErrorWithScroll }: UsePreviewsProps) => {
  const cachedPreviews = isCacheBust ? null : getPreviewsFromCache();

  const [state, setState] = useState<PreviewsState>({
    latestPost: cachedPreviews?.latestPost,
    nextPost: cachedPreviews?.nextPost,
    loading: !cachedPreviews,
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

      const cachedData = getPreviewsFromCache();

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
      const hasCache = getPreviewsFromCache() !== null;

      const isBackgroundFetch = hasCache && !forceFetch && !state.loading;
      if (!hasCache && !forceFetch) {
        setState((prev) => ({ ...prev, loading: true }));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loading, setErrorWithScroll, isCacheBust]);

  const applyNewData = useCallback(() => {
    if (state.newDataAvailable) {
      const previewsCache = getPreviewsFromCache();
      if (previewsCache) {
        setState(prev => ({
          ...prev,
          latestPost: previewsCache.latestPost,
          nextPost: previewsCache.nextPost,
          newDataAvailable: false
        }));
      }
    }
  }, [state.newDataAvailable]);

  return {
    latestPost: state.latestPost,
    nextPost: state.nextPost,
    loading: state.loading,
    newDataAvailable: state.newDataAvailable,
    fetchPreviews,
    applyNewData,
    setLoading: (loading: boolean) => setState(prev => ({ ...prev, loading }))
  };
};