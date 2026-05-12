import { useState, useEffect } from 'react';
import { useRepositoryLocalStorage } from './useRepositoryLocalStorage';
import { UseRepositoryFiltersReturn } from '../types/repositoryList';
import type { RepositorySortBy, RepositorySortOrder } from '../types';
import {
  DEFAULT_REPOSITORY_SORT_BY,
  DEFAULT_REPOSITORY_SORT_ORDER,
  normalizeRepositorySortBy,
  normalizeRepositorySortOrder,
  PUBLICATION_QUEUE_SORT_BY,
} from '../utils/repositoryListUtils';

export function useRepositoryFilters(
  initialPageSize: number,
  initialPage: number,
  fetchRepositories: (posted?: boolean, append?: boolean, fetchAll?: boolean, itemsPerPage?: number, sortBy?: RepositorySortBy, sortOrder?: RepositorySortOrder, page?: number, forceFetch?: boolean) => Promise<void>,
  loading: boolean
): UseRepositoryFiltersReturn {
  const { getStoredValue, setStoredValue, removeStoredValue } = useRepositoryLocalStorage();

  const [showFilters, setShowFilters] = useState<boolean>(() => 
    getStoredValue('postsShowFilters', false)
  );

  const [searchTerm, setSearchTerm] = useState(() => 
    getStoredValue('dashboardSearchTerm', '')
  );
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'posted' | 'unposted'>(() => 
    normalizeRepositorySortBy(getStoredValue('dashboardSortBy', DEFAULT_REPOSITORY_SORT_BY)) === PUBLICATION_QUEUE_SORT_BY
      ? 'unposted'
      : getStoredValue('dashboardStatusFilter', 'all')
  );
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const [itemsPerPage, setItemsPerPage] = useState(() => 
    getStoredValue('dashboardItemsPerPage', initialPageSize)
  );
  
  const [sortBy, setSortBy] = useState<RepositorySortBy>(() =>
    normalizeRepositorySortBy(getStoredValue('dashboardSortBy', DEFAULT_REPOSITORY_SORT_BY))
  );

  const [sortOrder, setSortOrder] = useState<RepositorySortOrder>(() =>
    normalizeRepositorySortOrder(
      getStoredValue('dashboardSortOrder', DEFAULT_REPOSITORY_SORT_ORDER),
      normalizeRepositorySortBy(getStoredValue('dashboardSortBy', DEFAULT_REPOSITORY_SORT_BY))
    )
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

  const handleStatusFilterChange = (value: 'all' | 'posted' | 'unposted') => {
    if (loading) return;
    
    const nextSortBy = value !== 'unposted' && sortBy === PUBLICATION_QUEUE_SORT_BY
      ? DEFAULT_REPOSITORY_SORT_BY
      : sortBy;
    const nextSortOrder = value !== 'unposted' && sortBy === PUBLICATION_QUEUE_SORT_BY
      ? DEFAULT_REPOSITORY_SORT_ORDER
      : sortOrder;

    setStatusFilter(value);
    setStoredValue('dashboardStatusFilter', value);
    setSortBy(nextSortBy);
    setStoredValue('dashboardSortBy', nextSortBy);
    setSortOrder(nextSortOrder);
    setStoredValue('dashboardSortOrder', nextSortOrder);
    setCurrentPage(1);
    
    const posted = value === 'all' ? undefined : value === 'posted';

    fetchRepositories(
      posted,
      false,
      itemsPerPage === 0,
      itemsPerPage,
      nextSortBy,
      nextSortOrder,
      1,
      true
    );
  };

  const handleItemsPerPageChange = (value: number) => {
    if (loading) return;
    
    setItemsPerPage(value);
    setStoredValue('dashboardItemsPerPage', value);
    setCurrentPage(1);
    
    const effectiveStatusFilter = sortBy === PUBLICATION_QUEUE_SORT_BY ? 'unposted' : statusFilter;
    const posted = effectiveStatusFilter === 'all' ? undefined : effectiveStatusFilter === 'posted';
    fetchRepositories(
      posted,
      false,
      value === 0,
      value,
      sortBy,
      sortOrder,
      1,
      true
    );
  };

  const handleSortByChange = (value: RepositorySortBy) => {
    if (loading) return;
    
    const nextStatusFilter = value === PUBLICATION_QUEUE_SORT_BY ? 'unposted' : statusFilter;
    const nextSortOrder = value === PUBLICATION_QUEUE_SORT_BY
      ? 'ASC'
      : sortBy === PUBLICATION_QUEUE_SORT_BY ? DEFAULT_REPOSITORY_SORT_ORDER : sortOrder;

    setSortBy(value);
    setStoredValue('dashboardSortBy', value);
    setStatusFilter(nextStatusFilter);
    setStoredValue('dashboardStatusFilter', nextStatusFilter);
    setSortOrder(nextSortOrder);
    setStoredValue('dashboardSortOrder', nextSortOrder);
    setCurrentPage(1);
    
    const posted = nextStatusFilter === 'all' ? undefined : nextStatusFilter === 'posted';
    fetchRepositories(posted, false, itemsPerPage === 0, itemsPerPage, value, nextSortOrder, 1, true);
  };

  const handleSortOrderChange = (value: RepositorySortOrder) => {
    if (loading || sortBy === PUBLICATION_QUEUE_SORT_BY) return;
    
    setSortOrder(value);
    setStoredValue('dashboardSortOrder', value);
    setCurrentPage(1);
    
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(posted, false, itemsPerPage === 0, itemsPerPage, sortBy, value, 1, true);
  };

  const handlePageChange = (page: number) => {
    if (loading) return;
    
    setCurrentPage(page);
    const effectiveStatusFilter = sortBy === PUBLICATION_QUEUE_SORT_BY ? 'unposted' : statusFilter;
    const posted = effectiveStatusFilter === 'all' ? undefined : effectiveStatusFilter === 'posted';
    fetchRepositories(posted, false, false, itemsPerPage, sortBy, sortOrder, page, true);
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
    
    fetchRepositories(undefined, false, initialPageSize === 0, initialPageSize, 'date_added', 'DESC', 1, true);
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
