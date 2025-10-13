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

          // Read current filters from localStorage
          const savedStatusFilter = (localStorage.getItem('dashboardStatusFilter') || 'all') as 'all' | 'posted' | 'unposted';
          const savedSortBy = (localStorage.getItem('dashboardSortBy') || 'date_added') as 'id' | 'date_added' | 'date_posted';
          const savedSortOrder = (localStorage.getItem('dashboardSortOrder') || 'DESC') as 'ASC' | 'DESC';
          const itemsStr = localStorage.getItem('dashboardItemsPerPage');
          const savedItemsPerPage = itemsStr !== null ? Number(itemsStr) : undefined;

          // Compute posted filter
          const posted = savedStatusFilter === 'all' ? undefined : savedStatusFilter === 'posted';

          // Foreground fetch with current filters and forceFetch=true; use page=1
          await fetchRepositories(
            posted,
            false,
            savedItemsPerPage === 0,
            savedItemsPerPage,
            savedSortBy || 'date_added',
            savedSortOrder || 'DESC',
            1,
            true
          );

          // Restore prior scroll position
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
        // Read current filters from localStorage
        const savedStatusFilter = (localStorage.getItem('dashboardStatusFilter') || 'all') as 'all' | 'posted' | 'unposted';
        const savedSortBy = (localStorage.getItem('dashboardSortBy') || 'date_added') as 'id' | 'date_added' | 'date_posted';
        const savedSortOrder = (localStorage.getItem('dashboardSortOrder') || 'DESC') as 'ASC' | 'DESC';
        const itemsStr = localStorage.getItem('dashboardItemsPerPage');
        const savedItemsPerPage = itemsStr !== null ? Number(itemsStr) : undefined;

        // Compute posted filter
        const posted = savedStatusFilter === 'all' ? undefined : savedStatusFilter === 'posted';

        // Foreground fetch with current filters and forceFetch=true; use page=1
        await fetchRepositories(
          posted,
          false,
          savedItemsPerPage === 0,
          savedItemsPerPage,
          savedSortBy || 'date_added',
          savedSortOrder || 'DESC',
          1,
          true
        );
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