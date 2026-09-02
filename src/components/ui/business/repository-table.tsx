import { useState, useEffect, useRef } from 'react';
import { RepositoryTableProps } from '@/types/repositoryList';
import { Repository } from '@/types';
import { formatDate } from '@/utils/date-format';
import { archiveRepositories, deleteRepository, promoteRepositoryToNext, updateRepositoryText } from '@/api';
import { Pencil, Check, X, Trash2, AlertCircle, Archive, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { describeArchiveFailure, isStaleArchiveFailure, summarizeArchiveResult } from '@/utils/archiveUtils';
import { toast } from '../common/toast-config';
import { ConfirmDialog } from '../common/confirm-dialog';
import { PublishRepositoryDialog } from './publish-repository-dialog';
import { enabledIntegrations } from '@/utils/message-publish';
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
import { RepositoryLink } from "@/components/ui/common/repository-link";

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
  nextPostId,
  integrations,
  integrationsLoading,
  onRepositoryUpdate,
  onRepositoryArchived
}: RepositoryTableProps) {
  const [localRepositories, setLocalRepositories] = useState<Repository[]>(repositories);
  const [editingText, setEditingText] = useState<{ id: number; text: string } | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textError, setTextError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Repository | null>(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState<Repository | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [publishTarget, setPublishTarget] = useState<Repository | null>(null);
  // One dialog instance serves every row, so retargeting it while it is working
  // would leave a request writing its outcome into somebody else's repository.
  const [publishBusy, setPublishBusy] = useState(false);
  const [promotingId, setPromotingId] = useState<number | null>(null);
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

  const handleArchiveRepository = async (repo: Repository) => {
    if (archivingId !== null) return;

    try {
      setArchivingId(repo.id);
      // Optimistic update - archiving moves the row out of the repositories table
      setLocalRepositories(prevRepos =>
        prevRepos.filter(r => r.id !== repo.id)
      );

      const result = await archiveRepositories({ ids: [repo.id] });
      const { archivedCount, firstFailure } = summarizeArchiveResult(result);

      if (archivedCount > 0) {
        toast.success(`Repository archived successfully`, {
          ...toastOptions,
          id: `archive-${repo.id}`
        });
      } else if (firstFailure) {
        // The row's posted flag can be stale, so put it back unless the server says it is already gone
        if (!isStaleArchiveFailure(firstFailure)) {
          setLocalRepositories(repositories);
        }
        toast.error(describeArchiveFailure(firstFailure), {
          ...toastOptions,
          id: `archive-error-${repo.id}`
        });
      } else {
        // Nothing archived and nothing reported as failed - never treat that as success, or the row
        // disappears as if it had been archived
        setLocalRepositories(repositories);
        toast.error(result.message || 'Failed to archive repository', {
          ...toastOptions,
          id: `archive-error-${repo.id}`
        });
      }

      if (onRepositoryUpdate) {
        await onRepositoryUpdate();
      }
      if (onRepositoryArchived) {
        await onRepositoryArchived();
      }
    } catch (error) {
      // Rollback on error
      setLocalRepositories(repositories);
      const message = error instanceof Error ? error.message : 'Failed to connect to Content Alchemist API';
      toast.error(message, {
        ...toastOptions,
        id: 'content-alchemist-error'
      });
    } finally {
      setArchivingId(null);
    }
  };

  const handlePromoteRepository = async (repo: Repository) => {
    if (promotingId !== null) return;

    try {
      setPromotingId(repo.id);
      // nextPostId is a render-time value, so another tab - or the cron - can have
      // moved the queue on since this row was drawn. Saying so beats closing the
      // dialog as if a promotion that never happened had succeeded.
      if (repo.posted) {
        throw new Error('Repository is already published');
      }
      if (repo.id === nextPostId) {
        throw new Error('Repository is already next in the queue');
      }
      const result = await promoteRepositoryToNext({ id: repo.id });
      // An unconfigured API answers with an error payload instead of throwing, and
      // reporting success for a request that never left the browser is a lie.
      if (result.status === 'error') {
        throw new Error(result.message);
      }

      toast.success(`Repository will be published next`, {
        ...toastOptions,
        id: `promote-${repo.id}`
      });

      if (onRepositoryUpdate) {
        await onRepositoryUpdate();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to promote repository';
      toast.error(message || 'Failed to promote repository', {
        ...toastOptions,
        id: `promote-error-${repo.id}`
      });
      // Rethrown so the publish dialog keeps itself open on a failed promotion.
      throw error;
    } finally {
      setPromotingId(null);
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
        <TableCell className="min-w-0">
          <RepositoryLink url={repo.url} />
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
                      } bg-background text-foreground text-base md:text-sm focus:outline-none resize-none`}
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
               {!repo.posted && (
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <span>
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => setPublishTarget(repo)}
                           disabled={!isApiReady || promotingId !== null || publishBusy}
                           aria-label={repo.id === nextPostId ? 'Publish (already next in the queue)' : 'Publish'}
                           className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
                         >
                           <Send className="h-4 w-4" />
                         </Button>
                       </span>
                     </TooltipTrigger>
                     <TooltipContent>
                       {repo.id === nextPostId ? 'Publish (already next in the queue)' : 'Publish'}
                     </TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
               )}
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
               {/* Only published repositories can be archived, so they get Archive instead of Delete */}
               {repo.posted ? (
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <span>
                         <Button
                           variant="ghost"
                           size="icon"
                           onClick={() => setShowArchiveConfirm(repo)}
                           disabled={archivingId !== null}
                           aria-label="Archive repository"
                           className="h-8 w-8 text-muted-foreground hover:text-warning disabled:opacity-50"
                         >
                           <Archive className="h-4 w-4" />
                         </Button>
                       </span>
                     </TooltipTrigger>
                     <TooltipContent>Archive repository</TooltipContent>
                   </Tooltip>
                 </TooltipProvider>
               ) : (
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
               )}
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

      <ConfirmDialog
        isOpen={showArchiveConfirm !== null}
        title="Archive Repository"
        message="Move this published repository to the archive? It will be removed from Posts and cannot be restored from the dashboard."
        confirmText="Archive"
        cancelText="Cancel"
        variant="warning"
        onConfirm={() => {
          if (showArchiveConfirm) {
            handleArchiveRepository(showArchiveConfirm);
          }
          setShowArchiveConfirm(null);
        }}
        onCancel={() => setShowArchiveConfirm(null)}
      />

      <PublishRepositoryDialog
        repository={publishTarget}
        isNext={publishTarget !== null && publishTarget.id === nextPostId}
        isApiReady={isApiReady}
        integrations={enabledIntegrations(integrations ?? [])}
        integrationsLoading={integrationsLoading}
        onClose={() => setPublishTarget(null)}
        onBusyChange={setPublishBusy}
        onPromote={handlePromoteRepository}
        onPublished={async () => {
          if (onRepositoryUpdate) {
            await onRepositoryUpdate();
          }
        }}
      />
    </>
  );
}
