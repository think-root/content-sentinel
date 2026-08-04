import { memo, useState } from 'react';
import { Archive, CalendarClock, Eye } from 'lucide-react';
import { archiveOldRepositories } from '@/api';
import type {
  ArchiveOldRepositoriesProps,
  ArchiveOldRepositoriesResponse,
  ArchiveOperationItem,
} from '@/types/archive';
import { DEFAULT_ARCHIVE_DAYS } from '@/utils/archiveUtils';
import { formatDate } from '@/utils/date-format';
import { useRepositoryLocalStorage } from '@/hooks/useRepositoryLocalStorage';
import { toast } from '@/components/ui/common/toast-config';
import { ConfirmDialog } from '@/components/ui/common/confirm-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/base/table';
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card';
import { Button } from '../base/button';
import { Input } from '../base/input';
import { Label } from '../base/label';
import { Badge } from '../common/badge';

const toastOptions = {
  duration: 4000,
};

type PreviewData = ArchiveOldRepositoriesResponse['data'];

/**
 * Memoized on the items array so editing the days field does not re-render the rows.
 * A preview can be hundreds of entries, each formatting a date - re-rendering them per keystroke
 * makes the input lag.
 *
 * The whole list is rendered inside a fixed-height scroll box. The scrollbar is left native so it
 * matches the page's own; the color-scheme declaration in index.css makes it dark in dark theme.
 */
const PreviewTable = memo(function PreviewTable({ items }: { items: ArchiveOperationItem[] }) {
  return (
    <div className="max-h-[420px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {/* Sticky so the columns stay labelled while scrolling a long preview */}
            <TableHead className="sticky top-0 z-10 h-10 bg-card">Repository</TableHead>
            <TableHead className="sticky top-0 z-10 h-10 w-[200px] bg-card text-right">Date Posted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.id ?? item.url}-${index}`}>
              <TableCell className="py-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:text-primary/80 break-all"
                >
                  {item.url}
                </a>
              </TableCell>
              <TableCell className="py-2 text-right text-muted-foreground whitespace-nowrap">
                {item.date_posted ? formatDate(item.date_posted) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

export function ArchiveOldRepositories({ isApiReady, onArchived }: ArchiveOldRepositoriesProps) {
  const { getStoredValue, setStoredValue } = useRepositoryLocalStorage();
  const [days, setDays] = useState<string>(
    String(getStoredValue('archiveOlderThanDays', DEFAULT_ARCHIVE_DAYS))
  );
  // The preview is kept in state so the real run does not need a second dry-run request
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewDays, setPreviewDays] = useState<number | null>(null);
  const [pending, setPending] = useState<'preview' | 'archive' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const parsedDays = Number(days);
  const daysError = !Number.isInteger(parsedDays) || parsedDays < 1
    ? 'Days must be a whole number greater than 0'
    : null;

  const handleDaysChange = (value: string) => {
    setDays(value);
    // The preview stays on screen while the field is edited - it is only marked stale (see
    // isPreviewCurrent), which is what keeps it from authorizing a run for a different cutoff

    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 1) {
      setStoredValue('archiveOlderThanDays', parsed);
    }
  };

  const handlePreview = async () => {
    if (daysError || pending) return;

    try {
      setPending('preview');
      const response = await archiveOldRepositories(parsedDays, true);
      setPreview(response.data);
      setPreviewDays(parsedDays);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to preview old repositories';
      toast.error(message, { ...toastOptions, id: 'archive-old-preview-error' });
    } finally {
      setPending(null);
    }
  };

  const handleArchive = async () => {
    // previewDays !== parsedDays means the field was edited after the preview - never archive that
    if (daysError || pending || preview === null || previewDays !== parsedDays) return;

    try {
      setPending('archive');
      const response = await archiveOldRepositories(parsedDays, false);
      const archivedCount = response.data?.archived_count ?? 0;

      toast.success(
        archivedCount === 1
          ? 'Archived 1 repository'
          : `Archived ${archivedCount} repositories`,
        { ...toastOptions, id: 'archive-old' }
      );

      setPreview(null);
      setPreviewDays(null);
      await onArchived();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to archive old repositories';
      toast.error(message, { ...toastOptions, id: 'archive-old-error' });
    } finally {
      setPending(null);
    }
  };

  const isPreviewCurrent = preview !== null && previewDays === parsedDays;
  const previewCount = preview?.archived_count ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center p-6">
        <CalendarClock className="h-5 w-5 text-muted-foreground mr-2" />
        <CardTitle className="text-lg">Archive Old Posts</CardTitle>
      </CardHeader>

      <CardContent className="px-6 pb-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Moves published repositories to the archive based on their publication date. Preview first to
          see exactly what would be archived.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="sm:max-w-[220px] flex-1">
            <Label className="mb-2">Older than (days)</Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={days}
              onChange={(e) => handleDaysChange(e.target.value)}
              disabled={!isApiReady || pending !== null}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={!isApiReady || !!daysError || pending !== null}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {pending === 'preview' ? 'Loading...' : 'Preview'}
            </Button>

            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!isApiReady || !!daysError || pending !== null || !isPreviewCurrent || previewCount === 0}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              {pending === 'archive'
                ? 'Archiving...'
                : isPreviewCurrent && previewCount > 0
                  ? `Archive ${previewCount}`
                  : 'Archive'}
            </Button>
          </div>
        </div>

        {daysError && <p className="text-xs text-destructive">{daysError}</p>}

        {!isApiReady && (
          <p className="text-sm text-muted-foreground">
            Archiving is unavailable because API keys are not configured
          </p>
        )}

        {preview !== null && (
          previewCount === 0 ? (
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-4 text-sm text-foreground">
              No published repositories older than {previewDays} days
            </div>
          ) : (
            <div className={`rounded-lg border overflow-hidden ${isPreviewCurrent ? '' : 'opacity-60'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">{previewCount}</Badge>
                  <span className="text-sm font-medium">
                    {previewCount === 1 ? 'repository' : 'repositories'} would be archived
                  </span>
                </div>
                {isPreviewCurrent ? (
                  <span className="text-xs text-muted-foreground">
                    published more than {previewDays} days ago &middot; oldest first
                  </span>
                ) : (
                  <span className="text-xs text-warning">
                    This preview is for {previewDays} days &middot; press Preview to refresh
                  </span>
                )}
              </div>

              <PreviewTable items={preview!.archived} />
            </div>
          )
        )}
      </CardContent>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Archive Old Posts"
        message={`Archive ${previewCount} published ${previewCount === 1 ? 'repository' : 'repositories'} older than ${parsedDays} days? They will be removed from Posts and cannot be restored from the dashboard.`}
        confirmText="Archive"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => {
          setShowConfirm(false);
          handleArchive();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </Card>
  );
}
