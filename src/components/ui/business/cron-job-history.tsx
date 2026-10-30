import { useState, useEffect } from 'react';
import { getCronJobs } from '@/api/maestro';
import { Filter, ChevronDown, Clock } from 'lucide-react';
import type { CronJobHistory as CronJobHistoryType } from '@/api/maestro';
import { buildRetryConfirmMessage } from '@/utils/message-retry';
import { useHistoryRetry } from '@/hooks/useHistoryRetry';
import { ConfirmDialog } from '@/components/ui/common/confirm-dialog';
import { Button } from "@/components/ui/base/button";
import { storage } from '../../../lib/storage';
import { CronHistoryFilters } from './cron-history-filters';
import { CronHistoryList } from './cron-history-list';
import { CronHistoryPagination } from './cron-history-pagination';

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
  /** Called after a manual retry so the caller can refresh the history. */
  onRetryComplete?: () => void | Promise<void>;
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
  setEndDate,
  onRetryComplete
}: CronJobHistoryProps) => {
  const [cronJobs, setCronJobs] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(() => {
    const saved = storage.get('cronHistoryShowFilters');
    return saved === 'true';
  });
  const {
    retryingKey,
    retriedKeys,
    retryConfirm,
    openRetryConfirm,
    confirmRetry,
    cancelRetry,
  } = useHistoryRetry(onRetryComplete);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const jobs = await getCronJobs();
        setCronJobs(jobs.map((job) => job.name));
      } catch {
        console.log('Failed to fetch cron jobs.');
      }
    };

    if (isApiReady) {
      fetchJobs();
    }
  }, [isApiReady]);

  const handleToggleFilters = () => {
    const newValue = !showFilters;
    setShowFilters(newValue);
    storage.set('cronHistoryShowFilters', newValue.toString());
  };

  const handlePageChange = (page: number) => {
    if (loading || !setPage) return;
    setPage(page);
  };

  const hasActiveFilters = nameFilter || statusFilter !== undefined || startDate || endDate;

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

      {showFilters && (
        <CronHistoryFilters
          cronJobs={cronJobs}
          nameFilter={nameFilter}
          statusFilter={statusFilter}
          pageSize={pageSize}
          sortOrder={sortOrder}
          startDate={startDate}
          endDate={endDate}
          hasActiveFilters={Boolean(hasActiveFilters)}
          setNameFilter={setNameFilter}
          setStatusFilter={setStatusFilter}
          setPageSize={setPageSize}
          setSortOrder={setSortOrder}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          resetFilters={resetFilters}
        />
      )}

      <CronHistoryList
        history={history}
        loading={loading}
        isApiReady={isApiReady}
        retryingKey={retryingKey}
        retriedKeys={retriedKeys}
        onRetry={openRetryConfirm}
      />

      <CronHistoryPagination
        itemCount={history.length}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      <ConfirmDialog
        isOpen={retryConfirm !== null}
        title="Publish again"
        message={retryConfirm ? buildRetryConfirmMessage(retryConfirm) : ''}
        confirmText="Publish"
        cancelText="Cancel"
        variant="info"
        onConfirm={confirmRetry}
        onCancel={cancelRetry}
      />
    </div>
  );
};
