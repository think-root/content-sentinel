import { useState, useEffect, useCallback, useRef } from 'react';
import { getCronJobHistory, type CronJobHistory } from '../api/index';
import { getOverviewHistoryFromCache, saveOverviewHistoryToCache, getOverviewTimeRangePreference, saveOverviewTimeRangePreference } from '../utils/cache-utils';

export type TimeRange = '24h' | '7d' | '30d' | '90d';

interface UseOverviewHistoryProps {
  isApiReady: boolean;
}

export const useOverviewHistory = ({ isApiReady }: UseOverviewHistoryProps) => {
  // Initialize from cache if available
  const cachedResult = getOverviewHistoryFromCache();
  const cachedData = cachedResult?.data;
  const preferredRange = getOverviewTimeRangePreference() as TimeRange | null;
  
  // Determine initial time range: Preference -> Cache -> Default '7d'
  const initialTimeRange = preferredRange || (cachedData?.timeRange as TimeRange) || '7d';

  // Determine initial data: Only use cache if it matches the initial time range
  const initialHistory = (cachedData && cachedData.timeRange === initialTimeRange) ? cachedData.history : [];
  
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
  const [historyData, setHistoryData] = useState<CronJobHistory[]>(initialHistory);
  const [loading, setLoading] = useState(initialHistory.length === 0);
  const [initialized, setInitialized] = useState(initialHistory.length > 0);
  
  // Ref to track if we've done the initial validation of the cache
  const hasValidatedCache = useRef(false);
  
  // Keep track of the current request to avoid race conditions or old requests overwriting new ones
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchHistory = useCallback(async (silent = false) => {
    if (!isApiReady) return;

    // specific check to avoid "loading" flash if we already have data regarding this timerange request
    // But since date moves, we probably always want to fetch.
    
    // But since date moves, we probably always want to fetch.
    
    // Use silent mode if we have data and we are just validating/updating
    const shouldUseSilent = silent || (historyData.length > 0 && timeRange === (cachedData?.timeRange || timeRange));

    if (!shouldUseSilent) {
      setLoading(true);
    }

    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const now = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setTime(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      const response = await getCronJobHistory(
        undefined, // name
        1, // page
        500, // limit - create a larger limit for charts
        undefined, // status
        'asc', // sort asc for charts
        startDate.toISOString(), // start_date
        now.toISOString() // end_date
      );
      
      setHistoryData(response.data);
      saveOverviewHistoryToCache({
         history: response.data,
         timeRange: timeRange,
         timestamp: Date.now()
      });
      setInitialized(true);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
          return;
      }
      console.error("Failed to fetch chart data:", error);
    } finally {
        if (!shouldUseSilent) {
            setLoading(false);
        }
    }
  }, [timeRange, isApiReady, historyData.length, cachedData?.timeRange]);

  // Initial fetch when timeRange changes or API is ready
  // Save preference whenever timeRange changes
  useEffect(() => {
    saveOverviewTimeRangePreference(timeRange);
  }, [timeRange]);

  // Initial fetch when timeRange changes or API is ready
  useEffect(() => {
    // If we have cache and haven't validated it yet, do a silent fetch
    // If we changed timeRange, force a fetch (loading will be handled in fetchHistory)
    fetchHistory();
    hasValidatedCache.current = true;
  }, [fetchHistory]);

  return {
    timeRange,
    setTimeRange,
    historyData,
    loading,
    initialized,
    refresh: () => fetchHistory(true)
  };
};
