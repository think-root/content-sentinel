import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ApiConfig,
  CreateApiConfigRequest,
  UpdateApiConfigRequest,
  getApiConfigs,
  createApiConfig,
  updateApiConfig,
  deleteApiConfig,
} from '@/api/api-configs';
import { isApiConfigured } from '@/utils/api-settings';
import { saveApiConfigsToCache, getApiConfigsFromCache } from '@/utils/cache-utils';

interface UseApiConfigsOptions {
  isCacheBust?: boolean;
  setErrorWithScroll?: (message: string, toastId?: string) => void;
}

interface UseApiConfigsReturn {
  configs: ApiConfig[];
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  fetchConfigs: (forceFetch?: boolean) => Promise<void>;
  addConfig: (config: CreateApiConfigRequest) => Promise<ApiConfig>;
  editConfig: (name: string, updates: UpdateApiConfigRequest) => Promise<ApiConfig>;
  removeConfig: (name: string) => Promise<void>;
}

export const useApiConfigs = (options: UseApiConfigsOptions = {}): UseApiConfigsReturn => {
  const { isCacheBust = false, setErrorWithScroll } = options;
  
  // Get cached data on initial load
  const cachedResult = isCacheBust ? null : getApiConfigsFromCache();
  const cachedConfigs = cachedResult?.data?.configs;

  const [configs, setConfigs] = useState<ApiConfig[]>(cachedConfigs || []);
  // Only show loading if there's no cached data
  const [loading, setLoading] = useState(!cachedConfigs || cachedConfigs.length === 0);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const hasFetched = useRef(false);
  const isFetching = useRef(false);

  const fetchConfigs = useCallback(async (forceFetch = false) => {
    const isConfigured = isApiConfigured();
    
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (isFetching.current) {
      return;
    }

    // Skip if already fetched unless force fetch
    if (hasFetched.current && !forceFetch && !isCacheBust) {
      return;
    }

    // Determine if this is a background fetch (has cached data)
    const cachedData = getApiConfigsFromCache();
    const isBackgroundFetch = !!cachedData?.data?.configs && !forceFetch;

    // Only set loading true if no cache
    if (!isBackgroundFetch) {
      setLoading(true);
    }

    isFetching.current = true;
    try {
      const data = await getApiConfigs();

      // Update state with new data
      setConfigs(data);
      hasFetched.current = true;

      // Save to cache
      saveApiConfigsToCache({
        configs: data,
        timestamp: Date.now()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch API configs';
      // Only show error if not a background fetch
      if (!isBackgroundFetch) {
        setErrorWithScroll?.(errorMessage, 'api-configs-fetch-error');
      }
    } finally {
      isFetching.current = false;
      setLoading(false);
    }
  }, [isCacheBust, setErrorWithScroll]);

  const addConfig = useCallback(async (config: CreateApiConfigRequest): Promise<ApiConfig> => {
    setSaving(true);
    try {
      const newConfig = await createApiConfig(config);
      setConfigs(prev => {
        const updated = [...prev, newConfig];
        saveApiConfigsToCache({ configs: updated, timestamp: Date.now() });
        return updated;
      });
      return newConfig;
    } finally {
      setSaving(false);
    }
  }, []);

  const editConfig = useCallback(async (
    name: string,
    updates: UpdateApiConfigRequest
  ): Promise<ApiConfig> => {
    setSaving(true);
    try {
      const updatedConfig = await updateApiConfig(name, updates);
      setConfigs(prev => {
        const updated = prev.map(c => c.name === name ? updatedConfig : c);
        saveApiConfigsToCache({ configs: updated, timestamp: Date.now() });
        return updated;
      });
      return updatedConfig;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeConfig = useCallback(async (name: string): Promise<void> => {
    setDeleting(true);
    try {
      await deleteApiConfig(name);
      setConfigs(prev => {
        const updated = prev.filter(c => c.name !== name);
        saveApiConfigsToCache({ configs: updated, timestamp: Date.now() });
        return updated;
      });
    } finally {
      setDeleting(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    configs,
    loading,
    saving,
    deleting,
    fetchConfigs,
    addConfig,
    editConfig,
    removeConfig,
  };
};
