import { useEffect, useState, useCallback } from 'react';
import { Stats } from './components/Stats';
import { RepositoryList } from './components/RepositoryList';
import { GenerateForm } from './components/GenerateForm';
import { CronJobs } from './components/CronJobs';
import { RepositoryPreview } from './components/RepositoryPreview';
import { Toaster, toast, ToastBar } from 'react-hot-toast';
import {
  getRepositories,
  manualGenerate,
  autoGenerate,
  ManualGenerateResponse,
  getLatestPostedRepository,
  getNextRepository
} from './api';
import { getCronJobs, type CronJob } from './api/index';
import type { Repository } from './types';
import { LayoutDashboard, RefreshCw, RotateCw } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { SettingsButton } from './components/SettingsButton';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PullToRefresh from 'react-simple-pull-to-refresh';
import './styles/pull-to-refresh.css';
import { useResponsiveToast } from './hooks/useResponsiveToast';
import { useDisclosure } from './hooks/useDisclosure';
import {
  saveRepositoriesToCache,
  getRepositoriesFromCache,
  savePreviewsToCache,
  getPreviewsFromCache,
  saveCronJobsToCache,
  getCronJobsFromCache,
  clearAllCaches
} from './utils/cache-utils';
import { compareRepositories, comparePreviews, compareCronJobs } from './utils/data-comparison';

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;

