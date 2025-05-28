import '../styles/calendar.css';
import { useState, useEffect } from 'react';
import { formatDate } from '../utils/date-format';
import { getCronJobs } from '../api/index';
import { Filter, ChevronDown, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CronJobHistory as CronJobHistoryType } from '../api/index';
import { CustomDateInput } from './CustomDateInput';

interface CronJobHistoryProps {
  history?: CronJobHistoryType[];
  loading?: boolean;
  nameFilter?: string;
  successFilter?: boolean;
  setNameFilter?: (nameFilter?: string) => void;
  setSuccessFilter?: (successFilter?: boolean) => void;
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
  successFilter,
  setNameFilter,
  setSuccessFilter,
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
    successFilter === undefined ? 'all' : successFilter ? 'success' : 'failed'
  );
  const [selectedPageSize, setSelectedPageSize] = useState<number>(pageSize);
  const [selectedSortOrder, setSelectedSortOrder] = useState<'asc' | 'desc'>(sortOrder);
  const [selectedStartDate, setSelectedStartDate] = useState<string>(startDate || '');
  const [selectedEndDate, setSelectedEndDate] = useState<string>(endDate || '');
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    const saved = localStorage.getItem('cronHistoryShowFilters');
    return saved === 'true';
  });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobs = await getCronJobs();
        setCronJobs(jobs.map(job => job.name));
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
      successFilter === undefined ? 'all' : successFilter ? 'success' : 'failed'
    );
  }, [successFilter]);

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
    let filterValue: boolean | undefined;

    if (status === 'success') {
      filterValue = true;
    } else if (status === 'failed') {
      filterValue = false;
    } else {
      filterValue = undefined;
    }

    if (setSuccessFilter) {
      setSuccessFilter(filterValue);
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
      setStartDate(date || undefined);
    }
  };

  const handleEndDateChange = (date: string) => {
    setSelectedEndDate(date);

    if (setEndDate) {
      setEndDate(date || undefined);
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
    if (setSortOrder) {
      setSortOrder('desc');
    }
    if (setStartDate) {
      setStartDate(undefined);
    }
    if (setEndDate) {
      setEndDate(undefined);
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

  const hasActiveFilters = nameFilter || successFilter !== undefined || startDate || endDate;

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Clock className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cron Jobs History</h2>
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
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
              {[nameFilter, successFilter !== undefined, startDate, endDate].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex flex-col gap-4">

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Job filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cron Job
                </label>
                <div className="relative">
                  <select
                    value={selectedJob}
                    onChange={(e) => handleJobFilterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 appearance-none"
                  >
                    <option value="all">All Jobs</option>
                    <option value="collect">Collect</option>
                    <option value="message">Message</option>
                    {cronJobs.filter(job => !['collect', 'message'].includes(job)).map((jobName) => (
                      <option key={jobName} value={jobName}>
                        {jobName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Status filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 appearance-none"
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
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
                    value={selectedPageSize}
                    onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 appearance-none"
                  >
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
                  Sort by Date
                </label>
                <div className="relative">
                  <select
                    value={selectedSortOrder}
                    onChange={(e) => handleSortOrderChange(e.target.value as 'asc' | 'desc')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 appearance-none"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Date filters row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Start Date filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <CustomDateInput
                  value={selectedStartDate}
                  onChange={handleStartDateChange}
                  placeholder="Select date"
                />
              </div>

              {/* End Date filter */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <CustomDateInput
                  value={selectedEndDate}
                  onChange={handleEndDateChange}
                  placeholder="Select date"
                />
              </div>
            </div>

            {/* Clear filters button */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isApiReady ? (
        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/6">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Error</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="px-6 py-4">
                    <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                      Data could not be loaded because API keys are not configured
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4">
              <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                Data could not be loaded because API keys are not configured
              </div>
            </div>
          </div>
        </div>
      ) : loading && history.length === 0 ? (
        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/6">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Error</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/6">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Error</th>
                </tr>
              </thead>

              {displayHistory && displayHistory.length > 0 ? (
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">

                  {displayHistory.map((entry, index) => (
                    <tr key={index} className="group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{entry.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="overflow-hidden">
                          <p className="whitespace-normal break-words">{formatDate(entry.timestamp)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${entry.success
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                        >
                          {entry.success ? 'Success' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {entry.error ? entry.error : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <tr>
                    <td colSpan={4} className="px-6 py-4">
                      <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
                        No data available
                      </div>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>

          <div className="md:hidden block">
            {history && history.length > 0 ? (
              history.map((entry, index) => (
                <div key={index} className={`bg-white dark:bg-gray-800 ${index !== history.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''} p-4 group hover:bg-gray-50 dark:hover:bg-gray-750`}>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</span>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">{entry.name}</div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</span>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">
                        <p className="whitespace-normal break-words">{formatDate(entry.timestamp)}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</span>
                      <div className="mt-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${entry.success
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                        >
                          {entry.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Error</span>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">
                        {entry.error ? entry.error : 'None'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                No data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {history.length > 0 && (
        <>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 md:block hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">
              <div className="text-sm text-gray-700 dark:text-gray-300">
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
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

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
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 border ${currentPage === pageNum ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'} text-xs sm:text-sm font-medium rounded-md min-w-[30px] sm:min-w-[40px] text-center justify-center`}
                        title={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === (totalPages || Math.ceil((totalItems || history.length) / pageSize))}
                    className="relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile pagination */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 md:hidden block">
            <div className="flex flex-col gap-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 text-center">
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
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] justify-center flex-shrink-0"
                    title="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
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
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`relative inline-flex items-center px-2 py-1 border text-sm font-medium rounded-md min-w-[32px] justify-center flex-shrink-0 ${currentPage === pageNum
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        title={`Go to page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === (totalPages || Math.ceil((totalItems || history.length) / pageSize))}
                    className="relative inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] justify-center flex-shrink-0"
                    title="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
