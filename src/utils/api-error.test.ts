import { describe, expect, it } from 'vitest';
import { isRateLimitError } from './api-error';

describe('isRateLimitError', () => {
  it('recognizes the message the API helpers throw', () => {
    expect(isRateLimitError(new Error('Rate limit exceeded. Please try again later.'))).toBe(true);
  });

  it('recognizes a numeric 429 status', () => {
    expect(isRateLimitError({ status: 429 })).toBe(true);
    expect(isRateLimitError({ statusCode: 429 })).toBe(true);
  });

  it('rejects other errors and non-objects', () => {
    expect(isRateLimitError(new Error('Failed to fetch'))).toBe(false);
    expect(isRateLimitError({ status: 500 })).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
    expect(isRateLimitError('Rate limit exceeded')).toBe(false);
  });
});
