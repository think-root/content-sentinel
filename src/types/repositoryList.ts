import type { Repository, RepositorySortBy, RepositorySortOrder, RepositoryStatusFilter } from '../types';

export interface TruncatedTextProps {
  text: string;
  maxChars?: number;
}

export interface RepositoryListFiltersProps {
  searchTerm: string;
  statusFilter: RepositoryStatusFilter;
  sortBy: RepositorySortBy;
  sortOrder: RepositorySortOrder;
  itemsPerPage: number;
  showFilters: boolean;
  loading: boolean;
  initialPageSize: number;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: RepositoryStatusFilter) => void;
  onSortByChange: (value: RepositorySortBy) => void;
  onSortOrderChange: (value: RepositorySortOrder) => void;
  onItemsPerPageChange: (value: number) => void;
  onClearFilters: () => void;
}

export interface RepositoryTableProps {
  repositories: Repository[];
  loading: boolean;
  isApiReady: boolean;
  totalItems: number;
  itemsPerPage: number;
  searchTerm: string;
  nextPostId?: number;
  onRepositoryUpdate?: () => void | Promise<void>;
  onRepositoryArchived?: () => void | Promise<void>;
}

export interface RepositoryMobileViewProps {
  repositories: Repository[];
  loading: boolean;
  isApiReady: boolean;
  totalItems: number;
  itemsPerPage: number;
  searchTerm: string;
  nextPostId?: number;
  onRepositoryUpdate?: () => void | Promise<void>;
  onRepositoryArchived?: () => void | Promise<void>;
}

export interface RepositoryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  searchTerm: string;
  filteredItemsCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export interface UseRepositoryFiltersReturn {
  searchTerm: string;
  statusFilter: RepositoryStatusFilter;
  sortBy: RepositorySortBy;
  sortOrder: RepositorySortOrder;
  itemsPerPage: number;
  currentPage: number;
  showFilters: boolean;
  handleSearchTermChange: (value: string) => void;
  handleStatusFilterChange: (value: RepositoryStatusFilter) => void;
  handleSortByChange: (value: RepositorySortBy) => void;
  handleSortOrderChange: (value: RepositorySortOrder) => void;
  handleItemsPerPageChange: (value: number) => void;
  handlePageChange: (page: number) => void;
  handleClearFilters: () => void;
  handleToggleFilters: () => void;
}