function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isCacheBust = urlParams.has('cache_bust');

  const cachedRepositories = isCacheBust ? null : getRepositoriesFromCache();
  const cachedPreviews = isCacheBust ? null : getPreviewsFromCache();
  const cachedCronJobs = isCacheBust ? null : getCronJobsFromCache();

  if (isCacheBust) {
    urlParams.delete('cache_bust');
    const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
    window.history.replaceState({}, document.title, newUrl);
  }

  const toastPosition = useResponsiveToast();

  const [repositories, setRepositories] = useState<Repository[]>(
    cachedRepositories?.repositories || []
  );
  const [stats, setStats] = useState(
    cachedRepositories?.stats || { all: 0, posted: 0, unposted: 0 }
  );
  const [loading, setLoading] = useState(!cachedRepositories);
  const [latestPost, setLatestPost] = useState<Repository | undefined>(
    cachedPreviews?.latestPost
  );
  const [nextPost, setNextPost] = useState<Repository | undefined>(
    cachedPreviews?.nextPost
  );
  const [previewsLoading, setPreviewsLoading] = useState(!cachedPreviews);
  const [cronJobsLoading, setCronJobsLoading] = useState(!cachedCronJobs);
  const [pagination, setPagination] = useState(
    cachedRepositories?.pagination || {
      currentPage: 1,
      pageSize: parseInt(localStorage.getItem('dashboardItemsPerPage') || '10', 10),
      totalPages: 1,
      totalItems: 0
    }
  );
  const [cronJobs, setCronJobs] = useState<CronJob[]>(
    cachedCronJobs?.cronJobs || []
  );

  const [newDataAvailable, setNewDataAvailable] = useState({
    repositories: false,
    previews: false,
    cronJobs: false
  });

  const [newDataDetails, setNewDataDetails] = useState({
    newCount: 0,
    updatedCount: 0
  });

  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();

  const setErrorWithScroll = useCallback((errorMessage: string, toastId?: string) => {
    toast.error(errorMessage, {
      id: toastId || `toast-${Date.now()}`,
      duration: 4000,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const fetchRepositories = useCallback(async (
    statusFilter?: boolean,
    append: boolean = false,
    fetchAll: boolean = false,
    itemsPerPage: number = pagination.pageSize,
    sortBy?: 'id' | 'date_added' | 'date_posted',
    sortOrder?: 'ASC' | 'DESC',
    page?: number,
    forceFetch: boolean = false
  ) => {
    try {
      const cacheKey = JSON.stringify({ statusFilter, fetchAll, itemsPerPage, sortBy, sortOrder, page });
      const currentCacheKey = localStorage.getItem('cache_repositories_key');

      if (currentCacheKey !== cacheKey || forceFetch) {
        if (!append) {
          setLoading(true);
        }
      }

      const isBackgroundFetch = currentCacheKey === cacheKey && !forceFetch;
      await fetchRepositoriesFromAPI(statusFilter, fetchAll, itemsPerPage, sortBy, sortOrder, page, isBackgroundFetch);
    } catch {
      setErrorWithScroll('Failed to connect to Content Alchemist API', 'content-alchemist-error');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setErrorWithScroll]);

  const fetchRepositoriesFromAPI = async (
    statusFilter?: boolean,
    fetchAll: boolean = false,
    itemsPerPage: number = pagination.pageSize,
    sortBy?: 'id' | 'date_added' | 'date_posted',
    sortOrder?: 'ASC' | 'DESC',
    page?: number,
    isBackgroundFetch: boolean = false
  ) => {
    try {
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));

      const response = await getRepositories(
        itemsPerPage,
        statusFilter,
        fetchAll,
        sortBy,
        sortOrder,
        fetchAll ? undefined : page,
        fetchAll ? 0 : itemsPerPage
      );

      if (response && response.data && response.data.items) {
        const processedItems = response.data.items.map((item: Repository) => ({
          ...item,
          posted: Boolean(item.posted)
        }));

        const cacheKey = JSON.stringify({ statusFilter, fetchAll, itemsPerPage, sortBy, sortOrder, page });
        localStorage.setItem('cache_repositories_key', cacheKey);

        const newData = {
          repositories: processedItems,
          stats: {
            all: response.data.all,
            posted: response.data.posted,
            unposted: response.data.unposted,
          }
        };

        const cachedData = getRepositoriesFromCache();

        if (isBackgroundFetch && cachedData) {
          const comparison = compareRepositories(newData, cachedData);

          if (comparison.hasChanges) {
            setTimeout(() => {
              setNewDataDetails({
                newCount: comparison.newCount,
                updatedCount: comparison.updatedCount
              });
              setNewDataAvailable(prev => ({ ...prev, repositories: true }));
            }, 100);

            if (!isCacheBust) {
              saveRepositoriesToCache({
                repositories: processedItems,
                stats: {
                  all: response.data.all,
                  posted: response.data.posted,
                  unposted: response.data.unposted,
                },
                pagination: {
                  currentPage: fetchAll ? 1 : response.data.page,
                  pageSize: fetchAll ? 0 : response.data.page_size,
                  totalPages: response.data.total_pages,
                  totalItems: response.data.total_items
                },
                timestamp: Date.now()
              });
            }
          }
        } else if (!isBackgroundFetch || isCacheBust) {
          setRepositories(processedItems);
          setStats({
            all: response.data.all,
            posted: response.data.posted,
            unposted: response.data.unposted,
          });

          setPagination(prev => {
            const newPagination = {
              currentPage: fetchAll ? 1 : response.data.page,
              pageSize: fetchAll ? 0 : response.data.page_size,
              totalPages: response.data.total_pages,
              totalItems: response.data.total_items
            };

            if (prev.currentPage === newPagination.currentPage &&
              prev.pageSize === newPagination.pageSize &&
              prev.totalPages === newPagination.totalPages &&
              prev.totalItems === newPagination.totalItems) {
              return prev;
            }

            return newPagination;
          });

          saveRepositoriesToCache({
            repositories: processedItems,
            stats: {
              all: response.data.all,
              posted: response.data.posted,
              unposted: response.data.unposted,
            },
            pagination: {
              currentPage: fetchAll ? 1 : response.data.page,
              pageSize: fetchAll ? 0 : response.data.page_size,
              totalPages: response.data.total_pages,
              totalItems: response.data.total_items
            },
            timestamp: Date.now()
          });
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      if (!isBackgroundFetch) {
        throw error;
      }
    } finally {
      if (!isBackgroundFetch) {
        setLoading(false);
      }
    }
  };

  const fetchPreviews = useCallback(async (forceFetch: boolean = false) => {
    try {
      await fetchPreviewsFromAPI(!previewsLoading || forceFetch);
    } catch {
      setErrorWithScroll('Failed to connect to Content Alchemist API', 'content-alchemist-error');
      setPreviewsLoading(false);
    }

    try {
      await fetchCronJobsFromAPI(!cronJobsLoading);
    } catch {
      setErrorWithScroll('Failed to connect to Content Maestro API', 'content-maestro-error');
      setCronJobsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setErrorWithScroll, previewsLoading, cronJobsLoading]);

  const fetchPreviewsFromAPI = async (isBackgroundFetch: boolean = false) => {
    try {
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const [latestResponse, nextResponse] = await Promise.all([
        getLatestPostedRepository(),
        getNextRepository(),
      ]);

      const latestPostData = latestResponse.data.items[0];
      const nextPostData = nextResponse.data.items[0];

      const newData = {
        latestPost: latestPostData,
        nextPost: nextPostData
      };

      const cachedData = getPreviewsFromCache();

      if (isBackgroundFetch && cachedData) {
        const hasChanges = comparePreviews(newData, cachedData);

        if (hasChanges) {
          setTimeout(() => {
            setNewDataAvailable(prev => ({ ...prev, previews: true }));
          }, 100);

          if (!isCacheBust) {
            savePreviewsToCache({
              latestPost: latestPostData,
              nextPost: nextPostData,
              timestamp: Date.now()
            });
          }
        }
      } else if (!isBackgroundFetch || isCacheBust) {
        setLatestPost(latestPostData);
        setNextPost(nextPostData);

        savePreviewsToCache({
          latestPost: latestPostData,
          nextPost: nextPostData,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      if (!isBackgroundFetch || isCacheBust) {
        throw error;
      }
    } finally {
      if (!isBackgroundFetch || isCacheBust) {
        setPreviewsLoading(false);
      }
    }
  };

  const fetchCronJobsFromAPI = async (isBackgroundFetch: boolean = false) => {
    try {
      const cronJobsResponse = await getCronJobs();

      const cachedData = getCronJobsFromCache();

      if (isBackgroundFetch && cachedData) {
        const hasChanges = compareCronJobs(cronJobsResponse, cachedData.cronJobs);

        if (hasChanges) {
          setTimeout(() => {
            setNewDataAvailable(prev => ({ ...prev, cronJobs: true }));
          }, 100);

          if (!isCacheBust) {
            saveCronJobsToCache({
              cronJobs: cronJobsResponse,
              timestamp: Date.now()
            });
          }
        }
      } else if (!isBackgroundFetch || isCacheBust) {
        setCronJobs(cronJobsResponse);

        saveCronJobsToCache({
          cronJobs: cronJobsResponse,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      if (!isBackgroundFetch || isCacheBust) {
        throw error;
      }
    } finally {
      if (!isBackgroundFetch || isCacheBust) {
        setCronJobsLoading(false);
      }
    }
  };

  useEffect(() => {
    window.clearAllCaches = () => {
      clearAllCaches();
      return 'All caches cleared successfully';
    };

    return () => {
      delete window.clearAllCaches;
    };
  }, []);


  useEffect(() => {
    const checkCacheValidity = () => {

      const repoCache = getRepositoriesFromCache();
      const previewsCache = getPreviewsFromCache();
      const cronJobsCache = getCronJobsFromCache();


      if (!repoCache || !previewsCache || !cronJobsCache) {
        console.log('Cache expired, refreshing data...');


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
          true
        );
        fetchPreviews(true);
      }
    };


    const intervalId = setInterval(checkCacheValidity, 300000);


    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkCacheValidity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);


    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchRepositories, fetchPreviews]);

  useEffect(() => {
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
  }, [fetchRepositories, fetchPreviews, isCacheBust]);

  const handleManualGenerate = async (url: string): Promise<ManualGenerateResponse> => {
    try {
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const response = await manualGenerate(url);
      if (response.status === 'ok') {
        const added = response.added || [];

        if (added.length > 0) {
          const scrollPosition = window.scrollY;
          await fetchRepositories();
          window.scrollTo(0, scrollPosition);
        }
      }
      return response;
    } catch {
      setErrorWithScroll('Failed to connect to Content Alchemist API', 'content-alchemist-error');
      return { status: 'error' };
    }
  };

  const handleAutoGenerate = async (maxRepos: number, since: string, spokenLanguageCode: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const response = await autoGenerate(maxRepos, since, spokenLanguageCode);
      if (response.status === 'ok') {
        fetchRepositories();
      }
      return response;
    } catch {
      setErrorWithScroll('Failed to connect to Content Alchemist API', 'content-alchemist-error');
      return { status: 'error', added: [], dont_added: [] };
    }
  };

  const handleManualRefresh = async (): Promise<boolean> => {
    try {
      const savedStatusFilter = localStorage.getItem('dashboardStatusFilter') as 'all' | 'posted' | 'unposted' | null;
      const savedSortBy = localStorage.getItem('dashboardSortBy') as 'id' | 'date_added' | 'date_posted' | null;
      const savedSortOrder = localStorage.getItem('dashboardSortOrder') as 'ASC' | 'DESC' | null;
      const savedItemsPerPage = parseInt(localStorage.getItem('dashboardItemsPerPage') || '10', 10);
      const posted = savedStatusFilter === 'all' ? undefined : savedStatusFilter === 'posted';

      setLoading(true);

      toast.loading('Refreshing data', {
        id: 'manual-refresh-notification',
        duration: 3000
      });

      await Promise.all([
        fetchRepositories(
          posted,
          false,
          savedItemsPerPage === 0,
          savedItemsPerPage,
          savedSortBy || 'date_added',
          savedSortOrder || 'DESC',
          1,
          true
        ),
        fetchPreviews(true)
      ]);

      setLoading(false);

      toast.dismiss('manual-refresh-notification');
      toast.success('New data received from server', {
        id: 'new-data-notification',
        duration: 5000
      });

      return true;
    } catch {
      setLoading(false);
      setErrorWithScroll('Failed to refresh data', 'refresh-error');
      return false;
    }
  };

  const applyNewData = useCallback(() => {
    if (newDataAvailable.repositories || newDataAvailable.previews || newDataAvailable.cronJobs) {

      if (newDataAvailable.repositories) {
        const repoCache = getRepositoriesFromCache();
        if (repoCache) {
          setRepositories(repoCache.repositories);
          setStats(repoCache.stats);
          setPagination(repoCache.pagination);
        }
      }

      if (newDataAvailable.previews) {
        const previewsCache = getPreviewsFromCache();
        if (previewsCache) {
          setLatestPost(previewsCache.latestPost);
          setNextPost(previewsCache.nextPost);
        }
      }

      if (newDataAvailable.cronJobs) {
        const cronJobsCache = getCronJobsFromCache();
        if (cronJobsCache) {
          setCronJobs(cronJobsCache.cronJobs);
        }
      }

      setNewDataAvailable({
        repositories: false,
        previews: false,
        cronJobs: false
      });
    }
  }, [newDataAvailable, setRepositories, setStats, setPagination, setLatestPost, setNextPost, setCronJobs, setNewDataAvailable]);

  useEffect(() => {
    if (newDataAvailable.repositories || newDataAvailable.previews || newDataAvailable.cronJobs) {
      const message = 'New data received from server';

      applyNewData();

      // Only show toast if not already showing one from manual refresh
      if (!document.querySelector('[data-id="new-data-notification"]')) {
        toast.success(message, {
          id: 'new-data-notification',
          duration: 5000
        });
      }
    }
  }, [newDataAvailable, newDataDetails, applyNewData]);

  const handlePullToRefresh = async () => {
    console.log('[PullToRefresh] Refresh triggered');
    try {
      await handleManualRefresh();
    } catch (error) {
      console.error('Pull to refresh error:', error);
      toast.error('Failed to refresh data', { id: 'manual-refresh-notification' });
    }
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/dashboard/*"
          element={
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
              <Toaster
                position={toastPosition}
                toastOptions={{
                  success: {
                    icon: (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ),
                    duration: 5000,
                  },
                  error: {
                    icon: (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ),
                    duration: 5000,
                  },
                  loading: {
                    icon: (
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500">
                        <RefreshCw className="h-3.5 w-3.5 text-white animate-spin" />
                      </div>
                    ),
                    duration: 3000,
                  },
                }}
              >
                {(t) => (
                  <div 
                    onClick={() => {
                      toast.dismiss(t.id);
                      if (t.style) {
                        t.style.animation = 'custom-exit 0.3s ease forwards';
                      }
                    }}
                    onTouchStart={() => {
                      toast.dismiss(t.id);
                      if (t.style) {
                        t.style.animation = 'custom-exit 0.3s ease forwards';
                      }
                    }}
                    style={{ cursor: 'pointer', touchAction: 'manipulation' }}
                  >
                    <ToastBar
                      toast={t}
                      style={{
                        background: 'var(--toast-bg)',
                        color: 'var(--toast-color)',
                        boxShadow: 'var(--toast-shadow)',
                        animation: t.visible
                          ? 'custom-enter 0.3s ease'
                          : 'custom-exit 0.3s ease forwards',
                      }}
                    />
                  </div>
                )}
              </Toaster>
              {isSettingsOpen ? (
                <div className="w-full h-full">
                  <div className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                      <header className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200/20 dark:border-gray-700/20 shadow-sm">
                        <div className="flex items-center justify-between py-4 px-4">
                          <div className="flex items-center">
                            <Link to="/dashboard/" onClick={() => window.location.reload()} className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-3 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                              <LayoutDashboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              Dashboard
                            </Link>
                          </div>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={handleManualRefresh}
                              className={`p-2 rounded-md ${loading ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer'} text-gray-700 dark:text-gray-200 transition-colors`}
                              title="Refresh data"
                              disabled={loading}
                            >
                              <RotateCw className="h-5 w-5" />
                            </button>
                            <SettingsButton isOpen={isSettingsOpen} onOpen={onSettingsOpen} onClose={onSettingsClose} />
                            <ThemeToggle />
                          </div>
                        </div>
                      </header>
                    </div>

                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
                        />
                        <RepositoryPreview
                          title="Latest post"
                          repository={latestPost}
                          loading={previewsLoading}
                        />
                      </div>

                      <GenerateForm
                        onManualGenerate={handleManualGenerate}
                        onAutoGenerate={handleAutoGenerate}
                      />

                      <CronJobs
                        jobs={cronJobs}
                        loading={cronJobsLoading}
                        onUpdate={fetchPreviews}
                      />

                      <RepositoryList
                        repositories={repositories}
                        fetchRepositories={fetchRepositories}
                        currentPage={pagination.currentPage}
                        pageSize={pagination.pageSize}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        loading={loading}
                      />
                    </main>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                      <footer className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200/20 dark:border-gray-700/20 shadow-sm p-4 text-center text-gray-600 dark:text-gray-400">
                        Developed by <a href="https://github.com/Sigmanor" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">sigmanor</a> with ❤️ and a bit of 🤖 Fully <a href="https://github.com/think-root/content-sentinel" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">open source</a> License: <a href="https://github.com/think-root/content-sentinel/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">MIT</a>
                      </footer>
                    </div>
                  </div>
                </div>
              ) : (
                <PullToRefresh
                  onRefresh={handlePullToRefresh}
                  isPullable={!loading && !previewsLoading}
                  pullingContent={
                    <div className="text-center py-4 px-6 w-full max-w-xs mx-auto">
                      <div className="flex items-center justify-center gap-3">
                        <RotateCw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        <span className="text-gray-800 dark:text-gray-100 font-medium text-base">Pull down to refresh</span>
                      </div>
                    </div>
                  }
                  refreshingContent={
                    <div className="text-center py-4 px-6 w-full max-w-xs mx-auto">
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
                        <span className="text-gray-800 dark:text-gray-100 font-medium text-base">Refreshing...</span>
                      </div>
                    </div>
                  }
                  pullDownThreshold={70}
                  maxPullDownDistance={150}
                  resistance={2}
                  backgroundColor="transparent"
                  className="w-full h-full"
                >
                  <div className="py-6">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
                      <header className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200/20 dark:border-gray-700/20 shadow-sm">
                        <div className="flex items-center justify-between py-4 px-4">
                          <div className="flex items-center">
                            <Link to="/dashboard/" onClick={() => window.location.reload()} className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-3 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                              <LayoutDashboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              Dashboard
                            </Link>
                          </div>
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={handleManualRefresh}
                              className={`p-2 rounded-md ${loading ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer'} text-gray-700 dark:text-gray-200 transition-colors`}
                              title="Refresh data"
                              disabled={loading}
                            >
                              <RotateCw className="h-5 w-5" />
                            </button>
                            <SettingsButton isOpen={isSettingsOpen} onOpen={onSettingsOpen} onClose={onSettingsClose} />
                            <ThemeToggle />
                          </div>
                        </div>
                      </header>
                    </div>

                    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
                        />
                        <RepositoryPreview
                          title="Latest post"
                          repository={latestPost}
                          loading={previewsLoading}
                        />
                      </div>

                      <GenerateForm
                        onManualGenerate={handleManualGenerate}
                        onAutoGenerate={handleAutoGenerate}
                      />

                      <CronJobs
                        jobs={cronJobs}
                        loading={cronJobsLoading}
                        onUpdate={fetchPreviews}
                      />

                      <RepositoryList
                        repositories={repositories}
                        fetchRepositories={fetchRepositories}
                        currentPage={pagination.currentPage}
                        pageSize={pagination.pageSize}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        loading={loading}
                      />
                    </main>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                      <footer className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200/20 dark:border-gray-700/20 shadow-sm p-4 text-center text-gray-600 dark:text-gray-400">
                        Developed by <a href="https://github.com/Sigmanor" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">sigmanor</a> with ❤️ and a bit of 🤖 Fully <a href="https://github.com/think-root/content-sentinel" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">open source</a> License: <a href="https://github.com/think-root/content-sentinel/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">MIT</a>
                      </footer>
                    </div>
                  </div>
                </PullToRefresh>
              )}
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
