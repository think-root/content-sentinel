import type { ArchiveTableProps } from '@/types/archive';
import { formatDate } from '@/utils/date-format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/base/table';
import { Skeleton } from '@/components/ui/common/skeleton';
import { RepositoryLink } from '@/components/ui/common/repository-link';
import { TruncatedText } from '@/components/ui/common/truncated-text';

const COLUMN_COUNT = 6;

export function ArchiveTable({
  items,
  loading,
  isApiReady,
  totalItems,
  itemsPerPage,
  hasFilters,
}: ArchiveTableProps) {
  const renderLoadingSkeleton = () => (
    Array.from({ length: itemsPerPage || 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell>
          <Skeleton className="h-4 w-12" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-full" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
      </TableRow>
    ))
  );

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={COLUMN_COUNT} className="text-center py-8 text-sm text-muted-foreground">
        {hasFilters ? 'No archived repositories match these filters' : 'No archived repositories yet'}
      </TableCell>
    </TableRow>
  );

  const renderApiNotReady = () => (
    <TableRow>
      <TableCell colSpan={COLUMN_COUNT} className="text-center py-4 text-sm text-muted-foreground">
        Data could not be loaded because API keys are not configured
      </TableCell>
    </TableRow>
  );

  const renderRows = () => (
    items.map((item) => (
      <TableRow key={item.id} className="group">
        <TableCell className="font-medium">
          {item.id}
        </TableCell>
        <TableCell className="min-w-0">
          <RepositoryLink url={item.url} />
        </TableCell>
        <TableCell>
          {item.text ? <TruncatedText text={item.text} maxChars={150} /> : <p>-</p>}
        </TableCell>
        {/* Formatted dates are fixed-length, so keep them on one line instead of wrapping mid-value */}
        <TableCell className="whitespace-nowrap">
          {item.date_added ? formatDate(item.date_added) : '-'}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {item.date_posted ? formatDate(item.date_posted) : '-'}
        </TableCell>
        <TableCell className="whitespace-nowrap">
          {item.date_archived ? formatDate(item.date_archived) : '-'}
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {/* Widths sum to 100% - six columns at the Posts table's fractions would overflow to 108%.
              nowrap keeps every header on one line at these widths. */}
          <TableHead className="w-[9%] whitespace-nowrap">Archive ID</TableHead>
          <TableHead className="w-[17%] whitespace-nowrap">Url</TableHead>
          <TableHead className="w-[32%] whitespace-nowrap">Text</TableHead>
          <TableHead className="w-[14%] whitespace-nowrap">Date Added</TableHead>
          <TableHead className="w-[14%] whitespace-nowrap">Date Posted</TableHead>
          <TableHead className="w-[14%] whitespace-nowrap">Date Archived</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {!isApiReady ? renderApiNotReady() :
         loading ? renderLoadingSkeleton() :
         totalItems === 0 || items.length === 0 ? renderEmptyState() :
         renderRows()}
      </TableBody>
    </Table>
  );
}
