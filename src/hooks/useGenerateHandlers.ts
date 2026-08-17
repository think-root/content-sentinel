import { useCallback } from 'react';
import { manualGenerate, autoGenerate, ManualGenerateResponse } from '../api';
import { alchemistErrorMessage } from '../utils/api-error';
import type { RepositorySortBy, RepositorySortOrder } from '../types';
import {
  DEFAULT_REPOSITORY_SORT_BY,
  DEFAULT_REPOSITORY_SORT_ORDER,
  DEFAULT_REPOSITORY_STATUS_FILTER,
  normalizeRepositoryFilterState,
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
          const savedFilters = normalizeRepositoryFilterState(
            localStorage.getItem('dashboardStatusFilter') || DEFAULT_REPOSITORY_STATUS_FILTER,
            localStorage.getItem('dashboardSortBy') || DEFAULT_REPOSITORY_SORT_BY,
            localStorage.getItem('dashboardSortOrder') || DEFAULT_REPOSITORY_SORT_ORDER
          );
          const itemsStr = localStorage.getItem('dashboardItemsPerPage');
          const savedItemsPerPage = itemsStr !== null ? Number(itemsStr) : undefined;

          // Foreground fetch with current filters and forceFetch=true; use page=1
          await fetchRepositories(
            savedFilters.posted,
            false,
            savedItemsPerPage === 0,
            savedItemsPerPage,
            savedFilters.sortBy,
            savedFilters.sortOrder,
            1,
            true
          );

          // Restore prior scroll position
          window.scrollTo(0, scrollPosition);
        }
      }
      return response;
    } catch (error) {
      setErrorWithScroll(alchemistErrorMessage(error), 'content-alchemist-error');
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
        const savedFilters = normalizeRepositoryFilterState(
          localStorage.getItem('dashboardStatusFilter') || DEFAULT_REPOSITORY_STATUS_FILTER,
          localStorage.getItem('dashboardSortBy') || DEFAULT_REPOSITORY_SORT_BY,
          localStorage.getItem('dashboardSortOrder') || DEFAULT_REPOSITORY_SORT_ORDER
        );
        const itemsStr = localStorage.getItem('dashboardItemsPerPage');
        const savedItemsPerPage = itemsStr !== null ? Number(itemsStr) : undefined;

        // Foreground fetch with current filters and forceFetch=true; use page=1
        await fetchRepositories(
          savedFilters.posted,
          false,
          savedItemsPerPage === 0,
          savedItemsPerPage,
          savedFilters.sortBy,
          savedFilters.sortOrder,
          1,
          true
        );
      }
      return response;
    } catch (error) {
      setErrorWithScroll(alchemistErrorMessage(error), 'content-alchemist-error');
      return { status: 'error', added: [], dont_added: [] };
    }
  }, [fetchRepositories, setErrorWithScroll]);

  return {
    handleManualGenerate,
    handleAutoGenerate
  };
};
