import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Clock, Loader2, Send, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../base/dialog';
import { Button } from '../base/button';
import { IntegrationIcon, getLanguageFlag } from './integration-icons';
import { getCronJobHistory, publishMessageNow, type RetryMessageResult } from '../../../api/index';
import { getRepositoryByUrl } from '../../../api';
import {
  classifyPublishFailure,
  reconcilePublish,
  type PublishReconcileOutcome,
} from '../../../utils/publish-reconcile';
import {
  buildPublishRows,
  publishedSomething,
  summarizePublishResult,
  type PublishIntegration,
  type PublishRow,
} from '../../../utils/message-publish';
import type { Repository } from '../../../types';

interface PublishRepositoryDialogProps {
  /** The repository being published; null keeps the dialog closed. */
  repository: Repository | null;
  /** True when this repository already sits at the head of the publication queue. */
  isNext: boolean;
  isApiReady: boolean;
  /** The enabled integrations a publish-now will reach. */
  integrations: PublishIntegration[];
  /** True while the integration list is still being fetched. */
  integrationsLoading?: boolean;
  onClose: () => void;
  /**
   * Reports whether a request is in flight, so the caller can stop the row
   * buttons from retargeting this dialog mid-publication.
   */
  onBusyChange?: (busy: boolean) => void;
  /** Promotes to the head of the queue - the caller's existing handler and toast. */
  onPromote: (repo: Repository) => Promise<void>;
  /** Called once the publication may have changed anything, so the caller refreshes. */
  onPublished: () => void | Promise<void>;
}

type Phase = 'idle' | 'promoting' | 'publishing' | 'reconciling' | 'done';

/**
 * A safety net rather than a cancellation: aborting the request does not stop the
 * run on the server, so the timeout has to sit well above the slowest legitimate
 * publication (image generation plus the Threads connector's own 90 s timeout).
 */
const PUBLISH_TIMEOUT_MS = 240_000;

/** How many recent `message` runs to search for this repository's run. */
const RECONCILE_HISTORY_LIMIT = 20;

/**
 * Recovers what a publication did when its own answer never arrived, from the two
 * records that outlive the request: Content Maestro's run log and the posted flag
 * in Content Alchemist. Each is read independently - one of them being
 * unreachable still leaves the other worth reporting.
 */
const collectReconciliation = async (url: string, since: number): Promise<PublishReconcileOutcome> => {
  const [repository, history] = await Promise.allSettled([
    getRepositoryByUrl(url),
    getCronJobHistory('message', 1, RECONCILE_HISTORY_LIMIT),
  ]);

  return reconcilePublish({
    url,
    since,
    posted: repository.status === 'fulfilled' ? repository.value?.posted ?? null : null,
    history: history.status === 'fulfilled' ? history.value.data : [],
    historyRead: history.status === 'fulfilled',
  });
};

const toneStyles = {
  success: 'bg-success/20 text-success',
  partial: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
} as const;

