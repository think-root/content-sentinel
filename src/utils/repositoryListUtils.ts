import { Repository } from '../types';
import { formatDate } from './date-format';

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
  sortBy: 'id' | 'date_added' | 'date_posted',
  sortOrder: 'ASC' | 'DESC',
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
  sortBy: 'id' | 'date_added' | 'date_posted',
  sortOrder: 'ASC' | 'DESC',
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