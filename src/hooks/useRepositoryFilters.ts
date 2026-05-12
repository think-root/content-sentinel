import { useState, useEffect } from 'react';
import { useRepositoryLocalStorage } from './useRepositoryLocalStorage';
import { UseRepositoryFiltersReturn } from '../types/repositoryList';
import type { RepositorySortBy, RepositorySortOrder, RepositoryStatusFilter } from '../types';
import {
  DEFAULT_REPOSITORY_SORT_BY,
  DEFAULT_REPOSITORY_SORT_ORDER,
  DEFAULT_REPOSITORY_STATUS_FILTER,
  getPostedFilterFromRepositoryStatus,
  normalizeRepositoryFilterState,
  PUBLICATION_QUEUE_SORT_BY,
} from '../utils/repositoryListUtils';

export function useRepositoryFilters(
  initialPageSize: number,
  initialPage: number,
  fetchRepositories: (posted?: boolean, append?: boolean, fetchAll?: boolean, itemsPerPage?: number, sortBy?: RepositorySortBy, sortOrder?: RepositorySortOrder, page?: number, forceFetch?: boolean) => Promise<void>,
  loading: boolean
): UseRepositoryFiltersReturn {
  const { getStoredValue, setStoredValue, removeStoredValue } = useRepositoryLocalStorage();
  const getStoredFilterState = () => normalizeRepositoryFilterState(
    getStoredValue('dashboardStatusFilter', DEFAULT_REPOSITORY_STATUS_FILTER),
    getStoredValue('dashboardSortBy', DEFAULT_REPOSITORY_SORT_BY),
    getStoredValue('dashboardSortOrder', DEFAULT_REPOSITORY_SORT_ORDER)
  );

  const [showFilters, setShowFilters] = useState<boolean>(() => 
    getStoredValue('postsShowFilters', false)
  );

  const [searchTerm, setSearchTerm] = useState(() => 
    getStoredValue('dashboardSearchTerm', '')
  );
  
  const [statusFilter, setStatusFilter] = useState<RepositoryStatusFilter>(() =>
    getStoredFilterState().statusFilter
  );
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const [itemsPerPage, setItemsPerPage] = useState(() => 
    getStoredValue('dashboardItemsPerPage', initialPageSize)
  );
  
  const [sortBy, setSortBy] = useState<RepositorySortBy>(() =>
    getStoredFilterState().sortBy
  );

  const [sortOrder, setSortOrder] = useState<RepositorySortOrder>(() =>
    getStoredFilterState().sortOrder
  );

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  const handleToggleFilters = () => {
    const newValue = !showFilters;
    setShowFilters(newValue);
    setStoredValue('postsShowFilters', newValue);
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    setStoredValue('dashboardSearchTerm', value);
  };

  const persistFilterState = (
    nextStatusFilter: RepositoryStatusFilter,
    nextSortBy: RepositorySortBy,
    nextSortOrder: RepositorySortOrder
  ) => {
    setStatusFilter(nextStatusFilter);
    setStoredValue('dashboardStatusFilter', nextStatusFilter);
    setSortBy(nextSortBy);
    setStoredValue('dashboardSortBy', nextSortBy);
    setSortOrder(nextSortOrder);
    setStoredValue('dashboardSortOrder', nextSortOrder);
  };

  const handleStatusFilterChange = (value: RepositoryStatusFilter) => {
    if (loading) return;

    const nextFilters = normalizeRepositoryFilterState(value, sortBy, sortOrder);
    persistFilterState(nextFilters.statusFilter, nextFilters.sortBy, nextFilters.sortOrder);
    setCurrentPage(1);

    fetchRepositories(
      nextFilters.posted,
      false,
      itemsPerPage === 0,
      itemsPerPage,
      nextFilters.sortBy,
      nextFilters.sortOrder,
      1,
      true
    );
  };

  const handleItemsPerPageChange = (value: number) => {
    if (loading) return;
    
    setItemsPerPage(value);
    setStoredValue('dashboardItemsPerPage', value);
    setCurrentPage(1);
    
    const nextFilters = normalizeRepositoryFilterState(statusFilter, sortBy, sortOrder);
    fetchRepositories(
      nextFilters.posted,
      false,
      value === 0,
      value,
      nextFilters.sortBy,
      nextFilters.sortOrder,
      1,
      true
    );
  };

  const handleSortByChange = (value: RepositorySortBy) => {
    if (loading) return;
    
    const nextFilters = normalizeRepositoryFilterState(statusFilter, value, sortOrder);
    persistFilterState(nextFilters.statusFilter, nextFilters.sortBy, nextFilters.sortOrder);
    setCurrentPage(1);

    fetchRepositories(
      nextFilters.posted,
      false,
      itemsPerPage === 0,
      itemsPerPage,
      nextFilters.sortBy,
      nextFilters.sortOrder,
      1,
      true
    );
  };

  const handleSortOrderChange = (value: RepositorySortOrder) => {
    if (loading || sortBy === PUBLICATION_QUEUE_SORT_BY) return;
    
    const nextFilters = normalizeRepositoryFilterState(statusFilter, sortBy, value);
    persistFilterState(nextFilters.statusFilter, nextFilters.sortBy, nextFilters.sortOrder);
    setCurrentPage(1);

    fetchRepositories(
      nextFilters.posted,
      false,
      itemsPerPage === 0,
      itemsPerPage,
      nextFilters.sortBy,
      nextFilters.sortOrder,
      1,
      true
    );
  };

  const handlePageChange = (page: number) => {
    if (loading) return;
    
    setCurrentPage(page);
    const nextFilters = normalizeRepositoryFilterState(statusFilter, sortBy, sortOrder);
    fetchRepositories(nextFilters.posted, false, false, itemsPerPage, nextFilters.sortBy, nextFilters.sortOrder, page, true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('date_added');
    setSortOrder('DESC');
    setItemsPerPage(initialPageSize);
    setCurrentPage(1);
    
    removeStoredValue('dashboardSearchTerm');
    setStoredValue('dashboardStatusFilter', 'all');
    setStoredValue('dashboardSortBy', 'date_added');
    setStoredValue('dashboardSortOrder', 'DESC');
    setStoredValue('dashboardItemsPerPage', initialPageSize);
    
    fetchRepositories(
      getPostedFilterFromRepositoryStatus('all'),
      false,
      initialPageSize === 0,
      initialPageSize,
      'date_added',
      'DESC',
      1,
      true
    );
  };

  return {
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    itemsPerPage,
    currentPage,
    showFilters,
    handleSearchTermChange,
    handleStatusFilterChange,
    handleSortByChange,
    handleSortOrderChange,
    handleItemsPerPageChange,
    handlePageChange,
    handleClearFilters,
    handleToggleFilters
  };
}
