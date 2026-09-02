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
import { publishMessageNow, type RetryMessageResult } from '../../../api/index';
import { maestroErrorMessage } from '../../../utils/api-error';
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
  onClose: () => void;
  /** Promotes to the head of the queue - the caller's existing handler and toast. */
  onPromote: (repo: Repository) => Promise<void>;
  /** Called once the publication may have changed anything, so the caller refreshes. */
  onPublished: () => void | Promise<void>;
}

type Phase = 'idle' | 'promoting' | 'publishing' | 'done';

/**
 * A safety net rather than a cancellation: aborting the request does not stop the
 * run on the server, so the timeout has to sit well above the slowest legitimate
 * publication (image generation plus the Threads connector's own 90 s timeout).
 */
const PUBLISH_TIMEOUT_MS = 240_000;

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
  onClose,
  onPromote,
  onPublished,
}: PublishRepositoryDialogProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<RetryMessageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reopening on another row must never show the previous run's rows.
  useEffect(() => {
    setPhase('idle');
    setResult(null);
    setError(null);
  }, [repository?.id]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const busy = phase === 'promoting' || phase === 'publishing';
  const rows = buildPublishRows(integrations, phase === 'idle' || phase === 'promoting' ? null : result);
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

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), PUBLISH_TIMEOUT_MS);
    abortRef.current = controller;
    setPhase('publishing');
    setError(null);
    let answered = false;

    try {
      const publishResult = await publishMessageNow(repository.url, { signal: controller.signal });
      answered = true;
      setResult(publishResult);
      if (publishedSomething(publishResult)) {
        await onPublished();
      }
    } catch (err) {
      setError(
        controller.signal.aborted
          ? 'Content Maestro did not answer in time. The publication may still be running — check Cron History before trying again.'
          : maestroErrorMessage(err)
      );
      // The run may have published before the connection broke, so the list has
      // to be refreshed either way.
      await onPublished();
    } finally {
      window.clearTimeout(timeout);
      abortRef.current = null;
      // A request that never produced a result leaves the choices in place, with
      // the error above them: refusals (a cron run holding the lock, an item
      // already published) are the kind of thing that is worth another try, and
      // the backend refuses a duplicate on its own.
      setPhase(answered ? 'done' : 'idle');
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
            {row.state === 'pending' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Sending...
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
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="max-w-lg"
        closeDisabled={busy}
        onEscapeKeyDown={event => busy && event.preventDefault()}
        onPointerDownOutside={event => busy && event.preventDefault()}
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

          {result?.posted_error && (
            <p className="bg-warning/10 text-warning p-3 rounded-md text-sm">
              Published, but the repository could not be marked as posted — the scheduled run may
              publish it again. ({result.posted_error})
            </p>
          )}

          {rows.length > 0 ? (
            <div>
              <h4 className="text-sm font-medium mb-2">
                {phase === 'done' ? 'Integrations:' : 'Will publish to:'}
              </h4>
              <ul className="space-y-1 text-sm">{rows.map(renderRow)}</ul>
            </div>
          ) : isApiReady ? (
            <p className="bg-warning/10 text-warning p-3 rounded-md text-sm">
              No integration is enabled, so there is nothing to publish to. Enable one on the
              Integrations tab.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          {phase === 'done' ? (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={busy}>
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
                disabled={busy || !isApiReady || integrations.length === 0}
              >
                {phase === 'publishing' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
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