export function PublishRepositoryDialog({
  repository,
  isNext,
  isApiReady,
  integrations,
  integrationsLoading = false,
  onClose,
  onBusyChange,
  onPromote,
  onPublished,
}: PublishRepositoryDialogProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<RetryMessageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconciled, setReconciled] = useState<PublishReconcileOutcome | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // The repository the state on screen belongs to. One dialog instance serves
  // every row, so a request that outlives its own target must not write its
  // outcome into the dialog somebody has since pointed at another repository.
  const targetIdRef = useRef<number | null>(repository?.id ?? null);

  // Reopening on another row must never show the previous run's rows, and the
  // request that filled them has to be dropped rather than left to land later.
  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    targetIdRef.current = repository?.id ?? null;
    setPhase('idle');
    setResult(null);
    setError(null);
    setReconciled(null);
  }, [repository?.id]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = phase === 'promoting' || phase === 'publishing' || phase === 'reconciling';

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  const inFlight = phase === 'publishing' || phase === 'reconciling';
  // Once a run has been reconciled, the rows recovered from Cron History are the
  // only record of what reached which integration.
  const reported = result ?? reconciled?.result ?? null;
  const rows = buildPublishRows(integrations, inFlight ? null : reported);
  const summary = result ? summarizePublishResult(result) : null;

  const handlePromote = async () => {
    if (!repository || busy) return;

    setPhase('promoting');
    try {
      await onPromote(repository);
      onClose();
    } catch {
      // The caller already reported it with a toast; the dialog stays open so the
      // action can be retried or the other one picked instead.
    } finally {
      setPhase('idle');
    }
  };

  const handlePublishNow = async () => {
    if (!repository || phase !== 'idle') return;

    const targetId = repository.id;
    const controller = new AbortController();
    const timedOut = { value: false };
    const timeout = window.setTimeout(() => {
      timedOut.value = true;
      controller.abort();
    }, PUBLISH_TIMEOUT_MS);
    abortRef.current = controller;
    const startedAt = Date.now();
    setPhase('publishing');
    setError(null);
    setReconciled(null);
    // A request that produced no result leaves the choices in place: refusals (a
    // cron run holding the lock, an item already published) are worth another
    // try, and the backend refuses a duplicate on its own.
    let finalPhase: Phase = 'idle';

    try {
      const publishResult = await publishMessageNow(repository.url, { signal: controller.signal });
      if (targetIdRef.current !== targetId) return;
      finalPhase = 'done';
      setResult(publishResult);
      if (publishedSomething(publishResult)) {
        await onPublished();
      }
    } catch (err) {
      // Retargeting the dialog aborts this request on purpose; its outcome
      // belongs to a repository nobody is looking at any more.
      if (targetIdRef.current !== targetId) return;

      const failure = classifyPublishFailure(err, timedOut.value);
      setError(failure.message);
      // The run may have published before the connection broke, so the list has
      // to be refreshed either way.
      await onPublished();
      if (targetIdRef.current !== targetId) return;

      if (failure.unknown) {
        // Nothing here can be inferred from the failed request, so ask the two
        // services what actually happened instead of guessing.
        setPhase('reconciling');
        const outcome = await collectReconciliation(repository.url, startedAt);
        if (targetIdRef.current !== targetId) return;
        setReconciled(outcome);
        if (outcome.published) {
          finalPhase = 'done';
          await onPublished();
        }
      }
    } finally {
      window.clearTimeout(timeout);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      if (targetIdRef.current === targetId) {
        setPhase(finalPhase);
      }
    }
  };

  const renderRow = (row: PublishRow) => {
    const flag = getLanguageFlag(row.textLanguage);

    return (
      <li
        key={row.name}
        className={`p-2 rounded-md flex flex-col gap-1 ${
          row.state === 'success'
            ? 'bg-success/20 text-success'
            : row.state === 'failure'
              ? 'bg-destructive/10 border border-destructive/20'
              : 'bg-muted/50 text-muted-foreground'
        }`}
      >
        <div className="flex items-center gap-2">
          <IntegrationIcon name={row.name} className="w-4 h-4 shrink-0" />
          <span className="font-medium text-foreground capitalize">{row.name}</span>
          {flag && <span aria-hidden="true">{flag}</span>}
          <span className="ml-auto flex items-center gap-1 text-xs">
            {row.state === 'pending' && inFlight && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                {phase === 'reconciling' ? 'Checking...' : 'Sending...'}
              </>
            )}
            {row.state === 'success' && (
              <>
                <Check className="h-3 w-3" />
                Sent
              </>
            )}
            {row.state === 'failure' && (
              <>
                <X className="h-3 w-3 text-destructive" />
                <span className="text-destructive">Failed</span>
              </>
            )}
          </span>
        </div>
        {row.state === 'failure' && row.error && (
          <span className="text-xs dark:text-red-400 text-red-600 break-words">{row.error}</span>
        )}
      </li>
    );
  };

  return (
    <Dialog
      open={repository !== null}
      onOpenChange={open => {
        if (!open && phase !== 'publishing') onClose();
      }}
    >
      {/*
        Only a publication in flight blocks dismissal: its per-integration result
        exists nowhere else, so closing mid-run would throw it away. Promoting is
        not blocked - it has no in-dialog result to lose, and the promote request
        carries no timeout, so blocking it would make a stalled backend leave a
        dialog that cannot be closed at all.
      */}
      <DialogContent
        className="max-w-lg"
        closeDisabled={phase === 'publishing'}
        onEscapeKeyDown={event => phase === 'publishing' && event.preventDefault()}
        onPointerDownOutside={event => phase === 'publishing' && event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Publish repository</DialogTitle>
          <DialogDescription className="break-all">
            {repository?.url.replace('https://github.com/', '')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {!isApiReady && (
            <p className="bg-warning/10 text-warning p-3 rounded-md text-sm">
              Content Maestro API is not configured — check Settings.
            </p>
          )}

          {phase === 'idle' && isApiReady && (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="text-foreground font-medium">Publish next</span> moves this
                repository to the head of the queue; the scheduled run publishes it.
              </p>
              <p>
                <span className="text-foreground font-medium">Publish now</span> sends it
                immediately to every enabled integration.
              </p>
            </div>
          )}

          {summary && (
            <p className={`p-3 rounded-md text-sm ${toneStyles[summary.tone]}`}>{summary.text}</p>
          )}

          {error && (
            <p className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="break-words">{error}</span>
            </p>
          )}

          {reconciled && (
            <p className={`p-3 rounded-md text-sm ${toneStyles[reconciled.tone]}`}>{reconciled.message}</p>
          )}

          {result?.posted_error && (
            <p className="bg-warning/10 text-warning p-3 rounded-md text-sm">
              Published, but the repository could not be marked as posted — the scheduled run may
              publish it again. ({result.posted_error})
            </p>
          )}

          {rows.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-2">
                {reported || inFlight ? 'Integrations:' : 'Will publish to:'}
              </h4>
              <ul className="space-y-1 text-sm">{rows.map(renderRow)}</ul>
            </div>
          ) : !isApiReady ? null : integrationsLoading ? (
            // An empty list while the configs are still loading is not the same as
            // no integration being enabled, and saying so would be wrong.
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading integrations...
            </p>
          ) : (
            <p className="bg-warning/10 text-warning p-3 rounded-md text-sm">
              No integration is enabled, so there is nothing to publish to. Enable one on the
              Integrations tab.
            </p>
          )}
        </div>

        <DialogFooter>
          {phase === 'done' ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={phase === 'publishing'}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handlePromote}
                disabled={busy || isNext || !isApiReady}
                title={isNext ? 'Already next in the queue' : undefined}
              >
                {phase === 'promoting' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                Publish next
              </Button>
              <Button
                onClick={handlePublishNow}
                disabled={busy || !isApiReady || integrationsLoading || integrations.length === 0}
              >
                {phase === 'publishing' || phase === 'reconciling' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {phase === 'reconciling' ? 'Checking...' : 'Publishing...'}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish now
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
