import { Search, X } from 'lucide-react';
import { RepositoryListFiltersProps } from '@/types/repositoryList';
import { hasActiveFilters } from '@/utils/repositoryListUtils';
import { Card } from '../layout/card';
import { Input } from '../base/input';
import { Button } from '../base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select';
import { Label } from '../base/label';

export function RepositoryFilters({
  searchTerm,
  statusFilter,
  sortBy,
  sortOrder,
  itemsPerPage,
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
    <Card className="mb-6 p-4">
      <div className="flex flex-col gap-4">
        {/* Search row */}
        <div className="flex flex-col">
          <Label className="mb-2">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by URL, Text, or Dates..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              disabled={loading}
              className="pl-10 pr-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchTermChange('')}
                disabled={loading}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status filter */}
          <div className="flex-1">
            <Label className="mb-2">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => onStatusFilterChange(value as 'all' | 'posted' | 'unposted')}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="posted">Posted</SelectItem>
                <SelectItem value="unposted">Unposted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By filter */}
          <div className="flex-1">
            <Label className="mb-2">Sort By</Label>
            <Select
              value={sortBy}
              onValueChange={(value) => onSortByChange(value as 'id' | 'date_added' | 'date_posted')}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">ID</SelectItem>
                <SelectItem value="date_added">Date Added</SelectItem>
                <SelectItem value="date_posted">Date Posted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page Size filter */}
          <div className="flex-1">
            <Label className="mb-2">Page Size</Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All</SelectItem>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order filter */}
          <div className="flex-1">
            <Label className="mb-2">Sort Order</Label>
            <Select
              value={sortOrder}
              onValueChange={(value) => onSortOrderChange(value as 'ASC' | 'DESC')}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESC">Newest First</SelectItem>
                <SelectItem value="ASC">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear filters button */}
        {hasFilters && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              disabled={loading}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}