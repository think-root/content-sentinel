import { useState } from 'react';
import { getLatestPostedRepository } from '../api/alchemist';
import { retryMessagePost, type CronJobHistory } from '../api/maestro';
import { toast } from '../components/ui/common/toast-config';
import { getHistoryEntryKey, type RetryPlan } from '../utils/message-retry';

export interface RetryConfirm {
  key: string;
  failed: string[];
  url: string;
  /** True when the url was resolved for the run rather than recorded by it. */
  resolved: boolean;
}

/**
 * Re-sending a message run to the integrations it missed: resolving the
 * repository when the run did not record it, asking for confirmation, and
 * remembering which rows were already re-sent.
 */
export function useHistoryRetry(onRetryComplete?: () => void | Promise<void>) {
  const [retryingKey, setRetryingKey] = useState<string | null>(null);
  const [retriedKeys, setRetriedKeys] = useState<string[]>([]);
  const [retryConfirm, setRetryConfirm] = useState<RetryConfirm | null>(null);

  const openRetryConfirm = async (entry: CronJobHistory, plan: RetryPlan) => {
    const key = getHistoryEntryKey(entry);

    if (plan.url) {
      setRetryConfirm({ key, failed: plan.failed, url: plan.url, resolved: false });
      return;
    }

    // Runs recorded before Content Maestro tracked the item carry no url, so it
    // has to be resolved here and pinned into the request: leaving that to the
    // backend would publish whatever is latest at confirm time, which a cron run
    // in between would have changed.
    setRetryingKey(key);
    try {
      const response = await getLatestPostedRepository();
      const resolvedUrl = response.data?.items?.[0]?.url;
      if (!resolvedUrl) {
        toast.error('Could not determine which repository to publish', { id: `retry-${key}` });
        return;
      }
      setRetryConfirm({ key, failed: plan.failed, url: resolvedUrl, resolved: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to Content Alchemist API';
      toast.error(message, { id: `retry-${key}` });
    } finally {
      setRetryingKey(null);
    }
  };

  const handleRetry = async (key: string, failed: string[], url: string) => {
    const toastId = `retry-${key}`;
    setRetryingKey(key);
    toast.loading(`Re-sending to ${failed.join(', ')}...`, { id: toastId });

    let published = false;
    try {
      const result = await retryMessagePost(failed, url);
      const succeeded = result.succeeded ?? [];
      const failures = result.failed ?? [];
      published = succeeded.length > 0;

      if (failures.length === 0) {
        toast.success(`Sent to ${succeeded.join(', ')}`, { id: toastId });
      } else {
        const reasons = (result.outcomes ?? [])
          .filter(outcome => !outcome.success)
          .map(outcome => `${outcome.api_name}: ${outcome.error ?? 'unknown error'}`)
          .join('; ');
        toast.error(reasons || `Failed to send to ${failures.join(', ')}`, { id: toastId });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to Content Maestro API';
      toast.error(message, { id: toastId });
    } finally {
      setRetryingKey(null);
    }

    if (published) {
      // Rows are immutable, so the original run keeps looking retryable. Remember
      // the ones already handled to keep a second click from publishing twice.
      setRetriedKeys(previous => [...previous, key]);
    }

    // Refreshing is a separate concern: a failure here must not overwrite the
    // result of the publish that just happened.
    if (onRetryComplete) {
      try {
        await onRetryComplete();
      } catch {
        // useCronJobHistory already surfaces its own fetch errors.
      }
    }
  };

  const confirmRetry = () => {
    if (retryConfirm) {
      handleRetry(retryConfirm.key, retryConfirm.failed, retryConfirm.url);
    }
    setRetryConfirm(null);
  };

  return {
    retryingKey,
    retriedKeys,
    retryConfirm,
    openRetryConfirm,
    confirmRetry,
    cancelRetry: () => setRetryConfirm(null),
  };
}
