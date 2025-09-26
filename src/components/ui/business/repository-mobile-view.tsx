import { useState, useEffect, useRef } from 'react';
import { RepositoryMobileViewProps } from '@/types/repositoryList';
import { Repository } from '@/types';
import { TruncatedText } from '@/components/ui/common/truncated-text';
import { formatDate } from '@/utils/date-format';
import { deleteRepository, updateRepositoryText } from '@/api';
import { Pencil, Check, X, Trash2, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/common/toast-config';
import { ConfirmDialog } from '@/components/ui/common/confirm-dialog';
import { Button } from '../base/button';
import { Label } from '../base/label';

const toastOptions = {
  duration: 4000,
};

export function RepositoryMobileView({
  repositories,
  loading,
  isApiReady,
  totalItems,
  itemsPerPage,
  searchTerm,
  onRepositoryUpdate
}: RepositoryMobileViewProps) {
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
        {searchTerm && localRepositories.length === 0 ? 'No matching results found' : 'No data available'}
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

  const renderRepositoryCards = () => (
    localRepositories.map((repo, index) => (
      <div key={repo.id} className={`bg-card border ${index !== localRepositories.length - 1 ? 'border-b' : ''} p-4 group hover:bg-muted/50 transition-colors`}>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium uppercase text-muted-foreground">ID</Label>
              <p className="mt-1 text-sm font-medium">
                {repo.id}
              </p>
            </div>

            <div>
              <Label className="text-xs font-medium uppercase text-muted-foreground">Url</Label>
              <div className="mt-1">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 text-sm underline"
                >
                  {repo.url.replace('https://github.com/', '')}
                </a>
              </div>
            </div>
          
            <div>
              <Label className="text-xs font-medium uppercase text-muted-foreground">Text</Label>
              <div className="mt-1">
                {editingText?.id === repo.id ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
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
                        className={`flex-1 px-2 py-1 rounded border ${textError
                          ? 'border-destructive'
                          : 'border-input'
                          } bg-background text-foreground text-sm focus:outline-none resize-none`}
                        placeholder="Repository text"
                        ref={textInputRef}
                        style={{ height: '130px' }}
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={validateAndSaveText}
                          className="h-8 w-8 text-success hover:text-success/80"
                          title="Save text"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingText(null);
                            setTextError(null);
                          }}
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
                  <div className="flex items-center">
                    <div className="flex-1 text-sm text-foreground mr-2">
                      <TruncatedText text={repo.text} maxChars={150} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditingText(repo)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Edit text"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDeleteConfirm(repo)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Delete repository"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-medium uppercase text-muted-foreground">Date Added</Label>
              <p className="mt-1 text-sm text-foreground">
                {repo.date_added ? formatDate(repo.date_added) : '-'}
              </p>
            </div>

            <div>
              <Label className="text-xs font-medium uppercase text-muted-foreground">Date Posted</Label>
              <p className="mt-1 text-sm text-foreground">
                {repo.date_posted ? formatDate(repo.date_posted) : '-'}
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
       totalItems === 0 || localRepositories.length === 0 ? renderEmptyState() :
       renderRepositoryCards()}

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