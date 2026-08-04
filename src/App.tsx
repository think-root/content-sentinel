import { useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { toast } from './components/ui/common/toast-config';
import { useResponsiveToast } from './hooks/useResponsiveToast';
import { useDisclosure } from './hooks/useDisclosure';
import { useRepositories } from './hooks/useRepositories';
import { useArchive } from './hooks/useArchive';
import { usePreviews } from './hooks/usePreviews';
import { useCronJobs } from './hooks/useCronJobs';
import { useCronJobHistory } from './hooks/useCronJobHistory';
import { usePromptSettings } from './hooks/usePromptSettings';
import { useCache } from './hooks/useCache';
import { useDataRefresh } from './hooks/useDataRefresh';
import { useGenerateHandlers } from './hooks/useGenerateHandlers';
import { ToastConfig } from './components/ui/common/toast-config';
import { useOverviewHistory } from './hooks/useOverviewHistory';
import { DashboardLayout } from './components/ui/layout/dashboard-layout';
import { DashboardContent } from './components/ui/layout/dashboard-content';
import { SettingsModal } from './components/ui/common/settings-modal';
import { isApiConfigured } from './utils/api-settings';
import {
  DEFAULT_REPOSITORY_SORT_BY,
  DEFAULT_REPOSITORY_SORT_ORDER,
  DEFAULT_REPOSITORY_STATUS_FILTER,
  normalizeRepositoryFilterState,
} from './utils/repositoryListUtils';

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isCacheBust = urlParams.has('cache_bust');

  if (isCacheBust) {
    urlParams.delete('cache_bust');
    const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
    window.history.replaceState({}, document.title, newUrl);
  }

  const toastPosition = useResponsiveToast();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { isOpen: isNavOpen, onOpen: onNavOpen, onClose: onNavClose } = useDisclosure();
  const isApiReady = isApiConfigured();

  const setErrorWithScroll = useCallback((errorMessage: string, toastId?: string) => {
    toast.error(errorMessage, {
      id: toastId || `toast-${Date.now()}`,
      duration: 4000,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const {
    repositories,
    stats,
    pagination,
    loading,
    statsLoading,
    newDataAvailable: repoNewDataAvailable,
    newDataDetails,
    fetchRepositories,
    applyNewData: applyRepoNewData,
    setLoading
  } = useRepositories({ isCacheBust, setErrorWithScroll });

  const {
    items: archiveItems,
    all: archiveAll,
    loading: archiveLoading,
    filters: archiveFilters,
    showFilters: archiveShowFilters,
    currentPage: archiveCurrentPage,
    totalPages: archiveTotalPages,
    totalItems: archiveTotalItems,
    newDataAvailable: archiveNewDataAvailable,
    fetchArchive,
    setFilter: archiveSetFilter,
    setPage: archiveSetPage,
    resetFilters: archiveResetFilters,
    toggleFilters: archiveToggleFilters,
    refreshArchive,
    applyNewData: applyArchiveNewData
  } = useArchive({ isCacheBust, setErrorWithScroll });

  const {
    latestPost,
    nextPost,
    loading: previewsLoading,
    newDataAvailable: previewsNewDataAvailable,
    fetchPreviews,
    applyNewData: applyPreviewsNewData
  } = usePreviews({ isCacheBust, setErrorWithScroll });

  const {
    cronJobs,
    loading: cronJobsLoading,
    newDataAvailable: cronJobsNewDataAvailable,
    fetchCronJobs,
    applyNewData: applyCronJobsNewData,
    updateCronJobs
  } = useCronJobs({ isCacheBust, setErrorWithScroll });

  const {
    history,
    loading: cronJobHistoryLoading,
    page: cronJobHistoryCurrentPage,
    pageSize: cronJobHistoryPageSize,
    sortOrder: cronJobHistorySortOrder,
    totalItems: cronJobHistoryTotalItems,
    totalPages: cronJobHistoryTotalPages,
    nameFilter: cronJobHistoryNameFilter,
    statusFilter: cronJobHistoryStatusFilter,
    startDate: cronJobHistoryStartDate,
    endDate: cronJobHistoryEndDate,
    newDataAvailable: cronJobHistoryNewDataAvailable,
    fetchCronJobHistory,
    applyNewData: applyCronJobHistoryNewData,
    setNameFilter: cronJobHistorySetNameFilter,
    setStatusFilter: cronJobHistorySetStatusFilter,
    setSortOrder: cronJobHistorySetSortOrder,
    setStartDate: cronJobHistorySetStartDate,
    setEndDate: cronJobHistorySetEndDate,
    resetFilters: cronJobHistoryResetFilters,
    setPageSize: cronJobHistorySetPageSize,
    setPage: cronJobHistorySetPage
  } = useCronJobHistory({ isCacheBust, setErrorWithScroll });

  const {
    timeRange: overviewTimeRange,
    setTimeRange: setOverviewTimeRange,
    historyData: overviewHistoryData,
    loading: overviewLoading,
    refresh: refreshOverviewHistory
  } = useOverviewHistory({ isApiReady });

  const {
    fetchSettings: fetchPromptSettings
  } = usePromptSettings();

  useCache({ fetchRepositories, fetchPreviews, fetchCronJobs, fetchCronJobHistory });

  const { handleManualRefresh, isRefreshing } = useDataRefresh({
    fetchRepositories,
    fetchPreviews,
    fetchCronJobs,
    fetchCronJobHistory,
    refreshOverviewHistory,
    setLoading,
    setErrorWithScroll,
    applyRepoNewData,
    applyPreviewsNewData,
    applyCronJobsNewData,
    applyCronJobHistoryNewData,
    repoNewDataAvailable,
    previewsNewDataAvailable,
    cronJobsNewDataAvailable,
    cronJobHistoryNewDataAvailable
  });

  // Background refresh for Overview when it's active is handled by internal useEffect in the hook 
  // or we can add it to useDataRefresh if we want global refresh button to trigger it.
  // For now, let's just let it be persistent.
  // Actually, handleManualRefresh calls fetch functions. We should probably add refreshOverview to it.
  
  // Update useDataRefresh to accept refreshOverview? Or just wrap it here?
  // useDataRefresh takes a list of fetchers.
  // fetchRepositories, fetchPreviews, etc return Promise<void>.
  // refreshOverview returns Promise<void>.
  // So we can pass it if we update useDataRefresh signature, or just manually call it in handleManualRefresh wrapper?
  // useDataRefresh returns handleManualRefresh.
  
  // Let's keep it simple for now and not hook into manual refresh button yet perfectly, 
  // or I can manually trigger it if needed.
  // But wait, the user wants "checks for updates in background".
  // My hook useOverviewHistory fetches on mount (when App mounts? No, when isApiReady).
  // And it manages its own state.
  // If I want global refresh to work, I should pass it to useDataRefresh maybe?
  // But useDataRefresh expects specific new data flags.
  
  // Let's just focus on fixing the *loading state* first.
  
  const { handleManualGenerate, handleAutoGenerate } = useGenerateHandlers({
    fetchRepositories,
    setErrorWithScroll
  });

  // Bulk archiving moves rows out of github_repositories, so both lists need a foreground refresh.
  // Kept sequential and previews-free to stay within the Content Alchemist rate limit.
  const handleArchiveMutation = useCallback(async () => {
    await refreshArchive();

    const savedFilters = normalizeRepositoryFilterState(
      localStorage.getItem('dashboardStatusFilter') || DEFAULT_REPOSITORY_STATUS_FILTER,
      localStorage.getItem('dashboardSortBy') || DEFAULT_REPOSITORY_SORT_BY,
      localStorage.getItem('dashboardSortOrder') || DEFAULT_REPOSITORY_SORT_ORDER
    );
    const savedItemsPerPage = parseInt(localStorage.getItem('dashboardItemsPerPage') || '10', 10);

    await fetchRepositories(
      savedFilters.posted,
      false,
      savedItemsPerPage === 0,
      savedItemsPerPage,
      savedFilters.sortBy,
      savedFilters.sortOrder,
      1,
      true
    );
  }, [refreshArchive, fetchRepositories]);

  useEffect(() => {
    if (!isApiReady) {
      return;
    }

    // Fetch prompt settings (this is the only part that's not handled by the hooks)
    fetchPromptSettings();
  }, [fetchPromptSettings, isApiReady]);

  // Listen for settings saved event to trigger a single foreground refresh
  useEffect(() => {
    const onSettingsSaved = async () => {
      try {
        await handleManualRefresh(false);
      } catch {
        // Swallow errors here; underlying hooks already handle error surfacing or rate limits
      }
    };
    window.addEventListener('content-sentinel:settings-saved', onSettingsSaved as EventListener);
    return () => {
      window.removeEventListener('content-sentinel:settings-saved', onSettingsSaved as EventListener);
    };
  }, [handleManualRefresh]);
 
   useEffect(() => {
    // Prevent automatic updates when manual refresh is in progress
    if (isRefreshing) {
      return;
    }

    if (repoNewDataAvailable || previewsNewDataAvailable || cronJobsNewDataAvailable || cronJobHistoryNewDataAvailable || archiveNewDataAvailable) {
      if (repoNewDataAvailable) applyRepoNewData();
      if (previewsNewDataAvailable) applyPreviewsNewData();
      if (cronJobsNewDataAvailable) applyCronJobsNewData();
      if (cronJobHistoryNewDataAvailable) applyCronJobHistoryNewData();
      if (archiveNewDataAvailable) applyArchiveNewData();
    }
  }, [
    repoNewDataAvailable, previewsNewDataAvailable, cronJobsNewDataAvailable, cronJobHistoryNewDataAvailable,
    archiveNewDataAvailable, newDataDetails, applyRepoNewData, applyPreviewsNewData, applyCronJobsNewData,
    applyCronJobHistoryNewData, applyArchiveNewData, isRefreshing
  ]);

  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <div className="min-h-screen bg-background transition-colors">
              <ToastConfig position={toastPosition} />

              <DashboardLayout
                isRefreshing={isRefreshing}
                isSettingsOpen={isSettingsOpen}
                onSettingsOpen={onSettingsOpen}
                onSettingsClose={onSettingsClose}
                onNavOpen={onNavOpen}
                handleManualRefresh={handleManualRefresh}
                loading={loading}
                previewsLoading={previewsLoading}
                isApiReady={isApiReady}
              >
                <DashboardContent
                  stats={stats}
                  repositories={repositories}
                  latestPost={latestPost}
                  nextPost={nextPost}
                  cronJobs={cronJobs}
                  onCronJobsUpdate={updateCronJobs}
                  loading={loading}
                  statsLoading={statsLoading} // новий пропс
                  previewsLoading={previewsLoading}
                  cronJobsLoading={cronJobsLoading}
                  pagination={pagination}
                  fetchRepositories={fetchRepositories}
                  fetchPreviews={fetchPreviews}
                  handleManualGenerate={handleManualGenerate}
                  handleAutoGenerate={handleAutoGenerate}
                  isApiReady={isApiReady}
                  cronJobHistory={history}
                  cronJobHistoryLoading={cronJobHistoryLoading}
                  cronJobHistoryPageSize={cronJobHistoryPageSize}
                  cronJobHistoryNameFilter={cronJobHistoryNameFilter}
                  cronJobHistoryStatusFilter={cronJobHistoryStatusFilter}
                  cronJobHistoryStartDate={cronJobHistoryStartDate}
                  cronJobHistoryEndDate={cronJobHistoryEndDate}
                  cronJobHistorySetNameFilter={cronJobHistorySetNameFilter}
                  cronJobHistorySetStatusFilter={cronJobHistorySetStatusFilter}
                  cronJobHistorySetStartDate={cronJobHistorySetStartDate}
                  cronJobHistorySetEndDate={cronJobHistorySetEndDate}
                  cronJobHistoryResetFilters={cronJobHistoryResetFilters}
                  cronJobHistorySetPageSize={cronJobHistorySetPageSize}
                  cronJobHistorySortOrder={cronJobHistorySortOrder}
                  cronJobHistorySetSortOrder={cronJobHistorySetSortOrder}
                  cronJobHistoryTotalItems={cronJobHistoryTotalItems}
                  cronJobHistoryTotalPages={cronJobHistoryTotalPages}
                  cronJobHistoryCurrentPage={cronJobHistoryCurrentPage}
                  cronJobHistorySetPage={cronJobHistorySetPage}
                  overviewTimeRange={overviewTimeRange}
                  setOverviewTimeRange={setOverviewTimeRange}
                  overviewHistoryData={overviewHistoryData}
                  overviewLoading={overviewLoading}
                  isNavOpen={isNavOpen}
                  onNavOpen={onNavOpen}
                  onNavClose={onNavClose}
                  archiveItems={archiveItems}
                  archiveAll={archiveAll}
                  archiveLoading={archiveLoading}
                  archiveFilters={archiveFilters}
                  archiveShowFilters={archiveShowFilters}
                  archiveCurrentPage={archiveCurrentPage}
                  archiveTotalPages={archiveTotalPages}
                  archiveTotalItems={archiveTotalItems}
                  archiveSetFilter={archiveSetFilter}
                  archiveSetPage={archiveSetPage}
                  archiveResetFilters={archiveResetFilters}
                  archiveToggleFilters={archiveToggleFilters}
                  fetchArchive={fetchArchive}
                  refreshArchive={refreshArchive}
                  onArchiveMutation={handleArchiveMutation}
                />
              </DashboardLayout>
              <SettingsModal isOpen={isSettingsOpen} onClose={onSettingsClose} />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
