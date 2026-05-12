import type { Repository, RepositorySortBy, RepositorySortOrder } from '../types';
import { formatDate } from './date-format';

export const DEFAULT_REPOSITORY_SORT_BY: RepositorySortBy = 'date_added';
export const DEFAULT_REPOSITORY_SORT_ORDER: RepositorySortOrder = 'DESC';
export const PUBLICATION_QUEUE_SORT_BY: RepositorySortBy = 'publication_queue';

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
  statusFilter: 'all' | 'posted' | 'unposted',
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
  statusFilter: 'all' | 'posted' | 'unposted',
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
