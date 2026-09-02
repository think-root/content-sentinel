import type { CronJobHistory, RetryMessageResult } from '../api/index';
import { maestroErrorMessage } from './api-error';

/**
 * How much older than the request a recorded run may be and still be considered
 * this run. The browser clock and the server clock are independent, and a phone
 * that has just woken up can be minutes off, so the window has to absorb skew.
 * Matching an older run of the same repository is not a real risk: a published
 * repository leaves the queue, and publish-now refuses one that already left.
 */
const HISTORY_CLOCK_TOLERANCE_MS = 15 * 60_000;

export interface PublishFailureClassification {
  /**
   * True when the request failed without an answer, so the run may have gone
   * through regardless. Only a reply from Content Maestro can rule that out.
   */
  unknown: boolean;
  message: string;
}

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError';

/**
 * Separates "Content Maestro refused this" from "we never heard back".
 *
 * The distinction is the whole point: a lost answer used to be reported as a
 * connection failure, which reads as "nothing was published" - and the posts had
 * in fact gone out. A backgrounded PWA is enough to trigger it, because the
 * browser suspends the page and tears the connection down mid-request.
 */
export const classifyPublishFailure = (error: unknown, timedOut: boolean): PublishFailureClassification => {
  if (timedOut) {
    return {
      unknown: true,
      message: 'Content Maestro did not answer in time. The publication may still be running.',
    };
  }

  if (isAbortError(error)) {
    return {
      unknown: true,
      message: 'The request ended before Content Maestro answered. The publication may still be running.',
    };
  }

  // A rejected fetch: the service was unreachable, or the browser dropped the
  // connection - suspending a backgrounded tab does exactly that. Which of the
  // two it was cannot be told from here, and they mean opposite things.
  if (error instanceof TypeError) {
    return {
      unknown: true,
      message: 'No answer from Content Maestro - the connection dropped, which is what happens '
        + 'when the browser suspends a tab in the background. The publication may still be running.',
    };
  }

  return { unknown: false, message: maestroErrorMessage(error) };
};

export interface PublishReconcileInput {
  url: string;
  /** Epoch milliseconds at which the publish request was sent. */
  since: number;
  /** Recent `message` runs as Content Maestro reports them, newest first. */
  history: CronJobHistory[];
  /** Posted flag straight from Content Alchemist; null when it could not be read. */
  posted: boolean | null;
  /**
   * Whether the run list could be read at all. An unreadable list is not an
   * absent run, and the two must not lead to the same conclusion.
   */
  historyRead: boolean;
}

export interface PublishReconcileOutcome {
  tone: 'success' | 'partial' | 'error';
  message: string;
  /** The recorded run, shaped so the dialog can render its per-integration rows. */
  result: RetryMessageResult | null;
  /** True when something definitely went out, so the dialog must not offer a retry. */
  published: boolean;
}

/** The newest recorded run for this repository that can belong to our request. */
const findRun = (url: string, since: number, history: CronJobHistory[]): CronJobHistory | undefined =>
  history.find(entry => {
    if (entry.details?.url !== url) return false;
    const at = Date.parse(entry.timestamp);
    // An unparsable timestamp must not discard an otherwise matching run: the url
    // already narrows it down to this repository.
    return Number.isNaN(at) || at >= since - HISTORY_CLOCK_TOLERANCE_MS;
  });

const queueNote = (posted: boolean | null, everythingSent: boolean): string => {
  if (posted === null) return ' Whether it left the publication queue could not be checked.';
  if (posted) {
    return everythingSent
      ? ''
      : ' The repository left the queue, so finish the rest with "Publish again" in Cron History.';
  }
  return ' The repository is still in the queue, so the scheduled run will publish it again.';
};

/**
 * Works out what a publication whose answer was lost actually did, from the two
 * records that outlive the request: the run Content Maestro logged, and the
 * repository's posted state in Content Alchemist.
 */
export const reconcilePublish = ({
  url,
  since,
  history,
  posted,
  historyRead,
}: PublishReconcileInput): PublishReconcileOutcome => {
  const run = historyRead ? findRun(url, since, history) : undefined;

  if (run) {
    const sent = run.details?.sent ?? [];
    const failed = run.details?.failed ?? [];
    const result: RetryMessageResult = {
      url,
      status: run.status,
      message: run.output ?? '',
      succeeded: sent,
      failed,
      // Cron History keeps only the names, so there is no per-integration error
      // to recover here.
      outcomes: null,
      posted: posted ?? undefined,
    };

    if (sent.length === 0) {
      return {
        tone: 'error',
        message: 'Cron History shows the run published nothing.' + queueNote(posted, false),
        result,
        published: false,
      };
    }

    if (failed.length > 0) {
      return {
        tone: 'partial',
        message: `Cron History shows the run reached ${sent.length} of ${sent.length + failed.length}`
          + ' integrations.' + queueNote(posted, false),
        result,
        published: true,
      };
    }

    const reach = sent.length === 1 ? 'the integration' : `all ${sent.length} integrations`;

    return {
      tone: 'success',
      message: `Cron History confirms the post went out to ${reach}.` + queueNote(posted, true),
      result,
      published: true,
    };
  }

  if (posted === true) {
    return {
      tone: 'partial',
      message: 'No run is recorded yet, but the repository is now marked as published, so a '
        + 'publication did go through. Open Cron History for the details.',
      result: null,
      published: true,
    };
  }

  if (posted === false && historyRead) {
    return {
      tone: 'error',
      // The run is logged when it ends, so an unfinished publication looks exactly
      // like one that never happened. Saying "nothing was published" would be a
      // guess, and it is the guess that causes a double post.
      message: 'No run is recorded and the repository is still in the queue: either nothing was '
        + 'published, or the run has not finished yet - Cron History will show it once it does.',
      result: null,
      published: false,
    };
  }

  return {
    tone: 'error',
    message: 'What happened could not be checked. Open Cron History before trying again.',
    result: null,
    published: false,
  };
};
