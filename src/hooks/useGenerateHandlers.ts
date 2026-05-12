import { useCallback } from 'react';
import { manualGenerate, autoGenerate, ManualGenerateResponse } from '../api';
import type { RepositorySortBy, RepositorySortOrder } from '../types';
import {
  DEFAULT_REPOSITORY_SORT_BY,
  DEFAULT_REPOSITORY_SORT_ORDER,
  normalizeRepositorySortBy,
  normalizeRepositorySortOrder,
  PUBLICATION_QUEUE_SORT_BY,
} from '../utils/repositoryListUtils';

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;

interface UseGenerateHandlersProps {
  fetchRepositories: (
    statusFilter?: boolean,
    append?: boolean,
    fetchAll?: boolean,
    itemsPerPage?: number,
    sortBy?: RepositorySortBy,
    sortOrder?: RepositorySortOrder,
    page?: number,
    forceFetch?: boolean
  ) => Promise<void>;
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
          const savedSortBy = normalizeRepositorySortBy(localStorage.getItem('dashboardSortBy') || DEFAULT_REPOSITORY_SORT_BY);
          const savedSortOrder = normalizeRepositorySortOrder(
            localStorage.getItem('dashboardSortOrder') || DEFAULT_REPOSITORY_SORT_ORDER,
            savedSortBy
          );
          const itemsStr = localStorage.getItem('dashboardItemsPerPage');
          const savedItemsPerPage = itemsStr !== null ? Number(itemsStr) : undefined;

          // Compute posted filter
          const posted = savedSortBy === PUBLICATION_QUEUE_SORT_BY
            ? false
            : savedStatusFilter === 'all' ? undefined : savedStatusFilter === 'posted';

          // Foreground fetch with current filters and forceFetch=true; use page=1
          await fetchRepositories(
            posted,
            false,
            savedItemsPerPage === 0,
            savedItemsPerPage,
            savedSortBy,
            savedSortOrder,
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

  const handleAutoGenerate = useCallback(async (
    maxRepos: number,
    resource: string,
    since: string,
    spokenLanguageCode: string,
    period: string,
    language: string
  ): Promise<ManualGenerateResponse> => {
    try {
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const response = await autoGenerate(maxRepos, resource, since, spokenLanguageCode, period, language);
      if (response.status === 'ok') {
        // Read current filters from localStorage
        const savedStatusFilter = (localStorage.getItem('dashboardStatusFilter') || 'all') as 'all' | 'posted' | 'unposted';
        const savedSortBy = normalizeRepositorySortBy(localStorage.getItem('dashboardSortBy') || DEFAULT_REPOSITORY_SORT_BY);
        const savedSortOrder = normalizeRepositorySortOrder(
          localStorage.getItem('dashboardSortOrder') || DEFAULT_REPOSITORY_SORT_ORDER,
          savedSortBy
        );
        const itemsStr = localStorage.getItem('dashboardItemsPerPage');
        const savedItemsPerPage = itemsStr !== null ? Number(itemsStr) : undefined;

        // Compute posted filter
        const posted = savedSortBy === PUBLICATION_QUEUE_SORT_BY
          ? false
          : savedStatusFilter === 'all' ? undefined : savedStatusFilter === 'posted';

        // Foreground fetch with current filters and forceFetch=true; use page=1
        await fetchRepositories(
          posted,
          false,
          savedItemsPerPage === 0,
          savedItemsPerPage,
          savedSortBy,
          savedSortOrder,
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
