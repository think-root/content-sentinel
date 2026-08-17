import { useEffect, useRef, useState } from 'react';
import { OverviewCharts } from '../business/overview-charts';
import { Card, CardContent } from '../layout/card';
import { Clock, Server } from 'lucide-react';
import { RepositoryList } from '../business/repository-list';
import { GenerateForm } from '../business/generate-form';
import { PromptSettings } from '../business/prompt-settings';
import { CronJobs } from '../business/cron-jobs';
import { ApiConfigs } from '../business/api-configs';
import { CronJobHistory } from '../business/cron-job-history';
import { RepositoryPreview } from '../business/repository-preview';
import { ArchiveList } from '../business/archive-list';
import { ArchiveOldRepositories } from '../business/archive-old-repositories';
import { Tabs, TabsContent } from '../base/tabs';
import { DashboardSidebar } from './dashboard-sidebar';
import { DashboardBottomNav } from './dashboard-bottom-nav';
import { NAV_KEYS, type DashboardTabKey } from '@/config/nav-items';
import { useTabPersistence } from '../../../hooks/useTabPersistence';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSwipeable } from 'react-swipeable';
import { useSwipeableTabs } from '@/hooks/useSwipeableTabs';
import type { Repository, RepositorySortBy, RepositorySortOrder } from '../../../types';
import type { ArchiveFilterKey, ArchiveFilterState, ArchivedRepository } from '../../../types/archive';
import type { CronJob, CronJobHistory as CronJobHistoryType } from '../../../api/index';
import type { ManualGenerateResponse } from '../../../api';
import { useApiConfigs } from '../../../hooks/useApiConfigs';
import type { TimeRange } from '../../../hooks/useOverviewHistory';

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
    sortBy?: RepositorySortBy,
    sortOrder?: RepositorySortOrder,
    page?: number,
    forceFetch?: boolean
  ) => Promise<void>;
  fetchPreviews: (forceFetch?: boolean) => Promise<void>;
  handleManualGenerate: (url: string) => Promise<ManualGenerateResponse>;
  handleAutoGenerate: (
    maxRepos: number,
    resource: string,
    since: string,
    spokenLanguageCode: string,
    period: string,
    language: string
  ) => Promise<ManualGenerateResponse>;
  isApiReady: boolean;
  cronJobHistory?: CronJobHistoryType[];
  cronJobHistoryLoading?: boolean;
  cronJobHistoryPageSize?: number;
  cronJobHistoryNameFilter?: string;
  cronJobHistoryStatusFilter?: number;
  cronJobHistoryStartDate?: string;
  cronJobHistoryEndDate?: string;
  cronJobHistorySetNameFilter?: (nameFilter?: string) => void;
  cronJobHistorySetStatusFilter?: (statusFilter?: number) => void;
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
  cronJobHistoryOnRetryComplete?: () => void | Promise<void>;
  overviewTimeRange: TimeRange;
  setOverviewTimeRange: (range: TimeRange) => void;
  overviewHistoryData: CronJobHistoryType[];
  overviewLoading: boolean;
  archiveItems: ArchivedRepository[];
  archiveAll: number;
  archiveLoading: boolean;
  archiveFilters: ArchiveFilterState;
  archiveShowFilters: boolean;
  archiveCurrentPage: number;
  archiveTotalPages: number;
  archiveTotalItems: number;
  archiveSetFilter: <K extends ArchiveFilterKey>(key: K, value: ArchiveFilterState[K]) => void;
  archiveSetPage: (page: number) => void;
  archiveResetFilters: () => void;
  archiveToggleFilters: () => void;
  fetchArchive: (forceFetch?: boolean) => Promise<void>;
  refreshArchive: () => Promise<void>;
  onArchiveMutation: () => Promise<void>;
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
  cronJobHistoryStatusFilter,
  cronJobHistoryStartDate,
  cronJobHistoryEndDate,
  cronJobHistorySetNameFilter,
  cronJobHistorySetStatusFilter,
  cronJobHistorySetStartDate,
  cronJobHistorySetEndDate,
  cronJobHistoryResetFilters,
  cronJobHistorySetPageSize,
  cronJobHistorySortOrder,
  cronJobHistorySetSortOrder,
  cronJobHistoryTotalItems,
  cronJobHistoryTotalPages,
  cronJobHistoryCurrentPage,
  cronJobHistorySetPage,
  cronJobHistoryOnRetryComplete,
  overviewTimeRange,
  setOverviewTimeRange,
  overviewHistoryData,
  overviewLoading,
  archiveItems,
  archiveAll,
  archiveLoading,
  archiveFilters,
  archiveShowFilters,
  archiveCurrentPage,
  archiveTotalPages,
  archiveTotalItems,
  archiveSetFilter,
  archiveSetPage,
  archiveResetFilters,
  archiveToggleFilters,
  fetchArchive,
  refreshArchive,
  onArchiveMutation
}: DashboardContentProps) => {
  const { activeTab, setActiveTab } = useTabPersistence('overview');

  // API Configs hook for Integrations tab
  const {
    configs: apiConfigs,
    loading: apiConfigsLoading,
    saving: apiConfigsSaving,
    deleting: apiConfigsDeleting,
    addConfig: addApiConfig,
    editConfig: editApiConfig,
    removeConfig: removeApiConfig,
  } = useApiConfigs({ setErrorWithScroll: () => { } });

  // Track unsaved changes in AI Settings tab
  const [hasUnsavedSettingsChanges, setHasUnsavedSettingsChanges] = useState(false);

  // Mobile detection flag
  const isMobile = useIsMobile();

  // Track swipe-origin animations and direction (mobile-only)
  const [lastSwipeDir, setLastSwipeDir] = useState<"left" | "right" | null>(null);
  const [animateOnSwipe, setAnimateOnSwipe] = useState(false);

  // Swipe intent handlers derived from useSwipeableTabs
  const { onSwipedLeft, onSwipedRight } = useSwipeableTabs(
    activeTab,
    setActiveTab as (tab: string) => void,
    NAV_KEYS,
  );

  // Selecting a nav item resets scroll position
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as DashboardTabKey);
    if (isMobile) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  };

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

  // Fetched once per session, on the first visit to either tab that shows archive numbers -
  // lazily rather than at startup so cold start stays under the API rate limit.
  // Gated on isApiReady: without credentials the API layer returns an empty stub that would be
  // cached as a legitimately empty archive, and the ref would then block the refetch after the
  // user saves their settings.
  const archiveFetchedRef = useRef(false);
  useEffect(() => {
    if (!isApiReady) {
      return;
    }
    if ((activeTab === 'archive' || activeTab === 'overview') && !archiveFetchedRef.current) {
      archiveFetchedRef.current = true;
      fetchArchive(false);
    }
  }, [activeTab, fetchArchive, isApiReady]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs value={activeTab} onValueChange={handleTabChange} orientation="vertical" className="w-full">
        <div className="md:flex md:items-start md:gap-6">
          {/* Both navs render unconditionally and hide via CSS (`hidden md:block` /
              `md:hidden`), so no JS breakpoint sits in the nav path and neither can
              flicker in on the first paint. */}
          <DashboardSidebar hasUnsavedSettingsChanges={hasUnsavedSettingsChanges} />
          <DashboardBottomNav
            activeTab={activeTab}
            onSelect={handleTabChange}
            hasUnsavedSettingsChanges={hasUnsavedSettingsChanges}
          />

          {/* min-w-0 keeps wide tables/charts from blowing out the flex row */}
          <div
            {...(isMobile ? swipeableHandlers : {})}
            className={`w-full min-w-0 flex-1 ${
              isMobile && animateOnSwipe && lastSwipeDir === 'left' ? 'motion-safe:animate-slide-fade-in-from-left' : ''
            } ${
              isMobile && animateOnSwipe && lastSwipeDir === 'right' ? 'motion-safe:animate-slide-fade-in-from-right' : ''
            }`}
          >
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            {/* Top Grid: Previews & Static Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Active Cron Jobs */}
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Cron Jobs</p>
                      <h3 className="text-3xl font-bold mt-2">{cronJobs.filter(j => j.is_active).length}<span className="text-muted-foreground text-lg font-normal">/{cronJobs.length}</span></h3>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {cronJobs.slice(0, 3).map((job, idx) => {
                      const colors = [
                        'bg-blue-500/10 text-blue-500 border-blue-500/20',
                        'bg-green-500/10 text-green-500 border-green-500/20',
                        'bg-orange-500/10 text-orange-500 border-orange-500/20',
                        'bg-purple-500/10 text-purple-500 border-purple-500/20',
                        'bg-pink-500/10 text-pink-500 border-pink-500/20',
                      ];
                      const colorClass = job.is_active
                        ? colors[idx % colors.length]
                        : 'bg-muted text-muted-foreground border-border';

                      return (
                        <span key={job.name} className={`text-[10px] px-2 py-1 rounded border ${colorClass}`}>
                          {job.name}
                        </span>
                      );
                    })}
                    {cronJobs.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">+{cronJobs.length - 3} more</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Active Integrations */}
              <Card className="h-full">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Integrations</p>
                      <h3 className="text-3xl font-bold mt-2">{apiConfigs.filter(c => c.enabled).length}<span className="text-muted-foreground text-lg font-normal">/{apiConfigs.length}</span></h3>
                    </div>
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                      <Server className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground flex flex-wrap gap-1">
                    {apiConfigs.filter(a => a.enabled).slice(0, 3).map((api, idx) => {
                      const colors = [
                        'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
                        'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
                        'bg-rose-500/10 text-rose-500 border-rose-500/20',
                        'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                        'bg-amber-500/10 text-amber-500 border-amber-500/20',
                      ];
                      return (
                        <span key={api.id} className={`inline-flex items-center px-2 py-1 text-xs rounded border ${colors[idx % colors.length]}`}>
                          {api.name}
                        </span>
                      );
                    })}
                    {apiConfigs.filter(a => a.enabled).length > 3 && <span>+{apiConfigs.filter(a => a.enabled).length - 3} more</span>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comprehensive Dashboard Charts */}
            <OverviewCharts
              posted={stats.posted}
              unposted={stats.unposted}
              archived={archiveAll}
              statsLoading={statsLoading}
              cronJobs={cronJobs}
              cronJobsLoading={cronJobsLoading}
              apiConfigs={apiConfigs}
              apiConfigsLoading={apiConfigsLoading}
              timeRange={overviewTimeRange}
              setTimeRange={setOverviewTimeRange}
              historyData={overviewHistoryData}
              historyLoading={overviewLoading}
            />
          </TabsContent>

          {/* Repositories Tab */}
          <TabsContent value="repositories" className="mt-0 space-y-6">
            {/* Generate Content */}
            <GenerateForm
              onManualGenerate={handleManualGenerate}
              onAutoGenerate={handleAutoGenerate}
            />
            
            <RepositoryList
              repositories={repositories}
              fetchRepositories={fetchRepositories}
              fetchPreviews={fetchPreviews}
              nextPostId={nextPost?.id}
              currentPage={pagination.currentPage}
              pageSize={pagination.pageSize}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              loading={loading}
              isApiReady={isApiReady}
              onRepositoryArchived={refreshArchive}
            />
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archive" className="mt-0 space-y-6">
            <ArchiveOldRepositories
              isApiReady={isApiReady}
              onArchived={onArchiveMutation}
            />

            <ArchiveList
              items={archiveItems}
              all={archiveAll}
              loading={archiveLoading}
              isApiReady={isApiReady}
              filters={archiveFilters}
              showFilters={archiveShowFilters}
              currentPage={archiveCurrentPage}
              totalPages={archiveTotalPages}
              totalItems={archiveTotalItems}
              onFilterChange={archiveSetFilter}
              onClearFilters={archiveResetFilters}
              onToggleFilters={archiveToggleFilters}
              onPageChange={archiveSetPage}
            />
          </TabsContent>

          {/* Automation Tab */}
          <TabsContent value="automation" className="mt-0 space-y-6">
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
                statusFilter={cronJobHistoryStatusFilter}
                startDate={cronJobHistoryStartDate}
                endDate={cronJobHistoryEndDate}
                setNameFilter={cronJobHistorySetNameFilter}
                setStatusFilter={cronJobHistorySetStatusFilter}
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
                onRetryComplete={cronJobHistoryOnRetryComplete}
                isApiReady={isApiReady}
              />
            )}
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="mt-0 space-y-6">
            <ApiConfigs
              configs={apiConfigs}
              loading={apiConfigsLoading}
              saving={apiConfigsSaving}
              deleting={apiConfigsDeleting}
              isApiReady={isApiReady}
              onAdd={addApiConfig}
              onEdit={editApiConfig}
              onDelete={removeApiConfig}
            />
          </TabsContent>

          {/* Settings Tab - forceMount to preserve state when switching tabs */}
          <TabsContent
            value="settings"
            forceMount
            className={activeTab !== 'settings' ? 'hidden' : 'mt-0'}
          >
            <PromptSettings
              isApiReady={isApiReady}
              onUnsavedChangesChange={setHasUnsavedSettingsChanges}
            />
          </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};
