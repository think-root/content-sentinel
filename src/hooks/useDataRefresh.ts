import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface UseDataRefreshProps {
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
  fetchCronJobs?: (forceFetch?: boolean) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setErrorWithScroll: (errorMessage: string, toastId?: string) => void;
}

export const useDataRefresh = ({
  fetchRepositories,
  fetchPreviews,
  fetchCronJobs,
  setLoading,
  setErrorWithScroll
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

        await Promise.all(fetchPromises);

        if (showNotification) {
          toast.success("New data received from server", {
            id: "new-data-notification",
            duration: 5000,
          });
        }

        return true;
      } catch {
        setErrorWithScroll("Failed to refresh data", "refresh-error");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchRepositories, fetchPreviews, fetchCronJobs, setErrorWithScroll, setLoading]
  );

  const handlePullToRefresh = useCallback(async () => {
    console.log("[PullToRefresh] Refresh triggered");
    try {
      await handleManualRefresh(false);
    } catch (error) {
      console.error("Pull to refresh error:", error);
      toast.error("Failed to refresh data", { id: "manual-refresh-notification" });
    }
  }, [handleManualRefresh]);

  return {
    handleManualRefresh,
    handlePullToRefresh
  };
};
