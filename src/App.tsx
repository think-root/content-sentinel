import { useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import './styles/pull-to-refresh.css';
import { useResponsiveToast } from './hooks/useResponsiveToast';
import { useDisclosure } from './hooks/useDisclosure';
import { useRepositories } from './hooks/useRepositories';
import { usePreviews } from './hooks/usePreviews';
import { useCronJobs } from './hooks/useCronJobs';
import { useCronJobHistory } from './hooks/useCronJobHistory';
import { usePromptSettings } from './hooks/usePromptSettings';
import { useCache } from './hooks/useCache';
import { useDataRefresh } from './hooks/useDataRefresh';
import { useGenerateHandlers } from './hooks/useGenerateHandlers';
import { ToasterConfig } from './components/Toast/ToasterConfig';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { DashboardContent } from './components/Layout/DashboardContent';
import { SettingsModal } from './components/SettingsModal';
import { isApiConfigured } from './utils/api-settings';

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

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
    newDataAvailable: repoNewDataAvailable,
    newDataDetails,
    fetchRepositories,
    applyNewData: applyRepoNewData,
    setLoading
  } = useRepositories({ isCacheBust, setErrorWithScroll });

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
    applyNewData: applyCronJobsNewData
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
    successFilter: cronJobHistorySuccessFilter,
    startDate: cronJobHistoryStartDate,
    endDate: cronJobHistoryEndDate,
    newDataAvailable: cronJobHistoryNewDataAvailable,
    fetchCronJobHistory,
    applyNewData: applyCronJobHistoryNewData,
    setNameFilter: cronJobHistorySetNameFilter,
    setSuccessFilter: cronJobHistorySetSuccessFilter,
    setSortOrder: cronJobHistorySetSortOrder,
    setStartDate: cronJobHistorySetStartDate,
    setEndDate: cronJobHistorySetEndDate,
    resetFilters: cronJobHistoryResetFilters,
    setPageSize: cronJobHistorySetPageSize,
    setPage: cronJobHistorySetPage
  } = useCronJobHistory({ isCacheBust, setErrorWithScroll });

  const {
    fetchSettings: fetchPromptSettings
  } = usePromptSettings();

  useCache({ fetchRepositories, fetchPreviews, fetchCronJobs, fetchCronJobHistory });

  const { handleManualRefresh, handlePullToRefresh } = useDataRefresh({
    fetchRepositories,
    fetchPreviews,
    fetchCronJobs,
    fetchCronJobHistory,
    setLoading,
    setErrorWithScroll
  });

  const { handleManualGenerate, handleAutoGenerate } = useGenerateHandlers({
    fetchRepositories,
    setErrorWithScroll
  });

  useEffect(() => {
    if (!isApiReady) {
      return;
    }

    const savedStatusFilter = localStorage.getItem('dashboardStatusFilter') as 'all' | 'posted' | 'unposted' | null;
    const savedSortBy = localStorage.getItem('dashboardSortBy') as 'id' | 'date_added' | 'date_posted' | null;
    const savedSortOrder = localStorage.getItem('dashboardSortOrder') as 'ASC' | 'DESC' | null;
    const savedItemsPerPage = parseInt(localStorage.getItem('dashboardItemsPerPage') || '10', 10);

    const posted = savedStatusFilter === 'all' ? undefined : savedStatusFilter === 'posted';

    fetchRepositories(
      posted,
      false,
      savedItemsPerPage === 0,
      savedItemsPerPage,
      savedSortBy || 'date_added',
      savedSortOrder || 'DESC',
      1,
      isCacheBust
    );
    fetchPreviews(isCacheBust);
    fetchCronJobs(isCacheBust);
    fetchCronJobHistory(isCacheBust);
    fetchPromptSettings();
  }, [fetchRepositories, fetchPreviews, fetchCronJobs, fetchCronJobHistory, fetchPromptSettings, isCacheBust, isApiReady]);

  useEffect(() => {
    if (repoNewDataAvailable || previewsNewDataAvailable || cronJobsNewDataAvailable || cronJobHistoryNewDataAvailable) {
      const message = 'New data received from server';

      if (repoNewDataAvailable) applyRepoNewData();
      if (previewsNewDataAvailable) applyPreviewsNewData();
      if (cronJobsNewDataAvailable) applyCronJobsNewData();
      if (cronJobHistoryNewDataAvailable) applyCronJobHistoryNewData();

      if (!document.querySelector('[data-id="new-data-notification"]')) {
        toast.success(message, {
          id: 'new-data-notification',
          duration: 5000
        });
      }
    }
  }, [
    repoNewDataAvailable, previewsNewDataAvailable, cronJobsNewDataAvailable, cronJobHistoryNewDataAvailable,
    newDataDetails, applyRepoNewData, applyPreviewsNewData, applyCronJobsNewData, applyCronJobHistoryNewData
  ]);

  return (
    <Router>
      <Routes>
        <Route
          path="/dashboard/*"
          element={
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
              <ToasterConfig position={toastPosition} />

              <DashboardLayout
                isSettingsOpen={isSettingsOpen}
                onSettingsOpen={onSettingsOpen}
                onSettingsClose={onSettingsClose}
                handleManualRefresh={handleManualRefresh}
                handlePullToRefresh={handlePullToRefresh}
                loading={loading}
                previewsLoading={previewsLoading}
                isMobileDevice={isMobileDevice()}
                isApiReady={isApiReady}
              >
                <DashboardContent
                  stats={stats}
                  repositories={repositories}
                  latestPost={latestPost}
                  nextPost={nextPost}
                  cronJobs={cronJobs}
                  loading={loading}
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
                  cronJobHistorySuccessFilter={cronJobHistorySuccessFilter}
                  cronJobHistoryStartDate={cronJobHistoryStartDate}
                  cronJobHistoryEndDate={cronJobHistoryEndDate}
                  cronJobHistorySetNameFilter={cronJobHistorySetNameFilter}
                  cronJobHistorySetSuccessFilter={cronJobHistorySetSuccessFilter}
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
