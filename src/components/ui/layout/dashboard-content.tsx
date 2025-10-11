import { useEffect, useState } from 'react';
import { Stats } from '../business/stats';
import { RepositoryList } from '../business/repository-list';
import { GenerateForm } from '../business/generate-form';
import { PromptSettings } from '../business/prompt-settings';
import { CronJobs } from '../business/cron-jobs';
import { CronJobHistory } from '../business/cron-job-history';
import { RepositoryPreview } from '../business/repository-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../base/tabs';
import { useTabPersistence } from '../../../hooks/useTabPersistence';
import { useSwipeable } from 'react-swipeable';
import { useSwipeableTabs } from '@/hooks/useSwipeableTabs';
import type { Repository } from '../../../types';
import type { CronJob, CronJobHistory as CronJobHistoryType } from '../../../api/index';
import type { ManualGenerateResponse } from '../../../api';

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
  statsLoading: boolean;
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
  statsLoading, // новий пропс
  previewsLoading,
  cronJobsLoading,
  pagination,
  fetchRepositories,
  fetchPreviews,
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
  const { activeTab, setActiveTab } = useTabPersistence('overview');

  // Ordered tabs for swipe navigation (readonly tuple for type-safety)
  const orderedTabs = ['overview','repositories','automation','settings'] as const;

  // Mobile detection flag
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    // Initialize state
    setIsMobile(mql.matches);
    // Listen for viewport changes
    mql.addEventListener?.('change', handleChange);
    return () => {
      mql.removeEventListener?.('change', handleChange);
    };
  }, []);

  // Swipe intent handlers derived from useSwipeableTabs
  const { onSwipedLeft, onSwipedRight } = useSwipeableTabs(
    activeTab,
    setActiveTab,
    orderedTabs as unknown as string[],
  );

  // Initialize react-swipeable
  const swipeableHandlers = useSwipeable({
    onSwipedLeft,
    onSwipedRight,
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 50,
  });

  // Trigger API calls when switching to Overview tab
  useEffect(() => {
    if (activeTab === 'overview') {
      // Fetch repositories and previews for the Overview tab
      fetchRepositories();
      fetchPreviews();
    }
  }, [activeTab, fetchRepositories, fetchPreviews]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile Tab Navigation - Full Width */}
        <div className="md:hidden w-full mb-4 sm:mb-6">
          <TabsList className="flex h-10 items-center justify-between rounded-md bg-muted p-1 text-muted-foreground w-full">
            <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-2 text-sm flex-1">
              Overview
            </TabsTrigger>
            <TabsTrigger value="repositories" className="whitespace-nowrap px-3 py-2 text-sm flex-1">
              Repos
            </TabsTrigger>
            <TabsTrigger value="automation" className="whitespace-nowrap px-3 py-2 text-sm flex-1">
              Cron
            </TabsTrigger>
            <TabsTrigger value="settings" className="whitespace-nowrap px-3 py-2 text-sm flex-1">
              AI Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Desktop Tab Navigation - Grid Layout */}
        <TabsList className="hidden md:grid w-full grid-cols-4 gap-2 mb-4 sm:mb-6">
          <TabsTrigger value="overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="repositories">
            Repositories
          </TabsTrigger>
          <TabsTrigger value="automation">
            Cron
          </TabsTrigger>
          <TabsTrigger value="settings">
            AI Settings
          </TabsTrigger>
        </TabsList>

        <div {...(isMobile ? swipeableHandlers : {})}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Repository Statistics */}
            <Stats
              total={stats.all}
              posted={stats.posted}
              unposted={stats.unposted}
              loading={statsLoading}
            />

            {/* Repository Previews */}
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
          </TabsContent>

          {/* Repositories Tab */}
          <TabsContent value="repositories" className="space-y-6">
            {/* Generate Content */}
            <GenerateForm
              onManualGenerate={handleManualGenerate}
              onAutoGenerate={handleAutoGenerate}
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
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="space-y-6">
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
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <PromptSettings
              isApiReady={isApiReady}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};