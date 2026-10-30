import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readSavedRepositoryQuery } from './repositoryListUtils';

describe('readSavedRepositoryQuery', () => {
  let data: Map<string, string>;

  beforeEach(() => {
    data = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
      removeItem: (key: string) => void data.delete(key),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to the defaults when nothing is saved', () => {
    expect(readSavedRepositoryQuery()).toEqual({
      statusFilter: 'all',
      posted: undefined,
      sortBy: 'date_added',
      sortOrder: 'DESC',
      itemsPerPage: 10,
    });
  });

  it('returns the saved query, keeping 0 as "show all"', () => {
    data.set('dashboardStatusFilter', 'posted');
    data.set('dashboardSortBy', 'date_posted');
    data.set('dashboardSortOrder', 'ASC');
    data.set('dashboardItemsPerPage', '0');

    expect(readSavedRepositoryQuery()).toEqual({
      statusFilter: 'posted',
      posted: true,
      sortBy: 'date_posted',
      sortOrder: 'ASC',
      itemsPerPage: 0,
    });
  });
});
