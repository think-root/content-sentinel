import { useState, useEffect } from 'react';
import { formatDateOnly } from '@/utils/date-format';
import { Calendar as CalendarIcon } from 'lucide-react';
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
import { Card } from "@/components/ui/layout/card";
import { cn } from "@/lib/utils";

interface CronHistoryFiltersProps {
  /** Names of the configured cron jobs, offered next to collect and message. */
  cronJobs: string[];
  nameFilter?: string;
  statusFilter?: number;
  pageSize: number;
  sortOrder: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  hasActiveFilters: boolean;
  setNameFilter?: (nameFilter?: string) => void;
  setStatusFilter?: (statusFilter?: number) => void;
  setPageSize?: (pageSize: number) => void;
  setSortOrder?: (sortOrder: 'asc' | 'desc') => void;
  setStartDate?: (startDate?: string) => void;
  setEndDate?: (endDate?: string) => void;
  resetFilters?: () => void;
}

interface DatePickerProps {
  date: string;
  onChange: (date: string) => void;
  placeholder: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const DatePicker = ({ date, onChange, placeholder, isOpen, setIsOpen }: DatePickerProps) => {
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

/** The filters panel of the cron history; its selects mirror the active filters. */
export const CronHistoryFilters = ({
  cronJobs,
  nameFilter,
  statusFilter,
  pageSize,
  sortOrder,
  startDate,
  endDate,
  hasActiveFilters,
  setNameFilter,
  setStatusFilter,
  setPageSize,
  setSortOrder,
  setStartDate,
  setEndDate,
  resetFilters,
}: CronHistoryFiltersProps) => {
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
    setNameFilter?.(jobName === 'all' ? undefined : jobName);
  };

  const handleStatusFilterChange = (status: string) => {
    setSelectedStatus(status);
    // 1 success, 0 failed, 2 partial; anything else means no filter
    setStatusFilter?.(status === '1' || status === '0' || status === '2' ? Number(status) : undefined);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setSelectedPageSize(newPageSize);
    setPageSize?.(newPageSize);
  };

  const handleSortOrderChange = (newSortOrder: 'asc' | 'desc') => {
    setSelectedSortOrder(newSortOrder);
    setSortOrder?.(newSortOrder);
  };

  const handleStartDateChange = (date: string) => {
    setSelectedStartDate(date);
    setStartDate?.(date && date.trim() !== '' ? date : undefined);
  };

  const handleEndDateChange = (date: string) => {
    setSelectedEndDate(date);
    setEndDate?.(date && date.trim() !== '' ? date : undefined);
  };

  const handleClearFilters = () => {
    setSelectedJob('all');
    setSelectedStatus('all');
    setSelectedSortOrder('desc');
    setSelectedStartDate('');
    setSelectedEndDate('');
    resetFilters?.();
  };

  return (
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
            <DatePicker
              date={selectedStartDate}
              onChange={handleStartDateChange}
              placeholder="Select start date"
              isOpen={startDateOpen}
              setIsOpen={setStartDateOpen}
            />
          </div>

          {/* End Date filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              End Date
            </label>
            <DatePicker
              date={selectedEndDate}
              onChange={handleEndDateChange}
              placeholder="Select end date"
              isOpen={endDateOpen}
              setIsOpen={setEndDateOpen}
            />
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
  );
};
