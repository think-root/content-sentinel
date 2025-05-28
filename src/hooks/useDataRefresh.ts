import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

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
  setLoading: (loading: boolean) => void;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const useDataRefresh = ({
  fetchRepositories,
  fetchPreviews,
  fetchCronJobs,
  fetchCronJobHistory,
  setLoading,
  setErrorWithScroll,
}: UseDataRefreshProps) => {
  const handleManualRefresh = useCallback(
    async (showNotification: boolean = true): Promise<boolean> => {
      setLoading(true);
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

        const fetchPromises = [
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
        ];

        if (fetchCronJobs) {
          fetchPromises.push(fetchCronJobs(true));
        }

        if (fetchCronJobHistory) {
          fetchPromises.push(fetchCronJobHistory(true));
        }

        await Promise.all(fetchPromises);

        if (showNotification) {
          toast.success("New data received from server", {
            id: "new-data-notification",
            duration: 5000,
          });
        }

        return true;
      } catch (error) {
        const err = error as Error;

        if (err.message.includes("Rate limit exceeded")) {
          toast.error("Rate limit exceeded. Please try again later.", {
            id: "rate-limit-error",
            duration: 5000,
          });
        } else {
          setErrorWithScroll(
            "Failed to refresh data: " + (err.message || "Unknown error"),
            "refresh-error"
          );
        }

        return false;
      } finally {
        setLoading(false);
      }
    },
    [
      fetchRepositories,
      fetchPreviews,
      fetchCronJobs,
      fetchCronJobHistory,
      setErrorWithScroll,
      setLoading,
    ]
  );

  const handlePullToRefresh = useCallback(async () => {
    console.log("[PullToRefresh] Refresh triggered");
    try {
      await handleManualRefresh(false);
    } catch (error) {
      console.error("Pull to refresh error:", error);
      const err = error as Error;

      if (err.message.includes("Rate limit exceeded")) {
        toast.error("Rate limit exceeded. Please try again later.", {
          id: "rate-limit-error",
          duration: 5000,
        });
      } else {
        toast.error("Failed to refresh data: " + (err.message || "Unknown error"), {
          id: "manual-refresh-notification",
        });
      }
    }
  }, [handleManualRefresh]);

  return {
    handleManualRefresh,
    handlePullToRefresh,
  };
};
