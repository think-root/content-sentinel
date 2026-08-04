import { Archive, ChevronDown, Filter } from 'lucide-react';
import type { ArchiveListProps } from '@/types/archive';
import { countActiveArchiveFilters, hasActiveArchiveFilters } from '@/utils/archiveUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card';
import { Button } from '../base/button';
import { Badge } from '../common/badge';
import { ArchiveFilters } from './archive-filters';
import { ArchiveTable } from './archive-table';
import { ArchiveMobileView } from './archive-mobile-view';
import { RepositoryPagination } from './repository-pagination';

export function ArchiveList({
  items,
  all,
  loading,
  isApiReady,
  filters,
  showFilters,
  currentPage,
  totalPages,
  totalItems,
  onFilterChange,
  onClearFilters,
  onToggleFilters,
  onPageChange,
}: ArchiveListProps) {
  const activeFiltersCount = countActiveArchiveFilters(filters);
  const hasFilters = hasActiveArchiveFilters(filters);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <div className="flex items-center flex-1">
          <Archive className="h-5 w-5 text-muted-foreground mr-2" />
          <CardTitle className="text-lg">Archived</CardTitle>
          {isApiReady && all > 0 && (
            <span className="ml-2 text-sm text-muted-foreground">{all} total</span>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleFilters}
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
        {showFilters && (
          <ArchiveFilters
            filters={filters}
            loading={loading}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
          />
        )}

        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <ArchiveTable
              items={items}
              loading={loading}
              isApiReady={isApiReady}
              totalItems={totalItems}
              itemsPerPage={filters.pageSize}
              hasFilters={hasFilters}
            />
          </div>

          <div className="md:hidden block">
            <ArchiveMobileView
              items={items}
              loading={loading}
              isApiReady={isApiReady}
              totalItems={totalItems}
              itemsPerPage={filters.pageSize}
              hasFilters={hasFilters}
            />
          </div>
        </div>

        {/* Filtering happens server-side, so searchTerm stays empty - a value would hide the page buttons */}
        <RepositoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={filters.pageSize}
          searchTerm=""
          filteredItemsCount={items.length}
          loading={loading}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}
