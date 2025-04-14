import { useCallback } from 'react';
import { manualGenerate, autoGenerate, ManualGenerateResponse } from '../api';

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;

interface UseGenerateHandlersProps {
  fetchRepositories: () => Promise<void>;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const useGenerateHandlers = ({ fetchRepositories, setErrorWithScroll }: UseGenerateHandlersProps) => {
  const handleManualGenerate = useCallback(async (url: string): Promise<ManualGenerateResponse> => {
    try {
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const response = await manualGenerate(url);
      if (response.status === 'ok') {
        const added = response.added || [];

        if (added.length > 0) {
          const scrollPosition = window.scrollY;
          await fetchRepositories();
          window.scrollTo(0, scrollPosition);
        }
      }
      return response;
    } catch {
      setErrorWithScroll('Failed to connect to Content Alchemist API', 'content-alchemist-error');
      return { status: 'error' };
    }
  }, [fetchRepositories, setErrorWithScroll]);

  const handleAutoGenerate = useCallback(async (maxRepos: number, since: string, spokenLanguageCode: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const response = await autoGenerate(maxRepos, since, spokenLanguageCode);
      if (response.status === 'ok') {
        fetchRepositories();
      }
      return response;
    } catch {
      setErrorWithScroll('Failed to connect to Content Alchemist API', 'content-alchemist-error');
      return { status: 'error', added: [], dont_added: [] };
    }
  }, [fetchRepositories, setErrorWithScroll]);

  return {
    handleManualGenerate,
    handleAutoGenerate
  };
};