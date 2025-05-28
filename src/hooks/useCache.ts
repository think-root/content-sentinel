import { useEffect, useCallback, useRef } from "react";
import {
  clearAllCaches,
  getRepositoriesFromCache,
  getPreviewsFromCache,
  getCronJobsFromCache,
  getCronJobHistoryFromCache,
} from "../utils/cache-utils";
import { isApiConfigured } from "../utils/api-settings";
import { toast } from "react-hot-toast";

interface UseCacheProps {
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
}

export const useCache = ({
  fetchRepositories,
  fetchPreviews,
  fetchCronJobs,
  fetchCronJobHistory,
}: UseCacheProps) => {
  const retryTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const checkCacheValidity = useCallback(async () => {
    if (!isApiConfigured()) {
      return;
    }

    // Clear any existing retry timeout
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    const repoCache = getRepositoriesFromCache();
    const previewsCache = getPreviewsFromCache();
    const cronJobsCache = getCronJobsFromCache();
    const cronJobHistoryCache = getCronJobHistoryFromCache();

    if (!repoCache || !previewsCache || !cronJobsCache || !cronJobHistoryCache) {
      console.log("Cache expired, refreshing data...");

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
      const savedItemsPerPage = parseInt(localStorage.getItem("dashboardItemsPerPage") || "10", 10);

      const posted = savedStatusFilter === "all" ? undefined : savedStatusFilter === "posted";

      try {
        await Promise.all([
          fetchRepositories(
            posted,
            false,
            savedItemsPerPage === 0,
            savedItemsPerPage,
            savedSortBy || "date_added",
            savedSortOrder || "DESC",
            1,
            true
          ),
          fetchPreviews(true),
          fetchCronJobs ? fetchCronJobs(true) : Promise.resolve(),
          fetchCronJobHistory ? fetchCronJobHistory(true) : Promise.resolve(),
        ]);

        // Reset retry count on success
        retryCountRef.current = 0;
      } catch (error) {
        const err = error as Error;

        // If we hit a rate limit, implement exponential backoff
        if (err.message.includes("Rate limit exceeded") && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const backoffTime = Math.min(30000, 1000 * Math.pow(2, retryCountRef.current)); // Max 30 seconds

          console.log(
            `Rate limit hit. Retrying in ${backoffTime / 1000} seconds (attempt ${
              retryCountRef.current
            }/${maxRetries})...`
          );

          if (retryCountRef.current === 1) {
            toast.error("Rate limit exceeded. Backing off and will retry automatically.", {
              id: "rate-limit-error",
              duration: 5000,
            });
          }

          // Set a timeout to retry with exponential backoff
          retryTimeoutRef.current = window.setTimeout(() => {
            checkCacheValidity();
          }, backoffTime);
        } else if (retryCountRef.current >= maxRetries) {
          // Reset retry count after max retries
          retryCountRef.current = 0;
          toast.error("Maximum retry attempts reached. Please try again later.", {
            id: "max-retries-error",
            duration: 5000,
          });
        }
      }
    }
  }, [fetchRepositories, fetchPreviews, fetchCronJobs, fetchCronJobHistory]);

  useEffect(() => {
    window.clearAllCaches = () => {
      clearAllCaches();
      return "All caches cleared successfully";
    };

    return () => {
      delete window.clearAllCaches;
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(checkCacheValidity, 300000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkCacheValidity();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Clear any pending retry timeouts
      if (retryTimeoutRef.current !== null) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [checkCacheValidity]);

  return {
    checkCacheValidity,
  };
};
