import type { Repository, RepositorySortBy, RepositorySortOrder, RepositoryStatusFilter } from '../types';
import { formatDate } from './date-format';

export const DEFAULT_REPOSITORY_STATUS_FILTER: RepositoryStatusFilter = 'all';
export const DEFAULT_REPOSITORY_SORT_BY: RepositorySortBy = 'date_added';
export const DEFAULT_REPOSITORY_SORT_ORDER: RepositorySortOrder = 'DESC';
export const PUBLICATION_QUEUE_SORT_BY: RepositorySortBy = 'publication_queue';

export const REPOSITORY_SORT_OPTIONS_BY_STATUS: Record<RepositoryStatusFilter, RepositorySortBy[]> = {
  all: ['id', 'date_added'],
  posted: ['id', 'date_added', 'date_posted'],
  unposted: ['id', 'date_added', PUBLICATION_QUEUE_SORT_BY],
};

export const isRepositoryStatusFilter = (value: string | null | undefined): value is RepositoryStatusFilter => {
  return value === 'all' || value === 'posted' || value === 'unposted';
};

export const normalizeRepositoryStatusFilter = (value: string | null | undefined): RepositoryStatusFilter => {
  return isRepositoryStatusFilter(value) ? value : DEFAULT_REPOSITORY_STATUS_FILTER;
};

export const isRepositorySortBy = (value: string | null | undefined): value is RepositorySortBy => {
  return value === 'id' || value === 'date_added' || value === 'date_posted' || value === 'publication_queue';
};

export const normalizeRepositorySortBy = (value: string | null | undefined): RepositorySortBy => {
  return isRepositorySortBy(value) ? value : DEFAULT_REPOSITORY_SORT_BY;
};

export const normalizeRepositorySortOrder = (
  value: string | null | undefined,
  sortBy?: RepositorySortBy
): RepositorySortOrder => {
  if (sortBy === PUBLICATION_QUEUE_SORT_BY) {
    return 'ASC';
  }

  return value === 'ASC' || value === 'DESC' ? value : DEFAULT_REPOSITORY_SORT_ORDER;
};

export const getRepositoryStatusFilterFromPosted = (posted?: boolean): RepositoryStatusFilter => {
  if (posted === undefined) return 'all';
  return posted ? 'posted' : 'unposted';
};

export const getPostedFilterFromRepositoryStatus = (statusFilter: RepositoryStatusFilter): boolean | undefined => {
  if (statusFilter === 'all') return undefined;
  return statusFilter === 'posted';
};

export const getRepositorySortOptionsForStatus = (statusFilter: RepositoryStatusFilter): RepositorySortBy[] => {
  return REPOSITORY_SORT_OPTIONS_BY_STATUS[statusFilter];
};

export const isRepositorySortCompatibleWithStatus = (
  statusFilter: RepositoryStatusFilter,
  sortBy: RepositorySortBy
): boolean => {
  return REPOSITORY_SORT_OPTIONS_BY_STATUS[statusFilter].includes(sortBy);
};

export const getFallbackRepositorySortBy = (
  statusFilter: RepositoryStatusFilter,
  sortBy: RepositorySortBy
): RepositorySortBy => {
  if (isRepositorySortCompatibleWithStatus(statusFilter, sortBy)) {
    return sortBy;
  }

  if (statusFilter === 'posted') {
    return 'date_posted';
  }

  if (statusFilter === 'unposted') {
    return PUBLICATION_QUEUE_SORT_BY;
  }

  return DEFAULT_REPOSITORY_SORT_BY;
};

export const normalizeRepositoryFilterState = (
  statusFilterValue: string | null | undefined,
  sortByValue: string | null | undefined,
  sortOrderValue: string | null | undefined
): {
  statusFilter: RepositoryStatusFilter;
  posted: boolean | undefined;
  sortBy: RepositorySortBy;
  sortOrder: RepositorySortOrder;
} => {
  const statusFilter = normalizeRepositoryStatusFilter(statusFilterValue);
  const requestedSortBy = normalizeRepositorySortBy(sortByValue);
  const sortBy = getFallbackRepositorySortBy(statusFilter, requestedSortBy);
  const sortOrder = normalizeRepositorySortOrder(sortOrderValue, sortBy);

  return {
    statusFilter,
    posted: getPostedFilterFromRepositoryStatus(statusFilter),
    sortBy,
    sortOrder,
  };
};

export const filterRepositories = (repositories: Repository[], searchTerm: string): Repository[] => {
  if (!searchTerm) return repositories;
  
  const searchTermLower = searchTerm.toLowerCase();
  return repositories.filter(repo => {
    return (
      (repo.text && repo.text.toLowerCase().includes(searchTermLower)) ||
      (repo.url && repo.url.toLowerCase().includes(searchTermLower)) ||
      (repo.date_added && formatDate(repo.date_added).toLowerCase().includes(searchTermLower)) ||
      (repo.date_posted && formatDate(repo.date_posted).toLowerCase().includes(searchTermLower))
    );
  });
};

export const getPageNumbers = (currentPage: number, totalPages: number): number[] => {
  const maxVisiblePages = 5;
  
  if (totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  if (currentPage <= 3) {
    return Array.from({ length: maxVisiblePages }, (_, i) => i + 1);
  }
  
  if (currentPage >= totalPages - 2) {
    return Array.from({ length: maxVisiblePages }, (_, i) => totalPages - maxVisiblePages + 1 + i);
  }
  
  return Array.from({ length: maxVisiblePages }, (_, i) => currentPage - 2 + i);
};

export const calculatePaginationInfo = (
  currentPage: number, 
  itemsPerPage: number, 
  totalItems: number
) => {
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  return { startItem, endItem };
};

export const hasActiveFilters = (
  searchTerm: string,
  statusFilter: RepositoryStatusFilter,
  sortBy: RepositorySortBy,
  sortOrder: RepositorySortOrder,
  itemsPerPage: number,
  initialPageSize: number
): boolean => {
  return !!(
    searchTerm ||
    statusFilter !== 'all' ||
    sortBy !== 'date_added' ||
    sortOrder !== 'DESC' ||
    itemsPerPage !== initialPageSize
  );
};

export const countActiveFilters = (
  searchTerm: string,
  statusFilter: RepositoryStatusFilter,
  sortBy: RepositorySortBy,
  sortOrder: RepositorySortOrder,
  itemsPerPage: number,
  initialPageSize: number
): number => {
  return [
    searchTerm,
    statusFilter !== 'all',
    sortBy !== 'date_added',
    sortOrder !== 'DESC',
    itemsPerPage !== initialPageSize
  ].filter(Boolean).length;
};
