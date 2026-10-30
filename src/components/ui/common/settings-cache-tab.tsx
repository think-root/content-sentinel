import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { toast } from './toast-config';
import { Button } from '../base/button';

const toastOptions = {
  id: 'unique-toast-settings'
};

export const SettingsCacheTab = () => {
  const [clearingCache, setClearingCache] = useState(false);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      let message = 'Cache cleared successfully';

      if (window.clearAllCaches) {
        message = window.clearAllCaches();
        console.log('Cache clearing completed:', message);
      }

      toast.success(message, toastOptions);

      setTimeout(() => {
        const currentUrl = window.location.href;
        const separator = currentUrl.includes('?') ? '&' : '?';
        const timestamp = Date.now();
        window.location.href = `${currentUrl}${separator}cache_bust=${timestamp}`;
      }, 1000);
    } catch (error) {
      console.error('Cache clearing failed:', error);
      toast.error('Failed to clear cache', toastOptions);
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="bg-muted p-4 rounded-lg">
      <h3 className="text-sm font-medium mb-2">API Cache Management</h3>
      <p className="text-xs text-muted-foreground mb-4">
        The application caches API responses to improve performance and reduce loading times. Clear the cache to fetch fresh data. You can also clear the cache if you encounter errors when loading data.
      </p>
      <Button
        onClick={handleClearCache}
        disabled={clearingCache}
        className="w-full sm:w-auto"
        size="sm"
        variant="destructive"
      >
        {clearingCache ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Clearing...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear API Cache
          </>
        )}
      </Button>
    </div>
  );
};
