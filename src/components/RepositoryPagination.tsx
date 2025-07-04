import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RepositoryPaginationProps } from '../types/repositoryList';
import { getPageNumbers, calculatePaginationInfo } from '../utils/repositoryListUtils';

export function RepositoryPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  searchTerm,
  filteredItemsCount,
  loading,
  onPageChange
}: RepositoryPaginationProps) {
  if (totalItems === 0 || (searchTerm && filteredItemsCount === 0)) {
    return null;
  }

  const { startItem, endItem } = calculatePaginationInfo(currentPage, itemsPerPage, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const renderPaginationInfo = () => {
    if (searchTerm) {
      return (
        <p>Found <span className="font-medium">{filteredItemsCount}</span> matching results</p>
      );
    }
    
    if (itemsPerPage === 0) {
      return (
        <p>Showing all <span className="font-medium">{totalItems}</span> results</p>
      );
    }
    
    return (
      <p>
        Showing <span className="font-medium">{startItem}</span> to{' '}
        <span className="font-medium">{endItem}</span>{' '}
        of <span className="font-medium">{totalItems}</span> results
      </p>
    );
  };

  const renderPaginationButtons = () => {
    if (searchTerm || itemsPerPage === 0 || totalItems <= itemsPerPage) {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
        {/* Previous button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      
        {/* Page numbers */}
        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
            className={`relative inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 border ${
              currentPage === pageNum 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' 
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
            } text-xs sm:text-sm font-medium rounded-md min-w-[30px] sm:min-w-[40px] text-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
            title={`Go to page ${pageNum}`}
          >
            {pageNum}
          </button>
        ))}
      
        {/* Next button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderMobilePaginationButtons = () => {
    if (searchTerm || itemsPerPage === 0 || totalItems <= itemsPerPage) {
      return null;
    }

    return (
      <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1 px-4 w-full justify-center">
        {/* Previous button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="relative inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] justify-center flex-shrink-0"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {/* Page numbers */}
        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
            className={`relative inline-flex items-center px-2 py-1 border text-sm font-medium rounded-md min-w-[32px] justify-center flex-shrink-0 ${
              currentPage === pageNum
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={`Go to page ${pageNum}`}
          >
            {pageNum}
          </button>
        ))}
      
        {/* Next button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="relative inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] justify-center flex-shrink-0"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Pagination */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 md:block hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {renderPaginationInfo()}
          </div>
          {renderPaginationButtons()}
        </div>
      </div>

      {/* Mobile Pagination */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 md:hidden block">
        <div className="flex flex-col items-center space-y-4 w-full">
          <div className="text-xs text-gray-700 dark:text-gray-300 w-full text-center">
            {renderPaginationInfo()}
          </div>
          {renderMobilePaginationButtons()}
        </div>
      </div>
    </>
  );
}