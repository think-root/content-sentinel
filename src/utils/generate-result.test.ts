import { describe, expect, it } from 'vitest';
import { buildGenerateErrorMessages } from './generate-result';

describe('buildGenerateErrorMessages', () => {
  it('prefers per-repository details over the response-wide message', () => {
    expect(buildGenerateErrorMessages({
      status: 'ok',
      dont_added: ['https://github.com/a/b', 'https://github.com/c/d'],
      error_message: 'generic failure',
      error_details: { 'https://github.com/a/b': { type: 'exists', message: 'already in the database' } },
    })).toEqual({
      'https://github.com/a/b': 'already in the database',
      'https://github.com/c/d': 'generic failure',
    });
  });

  it('keeps reasons found before the request', () => {
    expect(buildGenerateErrorMessages({ status: 'ok', dont_added: [] }, { nope: 'invalid' })).toEqual({ nope: 'invalid' });
  });

  it('ignores a blank response-wide message', () => {
    expect(buildGenerateErrorMessages({ status: 'ok', dont_added: ['x'], error_message: '  ' })).toEqual({});
  });
});
