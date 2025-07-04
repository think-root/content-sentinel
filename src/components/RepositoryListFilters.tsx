import { Search, ChevronDown, X } from 'lucide-react';
import { RepositoryListFiltersProps } from '../types/repositoryList';
import { hasActiveFilters } from '../utils/repositoryListUtils';

export function RepositoryListFilters({
  searchTerm,
  statusFilter,
  sortBy,
  sortOrder,
  itemsPerPage,
  showFilters,
  loading,
  initialPageSize,
  onSearchTermChange,
  onStatusFilterChange,
  onSortByChange,
  onSortOrderChange,
  onItemsPerPageChange,
  onClearFilters
}: RepositoryListFiltersProps) {
  const hasFilters = hasActiveFilters(
    searchTerm,
    statusFilter,
    sortBy,
    sortOrder,
    itemsPerPage,
    initialPageSize
  );

  return (
    <>
      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex flex-col gap-4">
            {/* Search row */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by URL, Text, or Dates..."
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  disabled={loading}
                  className="pl-10 pr-8 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {searchTerm && (
                  <button
                    onClick={() => onSearchTermChange('')}
                    disabled={loading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Controls row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Status filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value as 'all' | 'posted' | 'unposted')}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="all">All</option>
                    <option value="posted">Posted</option>
                    <option value="unposted">Unposted</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Sort By filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => onSortByChange(e.target.value as 'id' | 'date_added' | 'date_posted')}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="id">ID</option>
                    <option value="date_added">Date Added</option>
                    <option value="date_posted">Date Posted</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Page Size filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Page Size
                </label>
                <div className="relative">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value={0}>All</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Sort Order filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort Order
                </label>
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={(e) => onSortOrderChange(e.target.value as 'ASC' | 'DESC')}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="DESC">Newest First</option>
                    <option value="ASC">Oldest First</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Clear filters button */}
            {hasFilters && (
              <div className="flex justify-end">
                <button
                  onClick={onClearFilters}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}