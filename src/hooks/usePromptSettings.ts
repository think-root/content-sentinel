import { useState, useCallback, useRef, useEffect } from 'react';
import { getPromptSettings, updatePromptSettings, PromptSettings } from '../api';

interface UsePromptSettingsReturn {
  settings: PromptSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchSettings: (forceFetch?: boolean) => Promise<void>;
  updateSettings: (settings: Partial<PromptSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const defaultSettings: PromptSettings = {
  use_direct_url: true,
  llm_provider: "openai",
  model: "gpt-4.1",
  temperature: 0.5,
  content: "You are an AI assistant specializing in the creation of short descriptions of GitHub repositories in Ukrainian. Your main task is to create descriptions based on the URL.",
  llm_output_language: ""
};

export function usePromptSettings(): UsePromptSettingsReturn {
  // Initialize from cache when available to avoid showing skeletons on tab switch
  const cached = (() => {
    try {
      const raw = localStorage.getItem('promptSettings');
      return raw ? (JSON.parse(raw) as PromptSettings) : null;
    } catch {
      return null;
    }
  })();

  const [settings, setSettings] = useState<PromptSettings | null>(cached);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetching = useRef<boolean>(false);
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchSettings = useCallback(async (forceFetch?: boolean) => {
    // Debounce rapid calls (100ms delay)
    if (fetchTimeout.current) {
      clearTimeout(fetchTimeout.current);
    }

    // Return early if already fetching
    if (isFetching.current) return;

    // Set fetching flag
    isFetching.current = true;

    const hasCache = Boolean(settings || localStorage.getItem('promptSettings'));
    const isBackgroundFetch = hasCache && !forceFetch;

    try {
      if (!isBackgroundFetch) {
        setLoading(true);
      }
      setError(null);

      const data = await getPromptSettings();
      setSettings(data);

      // Cache the settings
      localStorage.setItem('promptSettings', JSON.stringify(data));
    } catch (err) {
      // Handle 429 errors silently (rate limiting)
      const isRateLimitError = err instanceof Error && (
        err.message.includes('429') ||
        err.message.includes('Rate limit') ||
        err.message.includes('rate limit')
      );
      
      if (!isRateLimitError) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prompt settings';
        setError(errorMessage);
        console.error('Prompt settings fetch error:', errorMessage);
      }

      // Try to load from cache or use defaults if we don't already have settings
      if (!hasCache || !settings) {
        const cachedRaw = localStorage.getItem('promptSettings');
        if (cachedRaw) {
          try {
            setSettings(JSON.parse(cachedRaw));
          } catch {
            setSettings(defaultSettings);
          }
        } else {
          setSettings(defaultSettings);
        }
      }
    } finally {
      // Clear fetching flag after a small delay to prevent rapid successive calls
      fetchTimeout.current = setTimeout(() => {
        isFetching.current = false;
        if (fetchTimeout.current) {
          clearTimeout(fetchTimeout.current);
          fetchTimeout.current = null;
        }
      }, 100); // 100ms debounce delay

      if (!isBackgroundFetch) {
        setLoading(false);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, settings]);

  // Cleanup effect to clear timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeout.current) {
        clearTimeout(fetchTimeout.current);
      }
    };
  }, []);

  const updateSettings = useCallback(async (updatedSettings: Partial<PromptSettings>) => {
    if (saving) return;
    
    setSettings(currentSettings => {
      if (!currentSettings) return currentSettings;
      
      const previousSettings = { ...currentSettings };
      const newSettings = { ...currentSettings, ...updatedSettings };
      
      (async () => {
        try {
          setSaving(true);
          setError(null);
          
          const response = await updatePromptSettings(updatedSettings);
          
          if (response.status === 'success') {
            // Update cache
            localStorage.setItem('promptSettings', JSON.stringify(newSettings));
          } else {
            throw new Error(response.message || 'Failed to update prompt settings');
          }
        } catch (err) {
          // Rollback on error
          setSettings(previousSettings);
          
          const errorMessage = err instanceof Error ? err.message : 'Failed to update prompt settings';
          setError(errorMessage);
          console.error('Prompt settings update error:', errorMessage);
        } finally {
          setSaving(false);
        }
      })();
      
      return newSettings;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetToDefaults = useCallback(async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      setError(null);
      
      // Optimistically update to defaults
      setSettings(defaultSettings);
      
      // Send defaults to server
      const response = await updatePromptSettings(defaultSettings);
      
      if (response.status === 'success') {
        // Update cache with defaults
        localStorage.setItem('promptSettings', JSON.stringify(defaultSettings));
      } else {
        throw new Error(response.message || 'Failed to reset to defaults');
      }
    } catch (err) {
      // On error, fetch current settings from server to restore correct state
      try {
        const data = await getPromptSettings();
        setSettings(data);
        localStorage.setItem('promptSettings', JSON.stringify(data));
      } catch (fetchErr) {
        // If fetch also fails, keep the defaults but show error
        console.error('Failed to fetch settings after reset error:', fetchErr);
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset to defaults';
      setError(errorMessage);
      console.error('Reset to defaults error:', errorMessage);
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    settings,
    loading,
    saving,
    error,
    fetchSettings,
    updateSettings,
    resetToDefaults
  };
}