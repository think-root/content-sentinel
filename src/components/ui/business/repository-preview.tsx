import { Repository } from '@/types';
import { formatDate } from '@/utils/date-format';
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card';
import { Button } from '../base/button';
import { Badge } from '../common/badge';
import { Skeleton } from '../common/skeleton';

interface RepositoryPreviewProps {
  title: string;
  repository?: Repository;
  loading: boolean;
  isApiReady?: boolean;
}

export function RepositoryPreview({ title, repository, loading, isApiReady = true }: RepositoryPreviewProps) {
  const Icon = title === "Latest post" ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground mr-2">
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground mr-2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {Icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          
          {!loading && repository && (
            <div className="flex flex-col items-end text-xs text-muted-foreground">
              <div className="flex flex-col space-y-1 items-end">
                {repository.date_posted && (
                  <div className="flex items-center space-x-1">
                    <span className="hidden sm:inline">Published at:</span>
                    <span className="sm:hidden">Published:</span>
                    <span>{formatDate(repository.date_posted)}</span>
                  </div>
                )}
                {repository.date_added && (
                  <div className="flex items-center space-x-1">
                    <span className="hidden sm:inline">Added at:</span>
                    <span className="sm:hidden">Added:</span>
                    <span>{formatDate(repository.date_added)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!isApiReady ? (
          <div className="text-muted-foreground text-sm">
            <Badge variant="outline" className="mb-2">
              API Not Configured
            </Badge>
            <p>Data could not be loaded because API keys are not configured</p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ) : repository ? (
          <div className="space-y-3">
            <Button
              variant="link"
              className="p-0 h-auto text-primary hover:text-primary/80 text-sm font-normal no-underline hover:no-underline underline-offset-0"
              asChild
            >
              <a 
                href={repository.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {repository.url.replace('https://github.com/', '')}
              </a>
            </Button>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              {repository.text}
            </p>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}