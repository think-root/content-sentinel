import { Stats } from '../Stats';
import { RepositoryList } from '../RepositoryList';
import { GenerateForm } from '../GenerateForm';
import { CronJobs } from '../CronJobs';
import { RepositoryPreview } from '../RepositoryPreview';
import type { Repository } from '../../types';
import type { CronJob } from '../../api/index';
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
  isApiReady
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