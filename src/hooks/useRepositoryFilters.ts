import { useState, useEffect } from 'react';
import { useRepositoryLocalStorage } from './useRepositoryLocalStorage';
import { UseRepositoryFiltersReturn } from '../types/repositoryList';

export function useRepositoryFilters(
  initialPageSize: number,
  initialPage: number,
  fetchRepositories: (posted?: boolean, append?: boolean, fetchAll?: boolean, itemsPerPage?: number, sortBy?: 'id' | 'date_added' | 'date_posted', sortOrder?: 'ASC' | 'DESC', page?: number) => Promise<void>,
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
    getStoredValue('dashboardStatusFilter', 'all')
  );
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const [itemsPerPage, setItemsPerPage] = useState(() => 
    getStoredValue('dashboardItemsPerPage', initialPageSize)
  );
  
  const [sortBy, setSortBy] = useState<'id' | 'date_added' | 'date_posted'>(() => 
    getStoredValue('dashboardSortBy', 'date_added')
  );

  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(() => 
    getStoredValue('dashboardSortOrder', 'DESC')
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
    
    setStatusFilter(value);
    setStoredValue('dashboardStatusFilter', value);
    setCurrentPage(1);
    
    const posted = value === 'all' ? undefined : value === 'posted';

    fetchRepositories(
      posted,
      false,
      itemsPerPage === 0,
      itemsPerPage,
      sortBy,
      sortOrder,
      1
    );
  };

  const handleItemsPerPageChange = (value: number) => {
    if (loading) return;
    
    setItemsPerPage(value);
    setStoredValue('dashboardItemsPerPage', value);
    setCurrentPage(1);
    
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(
      posted,
      false,
      value === 0,
      value,
      sortBy,
      sortOrder,
      1
    );
  };

  const handleSortByChange = (value: 'id' | 'date_added' | 'date_posted') => {
    if (loading) return;
    
    setSortBy(value);
    setStoredValue('dashboardSortBy', value);
    setCurrentPage(1);
    
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(posted, false, itemsPerPage === 0, itemsPerPage, value, sortOrder, 1);
  };

  const handleSortOrderChange = (value: 'ASC' | 'DESC') => {
    if (loading) return;
    
    setSortOrder(value);
    setStoredValue('dashboardSortOrder', value);
    setCurrentPage(1);
    
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(posted, false, itemsPerPage === 0, itemsPerPage, sortBy, value, 1);
  };

  const handlePageChange = (page: number) => {
    if (loading) return;
    
    setCurrentPage(page);
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(posted, false, false, itemsPerPage, sortBy, sortOrder, page);
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
    
    fetchRepositories(undefined, false, initialPageSize === 0, initialPageSize, 'date_added', 'DESC', 1);
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