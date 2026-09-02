import { describe, expect, it } from 'vitest';
import type { ApiConfig } from '@/api/api-configs';
import type { RetryMessageResult } from '@/api/index';
import {
  buildPublishRows,
  enabledIntegrations,
  publishedSomething,
  summarizePublishResult,
} from './message-publish';

const config = (overrides: Partial<ApiConfig>): ApiConfig => ({
  id: 1,
  name: 'threads',
  url: 'http://threads-connector:9016/threads/post',
  method: 'POST',
  auth_type: 'api_key',
  token_env_var: 'THREADS_API_KEY',
  token_header: 'X-API-Key',
  content_type: 'json',
  timeout: 90,
  success_code: 200,
  enabled: true,
  response_type: 'json',
  text_language: 'en',
  socialify_image: false,
  default_json_body: '',
  updated_at: '2026-08-17T16:00:00Z',
  ...overrides,
});

const result = (overrides: Partial<RetryMessageResult>): RetryMessageResult => ({
  url: 'https://github.com/a/b',
  status: 1,
  message: 'Manual publish: https://github.com/a/b sent to: threads',
  ...overrides,
});

const telegram = { name: 'telegram', textLanguage: 'uk' };
const threads = { name: 'threads', textLanguage: 'en' };

describe('enabledIntegrations', () => {
  it('keeps only the enabled ones, sorted the way Content Maestro reports them', () => {
    expect(enabledIntegrations([
      config({ name: 'threads', text_language: 'en' }),
      config({ name: 'bluesky', enabled: false }),
      config({ name: 'telegram', text_language: 'uk' }),
    ])).toEqual([telegram, threads]);
  });

  it('returns nothing when every integration is disabled', () => {
    expect(enabledIntegrations([config({ enabled: false })])).toEqual([]);
  });
});

describe('buildPublishRows', () => {
  it('shows every expected integration as pending before the run answers', () => {
    expect(buildPublishRows([telegram, threads])).toEqual([
      { name: 'telegram', state: 'pending', textLanguage: 'uk' },
      { name: 'threads', state: 'pending', textLanguage: 'en' },
    ]);
  });

  it('resolves the rows from the reported outcomes', () => {
    expect(buildPublishRows([telegram, threads], result({
      status: 2,
      succeeded: ['telegram'],
      failed: ['threads'],
      outcomes: [
        { api_name: 'telegram', success: true },
        { api_name: 'threads', success: false, error: 'API request failed with status 500' },
      ],
    }))).toEqual([
      { name: 'telegram', state: 'success', error: undefined, textLanguage: 'uk' },
      { name: 'threads', state: 'failure', error: 'API request failed with status 500', textLanguage: 'en' },
    ]);
  });

  // Go marshals empty slices as null, so the outcomes can be missing entirely
  // while the name lists still say what happened.
  it('falls back to the name lists when no outcomes came back', () => {
    expect(buildPublishRows([telegram, threads], result({
      status: 2,
      succeeded: ['telegram'],
      failed: ['threads'],
      outcomes: null,
    }))).toEqual([
      { name: 'telegram', state: 'success', error: undefined, textLanguage: 'uk' },
      { name: 'threads', state: 'failure', error: 'unknown error', textLanguage: 'en' },
    ]);
  });

  it('names a failure with no message rather than leaving it blank', () => {
    expect(buildPublishRows([threads], result({
      status: 0,
      outcomes: [{ api_name: 'threads', success: false, error: '  ' }],
    }))[0]).toEqual({ name: 'threads', state: 'failure', error: 'unknown error', textLanguage: 'en' });
  });

  // An integration enabled in another tab is published to but is missing from
  // this dashboard's cached list, so the run is what decides it exists.
  it('includes an integration the run reported but the dashboard did not expect', () => {
    expect(buildPublishRows([threads], result({
      succeeded: ['threads', 'bluesky'],
      outcomes: [
        { api_name: 'threads', success: true },
        { api_name: 'bluesky', success: true },
      ],
    }))).toEqual([
      { name: 'threads', state: 'success', error: undefined, textLanguage: 'en' },
      { name: 'bluesky', state: 'success', error: undefined, textLanguage: undefined },
    ]);
  });

  // The opposite case: an integration disabled since the list was cached never
  // gets an outcome, and silently showing it as fine would be a lie.
  it('treats an expected integration with no reported outcome as a failure', () => {
    expect(buildPublishRows([telegram, threads], result({
      succeeded: ['threads'],
      outcomes: [{ api_name: 'threads', success: true }],
    }))).toEqual([
      { name: 'telegram', state: 'failure', error: 'no result reported', textLanguage: 'uk' },
      { name: 'threads', state: 'success', error: undefined, textLanguage: 'en' },
    ]);
  });
});

describe('summarizePublishResult', () => {
  it('reports a full success', () => {
    const summary = summarizePublishResult(result({ status: 1, succeeded: ['telegram', 'threads'] }));
    expect(summary.tone).toBe('success');
    expect(summary.text).toContain('all 2 integrations');
  });

  it('reports a partial success and points at the retry', () => {
    const summary = summarizePublishResult(result({
      status: 2,
      succeeded: ['telegram'],
      failed: ['threads'],
    }));
    expect(summary.tone).toBe('partial');
    expect(summary.text).toContain('1 of 2');
    expect(summary.text).toContain('Cron History');
  });

  it('reports a run that published nothing and says the item stays queued', () => {
    const summary = summarizePublishResult(result({ status: 0, succeeded: null, failed: ['threads'] }));
    expect(summary.tone).toBe('error');
    expect(summary.text).toContain('stays in the queue');
  });
});

describe('publishedSomething', () => {
  it.each([
    ['no result', undefined, false],
    ['a null list', result({ succeeded: null }), false],
    ['an empty list', result({ succeeded: [] }), false],
    ['one integration', result({ succeeded: ['threads'] }), true],
  ])('%s', (_name, value, expected) => {
    expect(publishedSomething(value as RetryMessageResult | undefined)).toBe(expected);
  });
});
