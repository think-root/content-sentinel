import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getPageNumbers } from '@/utils/repositoryListUtils';
import { Button } from "@/components/ui/base/button";

interface CronHistoryPaginationProps {
  itemCount: number;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const CronHistoryPagination = ({
  itemCount,
  totalItems,
  totalPages,
  currentPage,
  pageSize,
  onPageChange,
}: CronHistoryPaginationProps) => {
  if (itemCount === 0) {
    return null;
  }

  const total = totalItems || itemCount;
  const effectiveTotalPages = totalPages || Math.ceil(total / pageSize);
  const pageNumbers = getPageNumbers(currentPage, effectiveTotalPages);
  const showButtons = pageSize > 0 && total > pageSize;

  const summary = (
    <p>
      Showing <span className="font-medium">
        {Math.min((currentPage - 1) * pageSize + 1, total)}
      </span> to{' '}
      <span className="font-medium">
        {Math.min(currentPage * pageSize, total)}
      </span>{' '}
      of <span className="font-medium">{total}</span> results
    </p>
  );

  return (
    <>
      <div className="mt-4 pt-4 border-t md:block hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">
          <div className="text-sm text-muted-foreground">
            {summary}
          </div>

          {showButtons && (
            <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {pageNumbers.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  title={`Go to page ${pageNum}`}
                  className="min-w-[40px]"
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === effectiveTotalPages}
                title="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile pagination */}
      <div className="mt-4 pt-4 border-t md:hidden block">
        <div className="flex flex-col gap-4">
          <div className="text-sm text-muted-foreground text-center">
            {summary}
          </div>

          {showButtons && (
            <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1 px-4 w-full justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous page"
                className="min-w-[32px] flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {pageNumbers.map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  title={`Go to page ${pageNum}`}
                  className="min-w-[32px] flex-shrink-0"
                >
                  {pageNum}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === effectiveTotalPages}
                title="Next page"
                className="min-w-[32px] flex-shrink-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
