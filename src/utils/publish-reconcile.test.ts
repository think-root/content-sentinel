import { describe, expect, it } from 'vitest';
import type { CronJobHistory } from '@/api/index';
import { classifyPublishFailure, reconcilePublish } from './publish-reconcile';

const URL = 'https://github.com/owner/repo';
const NOW = Date.parse('2026-09-02T18:40:00Z');

const run = (overrides: Partial<CronJobHistory> & { sent?: string[]; failed?: string[] } = {}): CronJobHistory => {
  const { sent, failed, ...rest } = overrides;
  return {
    name: 'message',
    timestamp: '2026-09-02T18:42:17Z',
    status: 1,
    output: 'Manual publish finished',
    details: { url: URL, manual: true, sent: sent ?? ['bluesky', 'threads'], failed: failed ?? [] },
    ...rest,
  };
};

const reconcile = (overrides: Partial<Parameters<typeof reconcilePublish>[0]> = {}) =>
  reconcilePublish({ url: URL, since: NOW, history: [], posted: null, historyRead: true, ...overrides });

describe('classifyPublishFailure', () => {
  it('treats a timeout as an unknown outcome', () => {
    const failure = classifyPublishFailure(new Error('whatever'), true);

    expect(failure.unknown).toBe(true);
    expect(failure.message).toContain('may still be running');
  });

  it('treats an aborted request as an unknown outcome', () => {
    const abort = Object.assign(new Error('The user aborted a request.'), { name: 'AbortError' });
    const failure = classifyPublishFailure(abort, false);

    expect(failure.unknown).toBe(true);
    expect(failure.message).toContain('may still be running');
  });

  it('treats a dropped connection as an unknown outcome rather than a failed publication', () => {
    const failure = classifyPublishFailure(new TypeError('Failed to fetch'), false);

    expect(failure.unknown).toBe(true);
    expect(failure.message).toContain('may still be running');
    expect(failure.message).not.toContain('Failed to connect');
  });

  it('keeps an answered refusal as a known failure and shows what was said', () => {
    const failure = classifyPublishFailure(new Error('repository is already published'), false);

    expect(failure.unknown).toBe(false);
    expect(failure.message).toBe('Content Maestro: repository is already published');
  });
});

describe('reconcilePublish', () => {
  it('confirms a complete run from the recorded one', () => {
    const outcome = reconcile({ history: [run()], posted: true });

    expect(outcome.published).toBe(true);
    expect(outcome.tone).toBe('success');
    expect(outcome.message).toBe('Cron History confirms the post went out to all 2 integrations.');
    expect(outcome.result?.succeeded).toEqual(['bluesky', 'threads']);
  });

  it('names the single integration a one-integration run reached', () => {
    const outcome = reconcile({ history: [run({ sent: ['bluesky'] })], posted: true });

    expect(outcome.message).toContain('the integration');
  });

  it('sends a partial run that left the queue to Publish again', () => {
    const outcome = reconcile({
      history: [run({ sent: ['bluesky'], failed: ['threads'] })],
      posted: true,
    });

    expect(outcome.published).toBe(true);
    expect(outcome.tone).toBe('partial');
    expect(outcome.message).toContain('reached 1 of 2 integrations');
    expect(outcome.message).toContain('Publish again');
  });

  it('says a partial run that stayed in the queue will be published again', () => {
    const outcome = reconcile({
      history: [run({ sent: ['bluesky'], failed: ['threads'] })],
      posted: false,
    });

    expect(outcome.message).toContain('still in the queue');
  });

  it('reports a run that published nothing as a failure', () => {
    const outcome = reconcile({ history: [run({ sent: [], failed: ['bluesky', 'threads'] })], posted: false });

    expect(outcome.published).toBe(false);
    expect(outcome.tone).toBe('error');
    expect(outcome.message).toContain('published nothing');
    expect(outcome.result?.failed).toEqual(['bluesky', 'threads']);
  });

  it('admits when the posted state could not be read', () => {
    const outcome = reconcile({ history: [run({ sent: ['bluesky'], failed: ['threads'] })], posted: null });

    expect(outcome.message).toContain('could not be checked');
  });

  it('trusts the posted flag when no run is recorded yet', () => {
    const outcome = reconcile({ posted: true });

    expect(outcome.published).toBe(true);
    expect(outcome.tone).toBe('partial');
    expect(outcome.message).toContain('marked as published');
  });

  it('does not claim nothing was published while the run may still be finishing', () => {
    const outcome = reconcile({ posted: false });

    expect(outcome.published).toBe(false);
    expect(outcome.message).toContain('has not finished yet');
  });

  it('reports an unreadable run list as unknown instead of as an absent run', () => {
    const outcome = reconcile({ posted: false, historyRead: false });

    expect(outcome.published).toBe(false);
    expect(outcome.result).toBeNull();
    expect(outcome.message).toContain('could not be checked');
  });

  it('still trusts the posted flag when the run list is unreadable', () => {
    const outcome = reconcile({ posted: true, historyRead: false });

    expect(outcome.published).toBe(true);
  });

  it('ignores a run recorded for another repository', () => {
    const other = run({ details: { url: 'https://github.com/owner/other', sent: ['bluesky'] } });
    const outcome = reconcile({ history: [other], posted: false });

    expect(outcome.result).toBeNull();
    expect(outcome.message).toContain('has not finished yet');
  });

  it('ignores a run that predates the request by more than the clock tolerance', () => {
    const stale = run({ timestamp: '2026-09-02T18:00:00Z' });
    const outcome = reconcile({ history: [stale], posted: false });

    expect(outcome.result).toBeNull();
  });

  it('keeps a run whose timestamp is only slightly older than the request', () => {
    const skewed = run({ timestamp: '2026-09-02T18:35:00Z' });
    const outcome = reconcile({ history: [skewed], posted: true });

    expect(outcome.published).toBe(true);
  });

  it('keeps a matching run whose timestamp cannot be parsed', () => {
    const outcome = reconcile({ history: [run({ timestamp: 'not a date' })], posted: true });

    expect(outcome.published).toBe(true);
  });

  it('takes the newest matching run', () => {
    const older = run({ timestamp: '2026-09-02T18:41:00Z', sent: [], failed: ['bluesky'] });
    const newer = run({ timestamp: '2026-09-02T18:42:17Z' });
    const outcome = reconcile({ history: [newer, older], posted: true });

    expect(outcome.published).toBe(true);
    expect(outcome.result?.succeeded).toEqual(['bluesky', 'threads']);
  });
});
