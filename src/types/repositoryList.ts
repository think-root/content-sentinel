import { Repository } from '../types';

export interface TruncatedTextProps {
  text: string;
  maxChars?: number;
}

export interface RepositoryListFiltersProps {
  searchTerm: string;
  statusFilter: 'all' | 'posted' | 'unposted';
  sortBy: 'id' | 'date_added' | 'date_posted';
  sortOrder: 'ASC' | 'DESC';
  itemsPerPage: number;
  showFilters: boolean;
  loading: boolean;
  initialPageSize: number;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: 'all' | 'posted' | 'unposted') => void;
  onSortByChange: (value: 'id' | 'date_added' | 'date_posted') => void;
  onSortOrderChange: (value: 'ASC' | 'DESC') => void;
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
}

export interface RepositoryMobileViewProps {
  repositories: Repository[];
  loading: boolean;
  isApiReady: boolean;
  totalItems: number;
  itemsPerPage: number;
  searchTerm: string;
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
  statusFilter: 'all' | 'posted' | 'unposted';
  sortBy: 'id' | 'date_added' | 'date_posted';
  sortOrder: 'ASC' | 'DESC';
  itemsPerPage: number;
  currentPage: number;
  showFilters: boolean;
  handleSearchTermChange: (value: string) => void;
  handleStatusFilterChange: (value: 'all' | 'posted' | 'unposted') => void;
  handleSortByChange: (value: 'id' | 'date_added' | 'date_posted') => void;
  handleSortOrderChange: (value: 'ASC' | 'DESC') => void;
  handleItemsPerPageChange: (value: number) => void;
  handlePageChange: (page: number) => void;
  handleClearFilters: () => void;
  handleToggleFilters: () => void;
}