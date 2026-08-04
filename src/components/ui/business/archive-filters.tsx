import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ArchiveFiltersProps, ArchiveSortBy, ArchiveSortOrder } from '@/types/archive';
import {
  ARCHIVE_SORT_BY_LABELS,
  ARCHIVE_SORT_BY_OPTIONS,
  hasActiveArchiveFilters,
  isValidDateRange,
} from '@/utils/archiveUtils';
import { Card } from '../layout/card';
import { Input } from '../base/input';
import { Button } from '../base/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select';
import { Label } from '../base/label';
import { CustomDateInput } from '@/components/ui/common/custom-date-input';

// url/text are server-side substring filters, so keystrokes are debounced to stay under the rate limit
const TEXT_FILTER_DEBOUNCE_MS = 600;

export function ArchiveFilters({
  filters,
  loading,
  onFilterChange,
  onClearFilters,
}: ArchiveFiltersProps) {
  const [urlInput, setUrlInput] = useState(filters.url);
  const [textInput, setTextInput] = useState(filters.text);

  // onFilterChange gets a new identity on every archive state change; keeping it in a ref stops
  // the debounce timers below from being cleared and restarted by unrelated re-renders
  const onFilterChangeRef = useRef(onFilterChange);
  useEffect(() => {
    onFilterChangeRef.current = onFilterChange;
  }, [onFilterChange]);

  useEffect(() => {
    setUrlInput(filters.url);
  }, [filters.url]);

  useEffect(() => {
    setTextInput(filters.text);
  }, [filters.text]);

  useEffect(() => {
    if (urlInput === filters.url) return;
    const timer = setTimeout(() => onFilterChangeRef.current('url', urlInput), TEXT_FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [urlInput, filters.url]);

  useEffect(() => {
    if (textInput === filters.text) return;
    const timer = setTimeout(() => onFilterChangeRef.current('text', textInput), TEXT_FILTER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [textInput, filters.text]);

  const hasFilters = hasActiveArchiveFilters(filters);

  const dateRanges = [
    { label: 'Date Added', fromKey: 'dateAddedFrom', toKey: 'dateAddedTo' },
    { label: 'Date Posted', fromKey: 'datePostedFrom', toKey: 'datePostedTo' },
    { label: 'Date Archived', fromKey: 'dateArchivedFrom', toKey: 'dateArchivedTo' },
  ] as const;

  return (
    <Card className="mb-6 p-4">
      <div className="flex flex-col gap-4">
        {/* Text filters row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col">
            <Label className="mb-2">Url</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter by URL..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="pl-10 pr-8"
              />
              {urlInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUrlInput('')}
                  disabled={loading}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Clear url filter"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <Label className="mb-2">Text</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Filter by text..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="pl-10 pr-8"
              />
              {textInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTextInput('')}
                  disabled={loading}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Clear text filter"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Date range rows */}
        {dateRanges.map(({ label, fromKey, toKey }) => {
          const from = filters[fromKey];
          const to = filters[toKey];
          const isValid = isValidDateRange(from, to);

          return (
            <div key={label} className="flex flex-col">
              <Label className="mb-2">{label}</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                  <CustomDateInput
                    value={from}
                    onChange={(value) => onFilterChange(fromKey, value)}
                    placeholder={`Select ${label.toLowerCase()} from`}
                  />
                </div>
                <div className="flex-1">
                  <CustomDateInput
                    value={to}
                    onChange={(value) => onFilterChange(toKey, value)}
                    placeholder={`Select ${label.toLowerCase()} to`}
                  />
                </div>
              </div>
              {!isValid && (
                <p className="mt-1 text-xs text-destructive">
                  The start date must not be later than the end date
                </p>
              )}
            </div>
          );
        })}

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label className="mb-2">Sort By</Label>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => onFilterChange('sortBy', value as ArchiveSortBy)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {ARCHIVE_SORT_BY_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {ARCHIVE_SORT_BY_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label className="mb-2">Sort Order</Label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value) => onFilterChange('sortOrder', value as ArchiveSortOrder)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label className="mb-2">Page Size</Label>
            <Select
              value={filters.pageSize.toString()}
              onValueChange={(value) => onFilterChange('pageSize', Number(value))}
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
        </div>

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
