import { describe, expect, it } from 'vitest';
import type { CronJobHistory } from '@/api/index';
import { getLegacyFailedApis, getRetryTarget } from './message-retry';

const entry = (overrides: Partial<CronJobHistory>): CronJobHistory => ({
  name: 'message',
  timestamp: '2026-08-17T16:00:00Z',
  status: 2,
  ...overrides,
});

describe('getRetryTarget', () => {
  it('returns the integrations and the item recorded by the run', () => {
    expect(
      getRetryTarget(entry({
        output: 'Message sent to: bluesky. Failed: threads. Errors: threads API failed (status 500)',
        details: { url: 'https://github.com/a/b', sent: ['bluesky'], failed: ['threads'] },
      }))
    ).toEqual({ failed: ['threads'], url: 'https://github.com/a/b' });
  });

  it('retries a run that failed for every integration but did resolve an item', () => {
    expect(
      getRetryTarget(entry({
        status: 0,
        output: 'No messages sent successfully. Errors: threads API failed (status 500)',
        details: { url: 'https://github.com/a/b', failed: ['threads', 'bluesky'] },
      }))
    ).toEqual({ failed: ['threads', 'bluesky'], url: 'https://github.com/a/b' });
  });

  // The dangerous case: an empty queue makes the job report every integration as
  // failed while recording no item, so a retry would publish something unrelated.
  it('refuses a run that never resolved an item', () => {
    expect(
      getRetryTarget(entry({
        status: 0,
        output: 'No messages sent successfully. Errors: threads API error: no items for language en',
        details: { failed: ['threads', 'bluesky'] },
      }))
    ).toBeNull();
  });

  it('refuses successful runs and other jobs', () => {
    expect(getRetryTarget(entry({ status: 1, details: { url: 'u', sent: ['threads'] } }))).toBeNull();
    expect(getRetryTarget(entry({ name: 'collect', status: 0, output: 'Failed: x. Errors: y' }))).toBeNull();
  });

  it('reads the repository out of the legacy output that carries one', () => {
    expect(
      getRetryTarget(entry({
        output: 'Message sent to: telegram. Failed: twitter. Repository: https://github.com/a/b. Errors: twitter API failed (status 500)',
      }))
    ).toEqual({ failed: ['twitter'], url: 'https://github.com/a/b' });
  });
});

describe('getLegacyFailedApis', () => {
  it.each([
    ['the oldest format, without a trailing period', 'Message sent to: telegram. Failed: twitter, bluesky', ['twitter', 'bluesky']],
    ['a trailing period and an error section', 'Message sent to: telegram. Failed: twitter. Errors: boom', ['twitter']],
    ['an integration name containing a period', 'Message sent to: telegram. Failed: mastodon.social, twitter. Errors: boom', ['mastodon.social', 'twitter']],
  ])('parses %s', (_name, output, expected) => {
    expect(getLegacyFailedApis(entry({ output }))).toEqual(expected);
  });

  // "Failed:" can appear inside an error message; treating that as a list of
  // integrations would offer a retry on a run that published nothing.
  it('ignores Failed: inside error text', () => {
    expect(
      getLegacyFailedApis(entry({
        status: 0,
        output: 'No messages sent successfully. Errors: threads API error: failed to send request: Post "https://t/x": Failed: upstream 503, retry later. done',
      }))
    ).toEqual([]);
  });

  it('returns nothing when the run recorded structured details', () => {
    expect(
      getLegacyFailedApis(entry({
        output: 'Message sent to: bluesky. Failed: threads. Errors: boom',
        details: { url: 'https://github.com/a/b', failed: ['threads'] },
      }))
    ).toEqual([]);
  });

  it('returns nothing when the legacy output names the repository', () => {
    expect(
      getLegacyFailedApis(entry({
        output: 'Message sent to: telegram. Failed: twitter. Repository: https://github.com/a/b. Errors: boom',
      }))
    ).toEqual([]);
  });
});
