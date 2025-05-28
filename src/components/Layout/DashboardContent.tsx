import { Stats } from '../Stats';
import { RepositoryList } from '../RepositoryList';
import { GenerateForm } from '../GenerateForm';
import { CronJobs } from '../CronJobs';
import { CronJobHistory } from '../CronJobHistory';
import { RepositoryPreview } from '../RepositoryPreview';
import type { Repository } from '../../types';
import type { CronJob, CronJobHistory as CronJobHistoryType } from '../../api/index';
import type { ManualGenerateResponse } from '../../api';

interface DashboardContentProps {
  stats: {
    all: number;
    posted: number;
    unposted: number;
  };
  repositories: Repository[];
  latestPost?: Repository;
  nextPost?: Repository;
  cronJobs: CronJob[];
  loading: boolean;
  previewsLoading: boolean;
  cronJobsLoading: boolean;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
  fetchRepositories: (
    statusFilter?: boolean,
    append?: boolean,
    fetchAll?: boolean,
    itemsPerPage?: number,
    sortBy?: 'id' | 'date_added' | 'date_posted',
    sortOrder?: 'ASC' | 'DESC',
    page?: number,
    forceFetch?: boolean
  ) => Promise<void>;
  fetchPreviews: (forceFetch?: boolean) => Promise<void>;
  handleManualGenerate: (url: string) => Promise<ManualGenerateResponse>;
  handleAutoGenerate: (maxRepos: number, since: string, spokenLanguageCode: string) => Promise<{ status: string; added?: string[]; dont_added?: string[] }>;
  isApiReady: boolean;
  cronJobHistory?: CronJobHistoryType[];
  cronJobHistoryLoading?: boolean;
  cronJobHistoryPageSize?: number;
  cronJobHistoryNameFilter?: string;
  cronJobHistorySuccessFilter?: boolean;
  cronJobHistoryStartDate?: string;
  cronJobHistoryEndDate?: string;
  cronJobHistorySetNameFilter?: (nameFilter?: string) => void;
  cronJobHistorySetSuccessFilter?: (successFilter?: boolean) => void;
  cronJobHistorySetStartDate?: (startDate?: string) => void;
  cronJobHistorySetEndDate?: (endDate?: string) => void;
  cronJobHistoryResetFilters?: () => void;
  cronJobHistorySetPageSize?: (pageSize: number) => void;
  cronJobHistorySortOrder?: 'asc' | 'desc';
  cronJobHistorySetSortOrder?: (sortOrder: 'asc' | 'desc') => void;
  cronJobHistoryTotalItems?: number;
  cronJobHistoryTotalPages?: number;
  cronJobHistoryCurrentPage?: number;
  cronJobHistorySetPage?: (page: number) => void;
}

export const DashboardContent = ({
  stats,
  repositories,
  latestPost,
  nextPost,
  cronJobs,
  loading,
  previewsLoading,
  cronJobsLoading,
  pagination,
  fetchRepositories,
  handleManualGenerate,
  handleAutoGenerate,
  isApiReady,
  cronJobHistory,
  cronJobHistoryLoading,
  cronJobHistoryPageSize,
  cronJobHistoryNameFilter,
  cronJobHistorySuccessFilter,
  cronJobHistoryStartDate,
  cronJobHistoryEndDate,
  cronJobHistorySetNameFilter,
  cronJobHistorySetSuccessFilter,
  cronJobHistorySetStartDate,
  cronJobHistorySetEndDate,
  cronJobHistoryResetFilters,
  cronJobHistorySetPageSize,
  cronJobHistorySortOrder,
  cronJobHistorySetSortOrder,
  cronJobHistoryTotalItems,
  cronJobHistoryTotalPages,
  cronJobHistoryCurrentPage,
  cronJobHistorySetPage
}: DashboardContentProps) => {
  return (
    <>
      <Stats
        total={stats.all}
        posted={stats.posted}
        unposted={stats.unposted}
      />

      <div className="grid md:grid-cols-2 gap-6">
        <RepositoryPreview
          title="Next post"
          repository={nextPost}
          loading={previewsLoading}
          isApiReady={isApiReady}
        />
        <RepositoryPreview
          title="Latest post"
          repository={latestPost}
          loading={previewsLoading}
          isApiReady={isApiReady}
        />
      </div>

      <GenerateForm
        onManualGenerate={handleManualGenerate}
        onAutoGenerate={handleAutoGenerate}
      />

      <CronJobs
        jobs={cronJobs}
        loading={cronJobsLoading}
        isApiReady={isApiReady}
      />

      {cronJobHistory && (
        <CronJobHistory
          history={cronJobHistory}
          loading={cronJobHistoryLoading || false}
          pageSize={cronJobHistoryPageSize || 10}
          nameFilter={cronJobHistoryNameFilter}
          successFilter={cronJobHistorySuccessFilter}
          startDate={cronJobHistoryStartDate}
          endDate={cronJobHistoryEndDate}
          setNameFilter={cronJobHistorySetNameFilter}
          setSuccessFilter={cronJobHistorySetSuccessFilter}
          setStartDate={cronJobHistorySetStartDate}
          setEndDate={cronJobHistorySetEndDate}
          resetFilters={cronJobHistoryResetFilters}
          setPageSize={cronJobHistorySetPageSize}
          sortOrder={cronJobHistorySortOrder}
          setSortOrder={cronJobHistorySetSortOrder}
          totalItems={cronJobHistoryTotalItems}
          totalPages={cronJobHistoryTotalPages}
          currentPage={cronJobHistoryCurrentPage}
          setPage={cronJobHistorySetPage}
          isApiReady={isApiReady}
        />
      )}

      <RepositoryList
        repositories={repositories}
        fetchRepositories={fetchRepositories}
        currentPage={pagination.currentPage}
        pageSize={pagination.pageSize}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        loading={loading}
        isApiReady={isApiReady}
      />
    </>
  );
};
