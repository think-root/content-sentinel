import { RefreshCw } from 'lucide-react';
import { formatDate } from '@/utils/date-format';
import type { CronJobHistory } from '@/api/maestro';
import { getHistoryEntryKey, getRetryPlan, type RetryPlan } from '@/utils/message-retry';
import { TruncatedText } from '@/components/ui/common/truncated-text';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/base/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/base/table";
import { Button } from "@/components/ui/base/button";
import { Badge } from "@/components/ui/common/badge";
import { Skeleton } from "@/components/ui/common/skeleton";
import { cn } from "@/lib/utils";

interface CronHistoryListProps {
  history: CronJobHistory[];
  loading: boolean;
  retryingKey: string | null;
  retriedKeys: string[];
  onRetry: (entry: CronJobHistory, plan: RetryPlan) => void;
}

const HistoryTableHeader = () => (
  <TableHeader>
    <TableRow>
      <TableHead className="w-1/6">Name</TableHead>
      <TableHead className="w-1/5">Date</TableHead>
      <TableHead className="w-1/6">Status</TableHead>
      <TableHead className="w-5/12">Output</TableHead>
      <TableHead className="w-12"></TableHead>
    </TableRow>
  </TableHeader>
);

const StatusBadge = ({ status }: { status: number }) => (
  <Badge
    variant={status === 1 ? "success" : status === 2 ? "warning" : "destructive"}
    className="text-xs"
  >
    {status === 1 ? 'Success' : status === 2 ? 'Partial' : 'Failed'}
  </Badge>
);

export const CronHistoryList = ({
  history,
  loading,
  retryingKey,
  retriedKeys,
  onRetry,
}: CronHistoryListProps) => {
  const renderRetryButton = (entry: CronJobHistory, variant: 'desktop' | 'mobile') => {
    const plan = getRetryPlan(entry);
    const key = getHistoryEntryKey(entry);
    if (!plan || retriedKeys.includes(key)) {
      return null;
    }

    const isRetrying = retryingKey === key;
    const label = `Publish to ${plan.failed.join(', ')}`;

    const button = (
      <Button
        variant="ghost"
        size={variant === 'desktop' ? 'icon' : 'sm'}
        onClick={() => onRetry(entry, plan)}
        disabled={retryingKey !== null}
        aria-label={label}
        title={label}
        className={variant === 'desktop'
          ? 'h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50'
          : 'flex items-center gap-2'}
      >
        <RefreshCw className={cn('h-4 w-4', isRetrying && 'animate-spin')} />
        {variant === 'mobile' && <span>{isRetrying ? 'Sending...' : 'Publish again'}</span>}
      </Button>
    );

    if (variant === 'mobile') {
      return button;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{button}</span>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  if (loading && history.length === 0) {
    return (
      <div className="overflow-x-auto">
        <div className="md:block hidden">
          <Table>
            <HistoryTableHeader />
            <TableBody>
              {[1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-1/2" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-1/4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-1/2" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="md:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border rounded-lg p-4 mb-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="md:block hidden">
        <Table>
          <HistoryTableHeader />

          {history.length > 0 ? (
            <TableBody>
              {history.map((entry, index) => (
                <TableRow key={index} className="group">
                  <TableCell className="font-medium">{entry.name}</TableCell>
                  <TableCell>
                    <div className="overflow-hidden">
                      <p className="whitespace-normal break-words">{formatDate(entry.timestamp)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell>
                    <div className="overflow-hidden">
                      <TruncatedText text={entry.output || 'None'} maxChars={65} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      {renderRetryButton(entry, 'desktop')}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="text-muted-foreground text-sm py-4">
                    No data available
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      </div>

      <div className="md:hidden block">
        {history.length > 0 ? (
          history.map((entry, index) => (
            <div key={index} className={`bg-card border ${index !== history.length - 1 ? 'border-b' : ''} p-4 group hover:bg-muted/50`}>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Name</span>
                  <div className="mt-1 text-sm text-foreground">{entry.name}</div>
                </div>

                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Date</span>
                  <div className="mt-1 text-sm text-foreground">
                    <p className="whitespace-normal break-words">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={entry.status} />
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Output</span>
                  <div className="mt-1 text-sm text-foreground">
                    <TruncatedText text={entry.output || 'None'} maxChars={65} />
                  </div>
                </div>

                {renderRetryButton(entry, 'mobile')}
              </div>
            </div>
          ))
        ) : (
          <div className="text-muted-foreground text-sm text-center py-4">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};
