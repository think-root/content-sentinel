export type ArchiveSortBy = 'date_archived' | 'date_posted' | 'date_added' | 'id';

// Note: the archive endpoints expect lowercase sort order, unlike RepositorySortOrder ('ASC' | 'DESC')
export type ArchiveSortOrder = 'asc' | 'desc';

/** A row of the archived_repositories table. `id` is the archive row id, `original_id` the repository id. */
export interface ArchivedRepository {
  id: number;
  original_id?: number | null;
  url: string;
  text: string;
  date_added?: string | null;
  date_posted?: string | null;
  date_archived: string;
}

/** An entry of `data.archived` returned by the archive mutations. In dry-run mode `archive_id` is 0 and `date_archived` is null. */
export interface ArchiveOperationItem {
  archive_id: number;
  id?: number | null;
  url: string;
  date_added?: string | null;
  date_posted?: string | null;
  date_archived?: string | null;
}

export type ArchiveFailureReason = 'already_processed' | 'not_found' | 'not_posted' | (string & {});

export interface ArchiveFailure {
  identifier: string;
  reason: ArchiveFailureReason;
  message: string;
}

export interface ArchiveRepositoryResponse {
  status: string;
  message: string;
  data: {
    archived: ArchiveOperationItem[];
    failed: ArchiveFailure[];
  };
}

export interface ArchiveOldRepositoriesResponse {
  status: string;
  message: string;
  data: {
    archived_count: number;
    dry_run: boolean;
    archived: ArchiveOperationItem[];
  };
}

/** Body of POST /get-archived-repositories/. `limit` is intentionally absent - see buildArchiveRequestBody. */
export interface GetArchivedRepositoriesRequest {
  page?: number;
  page_size?: number;
  sort_by?: ArchiveSortBy;
  sort_order?: ArchiveSortOrder;
  url?: string;
  text?: string;
  date_added_from?: string;
  date_added_to?: string;
  date_posted_from?: string;
  date_posted_to?: string;
  date_archived_from?: string;
  date_archived_to?: string;
  text_language?: string;
}

export interface GetArchivedRepositoriesResponse {
  status: string;
  message: string;
  data: {
    all: number;
    items: ArchivedRepository[];
    page: number;
    page_size: number;
    total_pages: number;
    total_items: number;
  };
}

export interface ArchiveFilterState {
  url: string;
  text: string;
  dateAddedFrom: string;
  dateAddedTo: string;
  datePostedFrom: string;
  datePostedTo: string;
  dateArchivedFrom: string;
  dateArchivedTo: string;
  sortBy: ArchiveSortBy;
  sortOrder: ArchiveSortOrder;
  pageSize: number;
}

export type ArchiveFilterKey = keyof ArchiveFilterState;

export interface ArchiveFiltersProps {
  filters: ArchiveFilterState;
  loading: boolean;
  onFilterChange: <K extends ArchiveFilterKey>(key: K, value: ArchiveFilterState[K]) => void;
  onClearFilters: () => void;
}

export interface ArchiveTableProps {
  items: ArchivedRepository[];
  loading: boolean;
  isApiReady: boolean;
  totalItems: number;
  itemsPerPage: number;
  hasFilters: boolean;
}

export type ArchiveMobileViewProps = ArchiveTableProps;

export interface ArchiveListProps {
  items: ArchivedRepository[];
  all: number;
  loading: boolean;
  isApiReady: boolean;
  filters: ArchiveFilterState;
  showFilters: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onFilterChange: <K extends ArchiveFilterKey>(key: K, value: ArchiveFilterState[K]) => void;
  onClearFilters: () => void;
  onToggleFilters: () => void;
  onPageChange: (page: number) => void;
}

export interface ArchiveOldRepositoriesProps {
  isApiReady: boolean;
  onArchived: () => void | Promise<void>;
}
