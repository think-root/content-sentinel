import { useEffect, useCallback, useRef } from "react";
import {
  clearAllCaches,
  getRepositoriesFromCache,
  getPreviewsFromCache,
  getCronJobsFromCache,
  getCronJobHistoryFromCache,
  isExpired,
} from "../utils/cache-utils";
import { isApiConfigured } from "../utils/api-settings";
import { toast } from "../components/ui/common/toast-config";
import { isRateLimited } from "../lib/requestQueue";

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

    // Check if currently rate limited
    if (isRateLimited()) {
      console.log("Currently rate limited, skipping cache validation");
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

    // Check each cache individually and only fetch what's expired
    const fetchPromises: Promise<void>[] = [];
    
    // Fetch repositories if cache is expired or stale
    if (isExpired('cache_repositories') || (repoCache && repoCache.isStale)) {
      console.log("Repositories cache expired or stale, refreshing...");
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
      
      fetchPromises.push(
        fetchRepositories(
          posted,
          false,
          savedItemsPerPage === 0,
          savedItemsPerPage,
          savedSortBy || "date_added",
          savedSortOrder || "DESC",
          1,
          true
        )
      );
    }
    
    // Fetch previews if cache is expired or stale
    if (isExpired('cache_previews') || (previewsCache && previewsCache.isStale)) {
      console.log("Previews cache expired or stale, refreshing...");
      fetchPromises.push(fetchPreviews(true));
    }
    
    // Fetch cron jobs if cache is expired or stale
    if ((isExpired('cache_cron_jobs') || (cronJobsCache && cronJobsCache.isStale)) && fetchCronJobs) {
      console.log("Cron jobs cache expired or stale, refreshing...");
      fetchPromises.push(fetchCronJobs(true));
    }
    
    // Fetch cron job history if cache is expired or stale
    if ((isExpired('cache_cron_job_history') || (cronJobHistoryCache && cronJobHistoryCache.isStale)) && fetchCronJobHistory) {
      console.log("Cron job history cache expired or stale, refreshing...");
      fetchPromises.push(fetchCronJobHistory(true));
    }
    
    // If nothing needs to be fetched, return early
    if (fetchPromises.length === 0) {
      return;
    }
    
    try {
      // Execute fetches sequentially with delays to prevent burst requests
      for (let i = 0; i < fetchPromises.length; i++) {
        // Add delay between requests (1-2 seconds)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        }
        
        // Check rate limit before each request
        if (isRateLimited()) {
          console.log("Hit rate limit during cache refresh, stopping further requests");
          toast.error("Rate limit approaching. Pausing cache refresh.", {
            id: "rate-limit-warning",
            duration: 3000,
          });
          break;
        }
        
        await fetchPromises[i];
      }
      
      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      const err = error as Error;
      
      // If we hit a rate limit, implement exponential backoff
      if ((err.message.includes("Rate limit exceeded") || (err as any).status === 429) && retryCountRef.current < maxRetries) {
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
      } else {
        // For other errors, just log and continue
        console.error("Error during cache validation:", err);
      }
    }
  }, [fetchRepositories, fetchPreviews, fetchCronJobs, fetchCronJobHistory]);

  useEffect(() => {
    window.clearAllCaches = () => {
      const result = clearAllCaches();
      const message = "Cache successfully cleared";
      console.log('Cache clearing result:', result);
      return message;
    };

    return () => {
      delete window.clearAllCaches;
    };
  }, []);

  useEffect(() => {
    const intervalId = setInterval(checkCacheValidity, 600000); // 10 minutes

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
