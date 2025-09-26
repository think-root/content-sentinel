import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RepositoryPaginationProps } from '@/types/repositoryList';
import { getPageNumbers, calculatePaginationInfo } from '@/utils/repositoryListUtils';
import { Button } from '../base/button';

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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="px-2 sm:px-3"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      
        {/* Page numbers */}
        {pageNumbers.map((pageNum: number) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
            className="min-w-[30px] sm:min-w-[40px] px-2 sm:px-3"
            title={`Go to page ${pageNum}`}
          >
            {pageNum}
          </Button>
        ))}
      
        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="px-2 sm:px-3"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="px-2 min-w-[32px]"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Page numbers */}
        {pageNumbers.map((pageNum: number) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(pageNum)}
            disabled={loading}
            className="min-w-[32px] px-2"
            title={`Go to page ${pageNum}`}
          >
            {pageNum}
          </Button>
        ))}
      
        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="px-2 min-w-[32px]"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Pagination */}
      <div className="mt-4 pt-4 border-t border-border md:block hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">
          <div className="text-sm text-muted-foreground">
            {renderPaginationInfo()}
          </div>
          {renderPaginationButtons()}
        </div>
      </div>

      {/* Mobile Pagination */}
      <div className="mt-4 pt-4 border-t border-border md:hidden block">
        <div className="flex flex-col items-center space-y-4 w-full">
          <div className="text-xs text-muted-foreground w-full text-center">
            {renderPaginationInfo()}
          </div>
          {renderMobilePaginationButtons()}
        </div>
      </div>
    </>
  );
}