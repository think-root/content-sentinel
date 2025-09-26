// React imports
// (no state needed since the Posts section is no longer collapsible)
import { Repository } from '@/types';
import { Filter, ChevronDown } from 'lucide-react';
import { filterRepositories, countActiveFilters } from '@/utils/repositoryListUtils';
import { useRepositoryFilters } from '@/hooks/useRepositoryFilters';
import { RepositoryTable } from './repository-table';
import { RepositoryMobileView } from './repository-mobile-view';
import { RepositoryPagination } from './repository-pagination';
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card';
import { Button } from '../base/button';
import { Badge } from '../common/badge';
import { RepositoryFilters } from './repository-filters';

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <div className="flex items-center flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground mr-2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
          <CardTitle className="text-lg">Posts</CardTitle>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleFilters}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </CardHeader>
      
      <CardContent className="px-6 pb-6">
        {/* Filters Panel */}
        {showFilters && (
          <RepositoryFilters
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
        )}

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
      </CardContent>
    </Card>
  );
}