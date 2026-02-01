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
  
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const hasFetched = useRef(false);

  const fetchConfigs = useCallback(async (forceFetch = false) => {
    const isConfigured = isApiConfigured();
    
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    // Skip if already fetched unless force fetch
    if (hasFetched.current && !forceFetch && !isCacheBust) {
      return;
    }

    setLoading(true);
    try {
      const data = await getApiConfigs();
      setConfigs(data);
      hasFetched.current = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch API configs';
      setErrorWithScroll?.(errorMessage, 'api-configs-fetch-error');
    } finally {
      setLoading(false);
    }
  }, [isCacheBust, setErrorWithScroll]);

  const addConfig = useCallback(async (config: CreateApiConfigRequest): Promise<ApiConfig> => {
    setSaving(true);
    try {
      const newConfig = await createApiConfig(config);
      setConfigs(prev => [...prev, newConfig]);
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
      setConfigs(prev => prev.map(c => c.name === name ? updatedConfig : c));
      return updatedConfig;
    } finally {
      setSaving(false);
    }
  }, []);

  const removeConfig = useCallback(async (name: string): Promise<void> => {
    setDeleting(true);
    try {
      await deleteApiConfig(name);
      setConfigs(prev => prev.filter(c => c.name !== name));
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
