import { useState } from 'react';
import { Repository } from '../types';
import { Filter, ChevronDown } from 'lucide-react';
import { filterRepositories, countActiveFilters } from '../utils/repositoryListUtils';
import { useRepositoryFilters } from '../hooks/useRepositoryFilters';
import { RepositoryListFilters } from './RepositoryListFilters';
import { RepositoryTable } from './RepositoryTable';
import { RepositoryMobileView } from './RepositoryMobileView';
import { RepositoryPagination } from './RepositoryPagination';

interface RepositoryListProps {
  repositories: Repository[];
  fetchRepositories: (posted?: boolean, append?: boolean, fetchAll?: boolean, itemsPerPage?: number, sortBy?: 'id' | 'date_added' | 'date_posted', sortOrder?: 'ASC' | 'DESC', page?: number) => Promise<void>;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  isApiReady?: boolean;
}

export function RepositoryList({ 
  repositories, 
  fetchRepositories, 
  totalItems, 
  totalPages, 
  currentPage: initialPage, 
  pageSize: initialPageSize, 
  loading, 
  isApiReady = true 
}: RepositoryListProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('dashboardExpanded');
    return saved === null ? true : saved === 'true';
  });

  const {
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
  } = useRepositoryFilters(initialPageSize, initialPage, fetchRepositories, loading);

  const toggleExpanded = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    localStorage.setItem('dashboardExpanded', newValue.toString());
  };

  const filteredItems = filterRepositories(repositories, searchTerm);

  const activeFiltersCount = countActiveFilters(
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    itemsPerPage,
    initialPageSize
  );

  const handleRepositoryUpdate = () => {
    // Refresh repositories with current filters
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(posted, false, itemsPerPage === 0, itemsPerPage, sortBy, sortOrder, currentPage);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="flex items-center justify-between p-6">
        <div
          className="flex items-center cursor-pointer select-none flex-1"
          onClick={toggleExpanded}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Posts</h2>
        </div>

        <button
          onClick={handleToggleFilters}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            showFilters
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          {activeFiltersCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>
      
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden px-6 ${
          isExpanded ? 'max-h-full opacity-100 pb-6' : 'max-h-0 opacity-0'
        }`}
      >
        <RepositoryListFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          itemsPerPage={itemsPerPage}
          showFilters={showFilters}
          loading={loading}
          initialPageSize={initialPageSize}
          onSearchTermChange={handleSearchTermChange}
          onStatusFilterChange={handleStatusFilterChange}
          onSortByChange={handleSortByChange}
          onSortOrderChange={handleSortOrderChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          onClearFilters={handleClearFilters}
        />

        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <RepositoryTable
              repositories={filteredItems}
              loading={loading}
              isApiReady={isApiReady}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              searchTerm={searchTerm}
              onRepositoryUpdate={handleRepositoryUpdate}
            />
          </div>
          
          <div className="md:hidden block">
            <RepositoryMobileView
              repositories={filteredItems}
              loading={loading}
              isApiReady={isApiReady}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              searchTerm={searchTerm}
              onRepositoryUpdate={handleRepositoryUpdate}
            />
          </div>
        </div>

        <RepositoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          searchTerm={searchTerm}
          filteredItemsCount={filteredItems.length}
          loading={loading}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
