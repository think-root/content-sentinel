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

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../base/tooltip';

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
  onCronJobsUpdate?: (jobs: CronJob[]) => void;
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
  onCronJobsUpdate,
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

  // Track unsaved changes in AI Settings tab
  const [hasUnsavedSettingsChanges, setHasUnsavedSettingsChanges] = useState(false);

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

  // Track swipe-origin animations and direction (mobile-only)
  const [lastSwipeDir, setLastSwipeDir] = useState<"left" | "right" | null>(null);
  const [animateOnSwipe, setAnimateOnSwipe] = useState(false);

  // Swipe intent handlers derived from useSwipeableTabs
  const { onSwipedLeft, onSwipedRight } = useSwipeableTabs(
    activeTab,
    setActiveTab,
    orderedTabs as unknown as string[],
  );

  // Initialize react-swipeable
  const swipeableHandlers = useSwipeable({
    onSwipedLeft: () => {
      // Ignore swipe if user is selecting text
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;

      if (isMobile) {
        setLastSwipeDir("left");
        setAnimateOnSwipe(true);
        // Reset scroll position on swipe navigation (mobile only)
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      onSwipedLeft();
      if (isMobile) {
        setTimeout(() => setAnimateOnSwipe(false), 300);
      }
    },
    onSwipedRight: () => {
      // Ignore swipe if user is selecting text
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;

      if (isMobile) {
        setLastSwipeDir("right");
        setAnimateOnSwipe(true);
        // Reset scroll position on swipe navigation (mobile only)
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
      onSwipedRight();
      if (isMobile) {
        setTimeout(() => setAnimateOnSwipe(false), 300);
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 50,
  });

  // Trigger API calls when switching to Overview tab
  useEffect(() => {
    if (activeTab === 'overview') {
      // Only fetch previews - repositories hook handles its own initialization
      fetchPreviews();
    }
  }, [activeTab, fetchPreviews]);

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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <TabsTrigger value="settings" className="w-full whitespace-nowrap px-3 py-2 text-sm">
                      AI Settings{hasUnsavedSettingsChanges && ' *'}
                    </TabsTrigger>
                  </div>
                </TooltipTrigger>
                {hasUnsavedSettingsChanges && (
                  <TooltipContent>
                    <p>You have unsaved changes</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <TabsTrigger value="settings" className="w-full">
                    AI Settings{hasUnsavedSettingsChanges && ' *'}
                  </TabsTrigger>
                </div>
              </TooltipTrigger>
              {hasUnsavedSettingsChanges && (
                <TooltipContent>
                  <p>You have unsaved changes</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </TabsList>

        <div
          {...(isMobile ? swipeableHandlers : {})}
          className={`w-full ${
            isMobile && animateOnSwipe && lastSwipeDir === 'left' ? 'motion-safe:animate-slide-fade-in-from-left' : ''
          } ${
            isMobile && animateOnSwipe && lastSwipeDir === 'right' ? 'motion-safe:animate-slide-fade-in-from-right' : ''
          }`}
        >
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
              onJobsUpdate={onCronJobsUpdate}
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

          {/* Settings Tab - forceMount to preserve state when switching tabs */}
          <TabsContent
            value="settings"
            forceMount
            className={activeTab !== 'settings' ? 'hidden' : ''}
          >
            <PromptSettings
              isApiReady={isApiReady}
              onUnsavedChangesChange={setHasUnsavedSettingsChanges}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};