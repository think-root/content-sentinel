import { useState, useEffect } from 'react';
import { formatDate, formatDateOnly } from '@/utils/date-format';
import { getCronJobs } from '@/api/index';
import { Filter, ChevronDown, Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { CronJobHistory as CronJobHistoryType } from '@/api/index';
import { TruncatedText } from '@/components/ui/common/truncated-text';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/base/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base/select";
import { Button } from "@/components/ui/base/button";
import { Calendar } from "@/components/ui/base/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/base/popover";
import { Badge } from "@/components/ui/common/badge";
import { Skeleton } from "@/components/ui/common/skeleton";
import { Card } from "@/components/ui/layout/card";
import { cn } from "@/lib/utils";

interface CronJobHistoryProps {
  history?: CronJobHistoryType[];
  loading?: boolean;
  nameFilter?: string;
  statusFilter?: number;
  setNameFilter?: (nameFilter?: string) => void;
  setStatusFilter?: (statusFilter?: number) => void;
  resetFilters?: () => void;
  isApiReady?: boolean;
  pageSize?: number;
  setPageSize?: (pageSize: number) => void;
  sortOrder?: 'asc' | 'desc';
  setSortOrder?: (sortOrder: 'asc' | 'desc') => void;
  totalItems?: number;
  totalPages?: number;
  currentPage?: number;
  setPage?: (page: number) => void;
  startDate?: string;
  endDate?: string;
  setStartDate?: (startDate?: string) => void;
  setEndDate?: (endDate?: string) => void;
}

export const CronJobHistory = ({
  history = [],
  loading = false,
  nameFilter,
  statusFilter,
  setNameFilter,
  setStatusFilter,
  resetFilters,
  isApiReady = true,
  pageSize = 10,
  setPageSize,
  sortOrder = 'desc',
  setSortOrder,
  totalItems = 0,
  totalPages = 0,
  currentPage = 1,
  setPage,
  startDate,
  endDate,
  setStartDate,
  setEndDate
}: CronJobHistoryProps) => {
  const [cronJobs, setCronJobs] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>(
    nameFilter || 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(
    statusFilter === undefined ? 'all' : statusFilter.toString()
  );
  const [selectedPageSize, setSelectedPageSize] = useState<number>(pageSize);
  const [selectedSortOrder, setSelectedSortOrder] = useState<'asc' | 'desc'>(sortOrder);
  const [selectedStartDate, setSelectedStartDate] = useState<string>(startDate || '');
  const [selectedEndDate, setSelectedEndDate] = useState<string>(endDate || '');
  const [startDateOpen, setStartDateOpen] = useState<boolean>(false);
  const [endDateOpen, setEndDateOpen] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    const saved = localStorage.getItem('cronHistoryShowFilters');
    return saved === 'true';
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobs = await getCronJobs();
        setCronJobs(jobs.map((job: any) => job.name));
      } catch {
        console.log('Failed to fetch cron jobs.');
      }
    };

    if (isApiReady) {
      fetchJobs();
    }
  }, [isApiReady]);

  useEffect(() => {
    setSelectedJob(nameFilter || 'all');
  }, [nameFilter]);

  useEffect(() => {
    setSelectedStatus(
      statusFilter === undefined ? 'all' : statusFilter.toString()
    );
  }, [statusFilter]);

  useEffect(() => {
    setSelectedPageSize(pageSize);
  }, [pageSize]);

  useEffect(() => {
    setSelectedSortOrder(sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    setSelectedStartDate(startDate || '');
  }, [startDate]);

  useEffect(() => {
    setSelectedEndDate(endDate || '');
  }, [endDate]);

  const handleJobFilterChange = (jobName: string) => {
    setSelectedJob(jobName);
    const filterValue = jobName === 'all' ? undefined : jobName;

    if (setNameFilter) {
      setNameFilter(filterValue);
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setSelectedStatus(status);
    let filterValue: number | undefined;

    if (status === '1') {
      filterValue = 1;
    } else if (status === '0') {
      filterValue = 0;
    } else if (status === '2') {
      filterValue = 2;
    } else {
      filterValue = undefined;
    }

    if (setStatusFilter) {
      setStatusFilter(filterValue);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setSelectedPageSize(newPageSize);

    if (setPageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleSortOrderChange = (newSortOrder: 'asc' | 'desc') => {
    setSelectedSortOrder(newSortOrder);

    if (setSortOrder) {
      setSortOrder(newSortOrder);
    }
  };

  const handleStartDateChange = (date: string) => {
    setSelectedStartDate(date);

    if (setStartDate) {
      setStartDate(date && date.trim() !== '' ? date : undefined);
    }
  };

  const handleEndDateChange = (date: string) => {
    setSelectedEndDate(date);

    if (setEndDate) {
      setEndDate(date && date.trim() !== '' ? date : undefined);
    }
  };

  const handleClearFilters = () => {
    setSelectedJob('all');
    setSelectedStatus('all');
    setSelectedSortOrder('desc');
    setSelectedStartDate('');
    setSelectedEndDate('');
    if (resetFilters) {
      resetFilters();
    }
  };

  const handleToggleFilters = () => {
    const newValue = !showFilters;
    setShowFilters(newValue);
    localStorage.setItem('cronHistoryShowFilters', newValue.toString());
  };

  const handlePageChange = (page: number) => {
    if (loading || !setPage) return;
    setPage(page);
  };

  const displayHistory = history;

  const hasActiveFilters = nameFilter || statusFilter !== undefined || startDate || endDate;

  const renderDatePicker = (date: string, onChange: (date: string) => void, placeholder: string, isOpen: boolean, setIsOpen: (open: boolean) => void) => {
    const selectedDate = date ? new Date(date) : undefined;
    
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal text-foreground hover:text-foreground hover:bg-background"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatDateOnly(date) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                onChange(`${year}-${month}-${day}`);
                setIsOpen(false);
              }
            }}
            initialFocus
          />
          {date && (
            <div className="p-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
              >
                Clear date
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="bg-card border rounded-lg p-6 mb-8 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Clock className="h-6 w-6 text-muted-foreground mr-2" />
          <h2 className="text-xl font-semibold text-foreground">History</h2>
        </div>

        <Button
                  onClick={handleToggleFilters}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  {hasActiveFilters && (
                    <span className="ml-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
              {[nameFilter, statusFilter !== undefined, startDate, endDate].filter(Boolean).length}
                    </span>
                  )}
                </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="mb-6 p-4">
          <div className="flex flex-col gap-4">

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Job filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cron Job
                </label>
                <Select value={selectedJob} onValueChange={handleJobFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    <SelectItem value="collect">Collect</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                    {cronJobs.filter(job => !['collect', 'message'].includes(job)).map((jobName) => (
                      <SelectItem key={jobName} value={jobName}>
                        {jobName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <Select value={selectedStatus} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Success</SelectItem>
                    <SelectItem value="0">Failed</SelectItem>
                    <SelectItem value="2">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Page Size filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Page Size
                </label>
                <Select value={selectedPageSize.toString()} onValueChange={(value) => handlePageSizeChange(parseInt(value, 10))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Page Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Sort by Date
                </label>
                <Select value={selectedSortOrder} onValueChange={(value) => handleSortOrderChange(value as 'asc' | 'desc')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date filters row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Start Date filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Date
                </label>
                {renderDatePicker(selectedStartDate, handleStartDateChange, "Select start date", startDateOpen, setStartDateOpen)}
              </div>

              {/* End Date filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Date
                </label>
                {renderDatePicker(selectedEndDate, handleEndDateChange, "Select end date", endDateOpen, setEndDateOpen)}
              </div>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="text-foreground"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {!isApiReady ? (
        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/6">Name</TableHead>
                  <TableHead className="w-1/4">Date</TableHead>
                  <TableHead className="w-1/6">Status</TableHead>
                  <TableHead className="w-5/12">Output</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <div className="text-muted-foreground text-sm py-4">
                      Data could not be loaded because API keys are not configured
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden">
            <div className="bg-card border rounded-lg p-4 mb-4">
              <div className="text-muted-foreground text-sm text-center">
                Data could not be loaded because API keys are not configured
              </div>
            </div>
          </div>
        </div>
      ) : loading && history.length === 0 ? (
        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/6">Name</TableHead>
                  <TableHead className="w-1/4">Date</TableHead>
                  <TableHead className="w-1/6">Status</TableHead>
                  <TableHead className="w-5/12">Output</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-3/4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-1/2" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-1/4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-1/2" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border rounded-lg p-4 mb-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/6">Name</TableHead>
                  <TableHead className="w-1/4">Date</TableHead>
                  <TableHead className="w-1/6">Status</TableHead>
                  <TableHead className="w-5/12">Output</TableHead>
                </TableRow>
              </TableHeader>

              {displayHistory && displayHistory.length > 0 ? (
                <TableBody>
                  {displayHistory.map((entry, index) => (
                    <TableRow key={index} className="group">
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>
                        <div className="overflow-hidden">
                          <p className="whitespace-normal break-words">{formatDate(entry.timestamp)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={entry.status === 1 ? "success" : entry.status === 2 ? "warning" : "destructive"}
                          className="text-xs"
                        >
                          {entry.status === 1 ? 'Success' : entry.status === 2 ? 'Partial' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="overflow-hidden">
                          <TruncatedText text={entry.output || 'None'} maxChars={65} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              ) : (
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <div className="text-muted-foreground text-sm py-4">
                        No data available
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              )}
            </Table>
          </div>

          <div className="md:hidden block">
            {history && history.length > 0 ? (
              history.map((entry, index) => (
                <div key={index} className={`bg-card border ${index !== history.length - 1 ? 'border-b' : ''} p-4 group hover:bg-muted/50`}>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">Name</span>
                      <div className="mt-1 text-sm text-foreground">{entry.name}</div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">Date</span>
                      <div className="mt-1 text-sm text-foreground">
                        <p className="whitespace-normal break-words">{formatDate(entry.timestamp)}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">Status</span>
                      <div className="mt-1">
                        <Badge
                          variant={entry.status === 1 ? "success" : entry.status === 2 ? "warning" : "destructive"}
                          className="text-xs"
                        >
                          {entry.status === 1 ? 'Success' : entry.status === 2 ? 'Partial' : 'Failed'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">Output</span>
                      <div className="mt-1 text-sm text-foreground">
                        <TruncatedText text={entry.output || 'None'} maxChars={65} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground text-sm text-center py-4">
                No data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {history.length > 0 && (
        <>
          <div className="mt-4 pt-4 border-t md:block hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">
              <div className="text-sm text-muted-foreground">
                <p>
                  Showing <span className="font-medium">
                    {Math.min((currentPage - 1) * pageSize + 1, totalItems || history.length)}
                  </span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalItems || history.length)}
                  </span>{' '}
                  of <span className="font-medium">{totalItems || history.length}</span> results
                </p>
              </div>

              {pageSize > 0 && (totalItems || history.length) > pageSize && (
                <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages || Math.ceil((totalItems || history.length) / pageSize)) }, (_, i) => {
                    let pageNum;
                    const effectiveTotalPages = totalPages || Math.ceil((totalItems || history.length) / pageSize);
                    if (effectiveTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= effectiveTotalPages - 2) {
                      pageNum = effectiveTotalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        title={`Go to page ${pageNum}`}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === (totalPages || Math.ceil((totalItems || history.length) / pageSize))}
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile pagination */}
          <div className="mt-4 pt-4 border-t md:hidden block">
            <div className="flex flex-col gap-4">
              <div className="text-sm text-muted-foreground text-center">
                <p>
                  Showing <span className="font-medium">
                    {Math.min((currentPage - 1) * pageSize + 1, totalItems || history.length)}
                  </span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalItems || history.length)}
                  </span>{' '}
                  of <span className="font-medium">{totalItems || history.length}</span> results
                </p>
              </div>

              {pageSize > 0 && (totalItems || history.length) > pageSize && (
                <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1 px-4 w-full justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                    className="min-w-[32px] flex-shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, totalPages || Math.ceil((totalItems || history.length) / pageSize)) }, (_, i) => {
                    let pageNum;
                    const effectiveTotalPages = totalPages || Math.ceil((totalItems || history.length) / pageSize);
                    if (effectiveTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= effectiveTotalPages - 2) {
                      pageNum = effectiveTotalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        title={`Go to page ${pageNum}`}
                        className="min-w-[32px] flex-shrink-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === (totalPages || Math.ceil((totalItems || history.length) / pageSize))}
                    title="Next page"
                    className="min-w-[32px] flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};