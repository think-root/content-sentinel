import { useState, useEffect, useRef } from 'react';
import { RepositoryTableProps } from '@/types/repositoryList';
import { Repository } from '@/types';
import { formatDate } from '@/utils/date-format';
import { deleteRepository, updateRepositoryText } from '@/api';
import { Pencil, Check, X, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from '../common/toast-config';
import { ConfirmDialog } from '../common/confirm-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/base/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/base/tooltip";
import { Button } from "@/components/ui/base/button";
import { Skeleton } from "@/components/ui/common/skeleton";

const toastOptions = {
  duration: 4000,
};

function TruncatedText({ text, maxChars = 150 }: { text: string; maxChars?: number }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return <p>-</p>;
  
  const hasMoreText = text.length > maxChars;
  const displayText = expanded ? text : hasMoreText ? text.substring(0, maxChars) + '...' : text;

  return (
    <div>
      <p className="whitespace-pre-line break-words leading-relaxed tracking-wide">{displayText}</p>
      {hasMoreText && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs h-6 px-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

export function RepositoryTable({
  repositories,
  loading,
  isApiReady,
  totalItems,
  itemsPerPage,
  searchTerm,
  onRepositoryUpdate
}: RepositoryTableProps) {
  const [localRepositories, setLocalRepositories] = useState<Repository[]>(repositories);
  const [editingText, setEditingText] = useState<{ id: number; text: string } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textError, setTextError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Repository | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingText) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 50);
    }
  }, [editingText]);

  useEffect(() => {
    setLocalRepositories(repositories);
  }, [repositories]);

  const startEditingText = (repo: Repository) => {
    setEditingText({ id: repo.id, text: repo.text });
    setTextInput(repo.text);
    setTextError(null);
  };

  const handleTextChange = (value: string) => {
    setTextInput(value);
    if (value.length > 1000) {
      setTextError('Text cannot exceed 1000 characters');
    } else if (value.trim().length === 0) {
      setTextError('Text cannot be empty');
    } else {
      setTextError(null);
    }
  };

  const validateAndSaveText = async () => {
    if (!editingText) return;
    
    if (!textInput.trim()) {
      setTextError('Text cannot be empty');
      return;
    }
    
    if (textInput.length > 1000) {
      setTextError('Text cannot exceed 1000 characters');
      return;
    }

    const previousText = editingText.text;

    try {
      // Optimistic update
      setLocalRepositories(prevRepos => 
        prevRepos.map(repo => 
          repo.id === editingText.id 
            ? { ...repo, text: textInput }
            : repo
        )
      );
      
      await updateRepositoryText({ id: editingText.id }, textInput);
      setEditingText(null);
      setTextError(null);
      
      toast.success(`Repository text updated successfully`, {
        ...toastOptions,
        id: `text-update-${editingText.id}`
      });

      // Refresh data
      if (onRepositoryUpdate) {
        onRepositoryUpdate();
      }
    } catch {
      // Rollback on error
      setLocalRepositories(prevRepos => 
        prevRepos.map(repo => 
          repo.id === editingText.id 
            ? { ...repo, text: previousText }
            : repo
        )
      );
      toast.error('Failed to connect to Content Alchemist API', {
        ...toastOptions,
        id: 'content-alchemist-error'
      });
    }
  };

  const handleDeleteRepository = async (repo: Repository) => {
    try {
      // Optimistic update - remove from local state
      setLocalRepositories(prevRepos => 
        prevRepos.filter(r => r.id !== repo.id)
      );
      
      await deleteRepository({ id: repo.id });
      setShowDeleteConfirm(null);
      
      toast.success(`Repository deleted successfully`, {
        ...toastOptions,
        id: `delete-${repo.id}`
      });

      // Refresh data
      if (onRepositoryUpdate) {
        onRepositoryUpdate();
      }
    } catch {
      // Rollback on error
      setLocalRepositories(repositories);
      toast.error('Failed to connect to Content Alchemist API', {
        ...toastOptions,
        id: 'content-alchemist-error'
      });
    }
  };

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
      </TableRow>
    ))
  );

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
        {searchTerm && localRepositories.length === 0 ? 'No matching results found' : 'No data available'}
      </TableCell>
    </TableRow>
  );

  const renderApiNotReady = () => (
    <TableRow>
      <TableCell colSpan={5} className="text-center py-4 text-sm text-muted-foreground">
        Data could not be loaded because API keys are not configured
      </TableCell>
    </TableRow>
  );

  const renderRepositoryRows = () => (
    localRepositories.map((repo) => (
      <TableRow key={repo.id} className="group">
        <TableCell className="font-medium">
          {repo.id}
        </TableCell>
        <TableCell>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80"
          >
            {repo.url.replace('https://github.com/', '')}
          </a>
        </TableCell>
        <TableCell>
          {editingText?.id === repo.id ? (
            <div className="space-y-2 w-full min-h-[36px]">
              <div className="flex items-center space-x-2">
                <div className="flex-1 flex items-center space-x-2">
                  <textarea
                    value={textInput}
                    autoFocus
                    onChange={(e) => handleTextChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        validateAndSaveText();
                      } else if (e.key === 'Escape') {
                        setEditingText(null);
                        setTextError(null);
                      }
                    }}
                    className={`w-full px-2 py-1 rounded border ${textError
                      ? 'border-destructive'
                      : 'border-input'
                      } bg-background text-foreground text-sm focus:outline-none resize-none`}
                    placeholder="Repository text"
                    ref={textInputRef}
                    style={{ height: '130px' }}
                  />
                  <div className="flex items-center space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={validateAndSaveText}
                            className="h-8 w-8 text-success hover:text-success/80"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save text</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingText(null);
                              setTextError(null);
                            }}
                            className="h-8 w-8 text-destructive hover:text-destructive/80"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Cancel</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              {textError && (
                <div className="flex items-center text-xs text-destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {textError}
                </div>
              )}
            </div>
          ) : (
           <div className="flex items-center min-h-[36px]">
             <div className="flex-1 mr-2">
               <TruncatedText text={repo.text} maxChars={150} />
             </div>
             <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => startEditingText(repo)}
                       className="h-8 w-8 text-muted-foreground hover:text-foreground"
                     >
                       <Pencil className="h-4 w-4" />
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent>Edit text</TooltipContent>
                 </Tooltip>
               </TooltipProvider>
               <TooltipProvider>
                 <Tooltip>
                   <TooltipTrigger asChild>
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => setShowDeleteConfirm(repo)}
                       className="h-8 w-8 text-muted-foreground hover:text-destructive"
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </TooltipTrigger>
                   <TooltipContent>Delete repository</TooltipContent>
                 </Tooltip>
               </TooltipProvider>
             </div>
           </div>
          )}
        </TableCell>
        <TableCell>
          <div className="overflow-hidden">
            <p className="whitespace-normal break-words">{repo.date_added ? formatDate(repo.date_added) : '-'}</p>
          </div>
        </TableCell>
        <TableCell>
          <div className="overflow-hidden">
            <p className="whitespace-normal break-words">{repo.date_posted ? formatDate(repo.date_posted) : '-'}</p>
          </div>
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/12">ID</TableHead>
            <TableHead className="w-1/6">Url</TableHead>
            <TableHead className="w-2/6">Text</TableHead>
            <TableHead className="w-1/6">Date Added</TableHead>
            <TableHead className="w-1/6">Date Posted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isApiReady ? renderApiNotReady() :
           loading ? renderLoadingSkeleton() :
           totalItems === 0 || localRepositories.length === 0 ? renderEmptyState() :
           renderRepositoryRows()}
        </TableBody>
      </Table>

      <ConfirmDialog
        isOpen={showDeleteConfirm !== null}
        title="Delete Repository"
        message="Are you sure you want to delete this repository? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (showDeleteConfirm) {
            handleDeleteRepository(showDeleteConfirm);
          }
        }}
        onCancel={() => setShowDeleteConfirm(null)}
      />
    </>
  );
}