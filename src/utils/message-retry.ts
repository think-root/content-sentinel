import type { CronJobHistory } from '@/api/index';

export interface RetryTarget {
  /** Integrations the run did not reach. */
  failed: string[];
  /**
   * Repository to re-send. Undefined for runs recorded before the details field
   * existed — Content Maestro then falls back to the latest published item.
   */
  url?: string;
}

/**
 * Matches the output of a partial message run, e.g.
 * "Message sent to: bluesky. Failed: threads. Errors: ...".
 * Only runs recorded before the details field existed need this; newer runs
 * carry the integration names as structured data.
 */
const LEGACY_FAILED_PATTERN = /Failed:\s*([^.]+)\./;

const parseLegacyFailedApis = (output?: string): string[] => {
  if (!output) {
    return [];
  }

  const match = output.match(LEGACY_FAILED_PATTERN);
  if (!match) {
    return [];
  }

  return match[1]
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
};

/**
 * Returns what a manual retry of this run would publish, or null when the run
 * cannot be retried: a message run marks its repository as posted as soon as one
 * integration succeeds, so only runs with known failed integrations are
 * recoverable.
 */
export const getRetryTarget = (entry: CronJobHistory): RetryTarget | null => {
  if (entry.name !== 'message' || entry.status === 1) {
    return null;
  }

  const failedFromDetails = entry.details?.failed ?? [];
  if (failedFromDetails.length > 0) {
    return { failed: failedFromDetails, url: entry.details?.url || undefined };
  }

  const failedFromOutput = parseLegacyFailedApis(entry.output);
  if (failedFromOutput.length > 0) {
    return { failed: failedFromOutput };
  }

  return null;
};

/** Stable identity for a history row, which has no id of its own. */
export const getHistoryEntryKey = (entry: CronJobHistory): string =>
  `${entry.name}-${entry.timestamp}`;
