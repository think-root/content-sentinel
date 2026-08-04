import type {
  ArchiveFailure,
  ArchiveFilterState,
  ArchiveRepositoryResponse,
  ArchiveSortBy,
  ArchiveSortOrder,
  GetArchivedRepositoriesRequest,
} from '../types/archive';

export const DEFAULT_ARCHIVE_SORT_BY: ArchiveSortBy = 'date_archived';
export const DEFAULT_ARCHIVE_SORT_ORDER: ArchiveSortOrder = 'desc';
export const DEFAULT_ARCHIVE_PAGE_SIZE = 10;
export const DEFAULT_ARCHIVE_DAYS = 30;

/** The API rejects more than 100 identifiers per archive request. */
export const ARCHIVE_MAX_IDENTIFIERS = 100;

export const ARCHIVE_SORT_BY_OPTIONS: ArchiveSortBy[] = ['date_archived', 'date_posted', 'date_added', 'id'];

export const ARCHIVE_SORT_BY_LABELS: Record<ArchiveSortBy, string> = {
  date_archived: 'Date Archived',
  date_posted: 'Date Posted',
  date_added: 'Date Added',
  id: 'ID',
};

export const isArchiveSortBy = (value: string | null | undefined): value is ArchiveSortBy => {
  return ARCHIVE_SORT_BY_OPTIONS.includes(value as ArchiveSortBy);
};

export const normalizeArchiveSortBy = (value: string | null | undefined): ArchiveSortBy => {
  return isArchiveSortBy(value) ? value : DEFAULT_ARCHIVE_SORT_BY;
};

export const normalizeArchiveSortOrder = (value: string | null | undefined): ArchiveSortOrder => {
  return value === 'asc' || value === 'desc' ? value : DEFAULT_ARCHIVE_SORT_ORDER;
};

export const DEFAULT_ARCHIVE_FILTERS: ArchiveFilterState = {
  url: '',
  text: '',
  dateAddedFrom: '',
  dateAddedTo: '',
  datePostedFrom: '',
  datePostedTo: '',
  dateArchivedFrom: '',
  dateArchivedTo: '',
  sortBy: DEFAULT_ARCHIVE_SORT_BY,
  sortOrder: DEFAULT_ARCHIVE_SORT_ORDER,
  pageSize: DEFAULT_ARCHIVE_PAGE_SIZE,
};

/** `from` must not be later than `to`; an empty bound is always valid. */
export const isValidDateRange = (from: string, to: string): boolean => {
  if (!from || !to) return true;
  return from <= to;
};

export const ARCHIVE_DATE_RANGE_KEYS: Array<[keyof ArchiveFilterState, keyof ArchiveFilterState]> = [
  ['dateAddedFrom', 'dateAddedTo'],
  ['datePostedFrom', 'datePostedTo'],
  ['dateArchivedFrom', 'dateArchivedTo'],
];

export const hasValidArchiveDateRanges = (filters: ArchiveFilterState): boolean => {
  return ARCHIVE_DATE_RANGE_KEYS.every(([from, to]) =>
    isValidDateRange(filters[from] as string, filters[to] as string)
  );
};

const ARCHIVE_FILTER_FLAGS = (filters: ArchiveFilterState, defaultPageSize: number): boolean[] => [
  !!filters.url,
  !!filters.text,
  !!filters.dateAddedFrom,
  !!filters.dateAddedTo,
  !!filters.datePostedFrom,
  !!filters.datePostedTo,
  !!filters.dateArchivedFrom,
  !!filters.dateArchivedTo,
  filters.sortBy !== DEFAULT_ARCHIVE_SORT_BY,
  filters.sortOrder !== DEFAULT_ARCHIVE_SORT_ORDER,
  filters.pageSize !== defaultPageSize,
];

export const hasActiveArchiveFilters = (
  filters: ArchiveFilterState,
  defaultPageSize: number = DEFAULT_ARCHIVE_PAGE_SIZE
): boolean => {
  return ARCHIVE_FILTER_FLAGS(filters, defaultPageSize).some(Boolean);
};

export const countActiveArchiveFilters = (
  filters: ArchiveFilterState,
  defaultPageSize: number = DEFAULT_ARCHIVE_PAGE_SIZE
): number => {
  return ARCHIVE_FILTER_FLAGS(filters, defaultPageSize).filter(Boolean).length;
};

/**
 * Builds the POST /get-archived-repositories/ body from the UI filter state.
 *
 * Two API quirks are handled here:
 * - `limit` is never sent: the server uses it as the effective page size whenever it is > 0,
 *   which would silently override `page_size`.
 * - pageSize 0 ("All") sends neither `page` nor `page_size`, because any positive `page`
 *   activates pagination - with `page_size: 0` that yields an empty window.
 *
 * Dates are passed through as YYYY-MM-DD; the server treats a date-only `*_to` bound as
 * end-of-day. That bound is evaluated in server time while formatDate renders in the
 * user's configured timezone, so a row near midnight may look just outside the range.
 */
export const buildArchiveRequestBody = (
  filters: ArchiveFilterState,
  page: number,
  textLanguage?: string
): GetArchivedRepositoriesRequest => {
  const body: GetArchivedRepositoriesRequest = {
    sort_by: filters.sortBy,
    sort_order: filters.sortOrder,
  };

  if (filters.pageSize > 0) {
    body.page = Math.max(1, page);
    body.page_size = filters.pageSize;
  }

  const optional: Array<[keyof GetArchivedRepositoriesRequest, string]> = [
    ['url', filters.url],
    ['text', filters.text],
    ['date_added_from', filters.dateAddedFrom],
    ['date_added_to', filters.dateAddedTo],
    ['date_posted_from', filters.datePostedFrom],
    ['date_posted_to', filters.datePostedTo],
    ['date_archived_from', filters.dateArchivedFrom],
    ['date_archived_to', filters.dateArchivedTo],
    ['text_language', textLanguage || ''],
  ];

  optional.forEach(([key, value]) => {
    const trimmed = value.trim();
    if (trimmed) {
      (body as Record<string, unknown>)[key] = trimmed;
    }
  });

  return body;
};

const ARCHIVE_FAILURE_MESSAGES: Record<string, string> = {
  already_processed: 'Duplicate identifier in the same request',
  not_found: 'Repository not found',
  not_posted: 'Only published repositories can be archived',
};

export const describeArchiveFailure = (failure: ArchiveFailure): string => {
  return ARCHIVE_FAILURE_MESSAGES[failure.reason] || failure.message || 'Failed to archive repository';
};

/** `not_found` / `already_processed` mean the row is gone server-side, so the list should still be refreshed. */
export const isStaleArchiveFailure = (failure: ArchiveFailure): boolean => {
  return failure.reason === 'not_found' || failure.reason === 'already_processed';
};

export const summarizeArchiveResult = (response: ArchiveRepositoryResponse) => {
  const archived = response.data?.archived || [];
  const failed = response.data?.failed || [];

  return {
    archivedCount: archived.length,
    failedCount: failed.length,
    firstFailure: failed[0],
  };
};
