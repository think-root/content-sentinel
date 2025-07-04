import { useState, useEffect, useRef } from 'react';
import { RepositoryMobileViewProps } from '../types/repositoryList';
import { Repository } from '../types';
import { TruncatedText } from './TruncatedText';
import { formatDate } from '../utils/date-format';
import { deleteRepository, updateRepositoryText } from '../api';
import { Pencil, Check, X, Trash2, AlertCircle } from 'lucide-react';
import { toast, ToastOptions } from 'react-hot-toast';
import { ConfirmDialog } from './ConfirmDialog';

const toastOptions: ToastOptions = {
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
      <div key={index} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-8 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>
        <div className="mb-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
        <div className="mb-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    ))
  );

  const renderEmptyState = () => (
    <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      {searchTerm && localRepositories.length === 0 ? 'No matching results found' : 'No data available'}
    </div>
  );

  const renderApiNotReady = () => (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
        Data could not be loaded because API keys are not configured
      </div>
    </div>
  );

  const renderRepositoryCards = () => (
    localRepositories.map((repo) => (
      <div key={repo.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 group hover:bg-gray-50 dark:hover:bg-gray-750">
        <div className="space-y-3">
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</span>
            <div className="mt-1 text-sm text-gray-900 dark:text-white">
              {repo.id}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Url</span>
            <div className="mt-1">
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
              >
                {repo.url.replace('https://github.com/', '')}
              </a>
            </div>
          </div>
        
          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Text</span>
            <div className="mt-1">
              {editingText?.id === repo.id ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
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
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-gray-300 dark:border-gray-600'
                        } bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none resize-none`}
                      placeholder="Repository text"
                      ref={textInputRef}
                      style={{ height: '130px' }}
                    />
                    <button
                      onClick={validateAndSaveText}
                      className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                      title="Save text"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingText(null);
                        setTextError(null);
                      }}
                      className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {textError && (
                    <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {textError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="flex-1 text-sm text-gray-900 dark:text-white mr-2">
                    <TruncatedText text={repo.text} maxChars={150} />
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditingText(repo)}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                      title="Edit text"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(repo)}
                      className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      title="Delete repository"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date Added</span>
            <div className="mt-1 text-sm text-gray-900 dark:text-white">
              {repo.date_added ? formatDate(repo.date_added) : '-'}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date Posted</span>
            <div className="mt-1 text-sm text-gray-900 dark:text-white">
              {repo.date_posted ? formatDate(repo.date_posted) : '-'}
            </div>
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