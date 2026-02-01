import { useCallback, useRef, useState } from 'react';
import { toast } from '../components/ui/common/toast-config';
import { isRateLimited } from '../lib/requestQueue';

interface UseDataRefreshProps {
  fetchRepositories: (
    statusFilter?: boolean,
    append?: boolean,
    fetchAll?: boolean,
    itemsPerPage?: number,
    sortBy?: "id" | "date_added" | "date_posted",
    sortOrder?: "ASC" | "DESC",
    page?: number,
    forceFetch?: boolean
  ) => Promise<void>;
  fetchPreviews: (forceFetch?: boolean) => Promise<void>;
  fetchCronJobs?: (forceFetch?: boolean) => Promise<void>;
  fetchCronJobHistory?: (forceFetch?: boolean) => Promise<void>;
  refreshOverviewHistory?: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
  applyRepoNewData?: () => void;
  applyPreviewsNewData?: () => void;
  applyCronJobsNewData?: () => void;
  applyCronJobHistoryNewData?: () => void;
  repoNewDataAvailable?: boolean;
  previewsNewDataAvailable?: boolean;
  cronJobsNewDataAvailable?: boolean;
  cronJobHistoryNewDataAvailable?: boolean;
}

export const useDataRefresh = ({
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
  cronJobHistoryNewDataAvailable,
}: UseDataRefreshProps) => {
  const lastRefreshRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const handleManualRefresh = useCallback(
    async (showNotification: boolean = true): Promise<boolean> => {
      // Debounce rapid refreshes (prevent calls within 1 second of each other)
      const now = Date.now();
      if (now - lastRefreshRef.current < 1000) {
        return false;
      }
      lastRefreshRef.current = now;

      // Check if we're currently rate limited
      if (isRateLimited()) {
        if (showNotification) {
          toast.error("Rate limit exceeded. Please try again later.", {
            id: "rate-limit-error",
            duration: 5000,
          });
        }
        return false;
      }

      // Prevent concurrent refreshes
      if (isRefreshingRef.current) {
        return false;
      }

      isRefreshingRef.current = true;
      setIsRefreshing(true);

      try {
        const savedStatusFilter = localStorage.getItem("dashboardStatusFilter") as
          | "all"
          | "posted"
          | "unposted"
          | null;
        const savedSortBy = localStorage.getItem("dashboardSortBy") as
          | "id"
          | "date_added"
          | "date_posted"
          | null;
        const savedSortOrder = localStorage.getItem("dashboardSortOrder") as "ASC" | "DESC" | null;
        const savedItemsPerPage = parseInt(
          localStorage.getItem("dashboardItemsPerPage") || "10",
          10
        );
        const posted = savedStatusFilter === "all" ? undefined : savedStatusFilter === "posted";

        // Execute API calls concurrently without artificial delays.
        // Each task swallows 429 (rate limit) errors locally; non-429 errors bubble up.
        const repoTask = (async () => {
          try {
            await fetchRepositories(
              posted,
              false,
              savedItemsPerPage === 0,
              savedItemsPerPage,
              savedSortBy || "date_added",
              savedSortOrder || "DESC",
              1,
              false
            );
          } catch (error: any) {
            if (!(error?.status === 429 || error?.statusCode === 429)) {
              throw error;
            }
          }
        })();

        const previewsTask = (async () => {
          try {
            await fetchPreviews(false);
          } catch (error: any) {
            if (!(error?.status === 429 || error?.statusCode === 429)) {
              throw error;
            }
          }
        })();

        const cronJobsTask = fetchCronJobs ? (async () => {
          try {
            await fetchCronJobs(false);
          } catch (error: any) {
            if (!(error?.status === 429 || error?.statusCode === 429)) {
              throw error;
            }
          }
        })() : null;

        const cronHistoryTask = fetchCronJobHistory ? (async () => {
          try {
            await fetchCronJobHistory(false);
          } catch (error: any) {
            if (!(error?.status === 429 || error?.statusCode === 429)) {
              throw error;
            }
          }
        })() : null;

        const overviewHistoryTask = refreshOverviewHistory ? (async () => {
          try {
            await refreshOverviewHistory();
          } catch (error: any) {
            if (!(error?.status === 429 || error?.statusCode === 429)) {
              throw error;
            }
          }
        })() : null;

        const tasks = [repoTask, previewsTask, cronJobsTask, cronHistoryTask, overviewHistoryTask].filter(Boolean) as Promise<void>[];

        const results = await Promise.allSettled(tasks);

        // If any non-429 error occurred, surface the first one to the outer catch handler.
        const non429Errors = results
          .filter(r => r.status === 'rejected')
          .map(r => (r as PromiseRejectedResult).reason)
          .filter((err: any) =>
            !(err?.status === 429 ||
              err?.statusCode === 429 ||
              (typeof err?.message === 'string' && err.message.includes('Rate limit exceeded')))
          );

        if (non429Errors.length > 0) {
          throw non429Errors[0];
        }

        // Check if there's new data and apply it if needed
        // Check repositories
        if (repoNewDataAvailable && applyRepoNewData) {
          applyRepoNewData();
        }

        // Check previews
        if (previewsNewDataAvailable && applyPreviewsNewData) {
          applyPreviewsNewData();
        }

        // Check cron jobs
        if (cronJobsNewDataAvailable && applyCronJobsNewData) {
          applyCronJobsNewData();
        }

        // Check cron job history
        if (cronJobHistoryNewDataAvailable && applyCronJobHistoryNewData) {
          applyCronJobHistoryNewData();
        }

        return true;
      } catch (error) {
        const err = error as Error;

        // Only show error messages for non-rate limit errors
        if (!(err.message.includes("Rate limit exceeded") ||
              (err as any)?.status === 429 ||
              (err as any)?.statusCode === 429)) {
          setErrorWithScroll(
            "Failed to refresh data: " + (err.message || "Unknown error"),
            "refresh-error"
          );
        }

        return false;
      } finally {
        setIsRefreshing(false);
        isRefreshingRef.current = false;
      }
    },
    [
      fetchRepositories,
      fetchPreviews,
      fetchCronJobs,
      fetchCronJobHistory,
      refreshOverviewHistory,
      setErrorWithScroll,
      setLoading,
    ]
  );

  const handlePullToRefresh = useCallback(async () => {
    console.log("[PullToRefresh] Refresh triggered");
    
    // Check if already refreshing
    if (isRefreshingRef.current) {
      console.log("[PullToRefresh] Refresh already in progress, skipping");
      return;
    }
    
    // Use the same sequential approach as manual refresh
    await handleManualRefresh(false);
  }, [handleManualRefresh]);

  return {
    handleManualRefresh,
    handlePullToRefresh,
    isRefreshing,
  };
};
