import type { CronJobHistory } from '@/api/maestro';

export interface RetryTarget {
  /** Integrations the run did not reach. */
  failed: string[];
  /** Repository to re-send. Always known: a run that published nothing is not retryable. */
  url: string;
}

/**
 * Matches the output of a message run that reached some integrations but not
 * others. Content Maestro has used three wordings over time:
 *
 *   Message sent to: bluesky. Failed: threads
 *   Message sent to: bluesky. Failed: threads. Errors: …
 *   Message sent to: bluesky. Failed: threads. Repository: <url>. Errors: …
 *
 * so the list is terminated by ". " followed by a known section, or by the end of
 * the string, rather than by the first dot - integration names may contain one.
 * Only runs recorded before Content Maestro tracked structured details need this.
 */
const LEGACY_FAILED_PATTERN = /(?:^|\.\s)Failed:\s*(.+?)(?:\.\s(?:Errors|Repository):|\.?\s*$)/;
const LEGACY_REPOSITORY_PATTERN = /\.\s*Repository:\s*(\S+?)\.?(?:\s|$)/;

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

const parseLegacyRepositoryUrl = (output?: string): string | undefined =>
  output?.match(LEGACY_REPOSITORY_PATTERN)?.[1];

/**
 * Returns what a manual retry of this run would publish, or null when the run
 * cannot be retried.
 *
 * A retry needs both halves: the integrations that missed the item *and* the item
 * itself. A run that never resolved a repository - an empty queue, or Content
 * Alchemist rejecting every request - reports every integration as failed while
 * recording no url, and retrying it would re-publish an unrelated repository to
 * every connector. Those runs are deliberately not retryable.
 */
export const getRetryTarget = (entry: CronJobHistory): RetryTarget | null => {
  if (entry.name !== 'message' || entry.status === 1) {
    return null;
  }

  const failedFromDetails = entry.details?.failed ?? [];
  if (failedFromDetails.length > 0) {
    const url = entry.details?.url;
    return url ? { failed: failedFromDetails, url } : null;
  }

  // Details are absent only for runs recorded before the field existed.
  if (entry.details) {
    return null;
  }

  const failedFromOutput = parseLegacyFailedApis(entry.output);
  const legacyUrl = parseLegacyRepositoryUrl(entry.output);
  if (failedFromOutput.length > 0 && legacyUrl) {
    return { failed: failedFromOutput, url: legacyUrl };
  }

  return null;
};

/**
 * Returns the integrations a legacy run failed to reach, for runs whose output
 * names no repository. The caller has to resolve the item itself before such a
 * run can be retried.
 */
export const getLegacyFailedApis = (entry: CronJobHistory): string[] => {
  if (entry.name !== 'message' || entry.status === 1 || entry.details) {
    return [];
  }
  if (parseLegacyRepositoryUrl(entry.output)) {
    return [];
  }

  return parseLegacyFailedApis(entry.output);
};

/** Stable identity for a history row, which has no id of its own. */
export const getHistoryEntryKey = (entry: CronJobHistory): string =>
  `${entry.name}-${entry.timestamp}`;

/** A plan is retryable once the integrations and the repository are both known. */
export interface RetryPlan {
  failed: string[];
  /** Absent for legacy runs that never recorded the item; resolved before sending. */
  url?: string;
}

/** What the retry button of a history row would send, or null to hide it. */
export const getRetryPlan = (entry: CronJobHistory): RetryPlan | null => {
  const target = getRetryTarget(entry);
  if (target) {
    return target;
  }

  const legacyFailed = getLegacyFailedApis(entry);
  return legacyFailed.length > 0 ? { failed: legacyFailed } : null;
};

export const buildRetryConfirmMessage = (confirm: { failed: string[]; url: string; resolved: boolean }): string => {
  const integrations = confirm.failed.join(', ');

  if (confirm.resolved) {
    return `This run did not record which repository it published, so the latest published one will be used: ${confirm.url}. Send it to ${integrations}?`;
  }

  return `Send ${confirm.url} to ${integrations}?`;
};
