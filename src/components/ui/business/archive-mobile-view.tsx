import type { ArchiveMobileViewProps } from '@/types/archive';
import { formatDate } from '@/utils/date-format';
import { RepositoryLink } from '@/components/ui/common/repository-link';
import { TruncatedText } from '@/components/ui/common/truncated-text';
import { Label } from '../base/label';

export function ArchiveMobileView({
  items,
  loading,
  isApiReady,
  totalItems,
  itemsPerPage,
  hasFilters,
}: ArchiveMobileViewProps) {
  const renderLoadingSkeleton = () => (
    Array.from({ length: itemsPerPage || 5 }).map((_, index) => (
      <div key={index} className={`bg-card border ${index !== (itemsPerPage || 5) - 1 ? 'border-b' : ''} p-4 mb-4 animate-pulse`}>
        <div className="space-y-3">
          <div>
            <div className="h-3 bg-muted rounded w-8 mb-2"></div>
            <div className="h-4 bg-muted rounded w-12"></div>
          </div>
          <div>
            <div className="h-3 bg-muted rounded w-16 mb-2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
          <div>
            <div className="h-3 bg-muted rounded w-20 mb-2"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
          </div>
        </div>
      </div>
    ))
  );

  const renderEmptyState = () => (
    <div className="bg-card border rounded-lg p-4 mb-4 text-center">
      <p className="text-sm text-muted-foreground">
        {hasFilters ? 'No archived repositories match these filters' : 'No archived repositories yet'}
      </p>
    </div>
  );

  const renderApiNotReady = () => (
    <div className="bg-card border rounded-lg p-4 mb-4">
      <p className="text-sm text-muted-foreground text-center">
        Data could not be loaded because API keys are not configured
      </p>
    </div>
  );

  const renderCards = () => (
    items.map((item, index) => (
      <div key={item.id} className={`bg-card border ${index !== items.length - 1 ? 'border-b' : ''} p-4 hover:bg-muted/50 transition-colors`}>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Archive ID</Label>
            <p className="mt-1 text-sm font-medium">
              {item.id}
            </p>
          </div>

          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Url</Label>
            <div className="mt-1 min-w-0">
              <RepositoryLink url={item.url} className="underline" />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Text</Label>
            <div className="mt-1 text-sm text-foreground">
              {item.text ? <TruncatedText text={item.text} maxChars={150} /> : <p>-</p>}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Date Added</Label>
            <p className="mt-1 text-sm text-foreground">
              {item.date_added ? formatDate(item.date_added) : '-'}
            </p>
          </div>

          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Date Posted</Label>
            <p className="mt-1 text-sm text-foreground">
              {item.date_posted ? formatDate(item.date_posted) : '-'}
            </p>
          </div>

          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">Date Archived</Label>
            <p className="mt-1 text-sm text-foreground">
              {item.date_archived ? formatDate(item.date_archived) : '-'}
            </p>
          </div>
        </div>
      </div>
    ))
  );

  return (
    <>
      {!isApiReady ? renderApiNotReady() :
       loading ? renderLoadingSkeleton() :
       totalItems === 0 || items.length === 0 ? renderEmptyState() :
       renderCards()}
    </>
  );
}
