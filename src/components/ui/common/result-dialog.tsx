import { useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../base/dialog';
import { Badge } from './badge';
import { Button } from '../base/button';

interface ResultDialogProps {
  isOpen: boolean;
  onClose: () => void;
  added: string[];
  notAdded: string[];
  errorMessages?: Record<string, string>;
  context?: 'manual' | 'collect';
  title?: string;
}

export function ResultDialog({ isOpen, onClose, added, notAdded, errorMessages, context, title }: ResultDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-lg font-medium">
            {title || 'Collect posts'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Results of repository processing
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {added.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  {added.length}
                </Badge>
                {context === 'manual' ? 'Successfully added:' : 'Successfully added:'}
              </h4>
              <ul className="space-y-1 text-sm">
                {added.map((repo: string, index: number) => (
                  <li 
                  key={index} 
                    className="bg-success/20 text-success p-2 rounded-md"
                  >
                  <a 
                    href={repo} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {repo.replace('https://github.com/', '')}
                  </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {notAdded.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  {notAdded.length}
                </Badge>
                {context === 'manual' ? 'Not added:' : 'Not added:'}
              </h4>
              <ul className="space-y-1 text-sm">
                {notAdded.map((repo, index) => (
                  <li 
                    key={index} 
                    className="bg-destructive/20 text-destructive p-2 rounded-md"
                  >
                    <a
                      href={repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {repo.replace('https://github.com/', '')}
                    </a>
                    <span className="text-xs ml-2">
                      ({errorMessages?.[repo] || "Repository already exists in database"})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {added.length === 0 && notAdded.length === 0 && (
            <div className="text-center py-4">
              {context === 'collect' ? (
                <p className="bg-warning/10 text-warning p-3 rounded-md">
                  No new repositories found. All trending repositories are already in the database.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  No repositories were processed.
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t border-border pt-4">
          <Button
            onClick={onClose}
            className="px-4 py-2"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}