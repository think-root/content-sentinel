import { useState, useEffect, useRef } from 'react';
import { RepositoryTableProps } from '../types/repositoryList';
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
      <tr key={index}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </td>
        <td className="px-6 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </td>
      </tr>
    ))
  );

  const renderEmptyState = () => (
    <tr>
      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {searchTerm && localRepositories.length === 0 ? 'No matching results found' : 'No data available'}
      </td>
    </tr>
  );

  const renderApiNotReady = () => (
    <tr>
      <td colSpan={5} className="px-6 py-4">
        <div className="text-gray-500 dark:text-gray-400 text-sm text-center">
          Data could not be loaded because API keys are not configured
        </div>
      </td>
    </tr>
  );

  const renderRepositoryRows = () => (
    localRepositories.map((repo) => (
      <tr key={repo.id} className="group">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {repo.id}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {repo.url.replace('https://github.com/', '')}
          </a>
        </td>
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
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
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none resize-none`}
                    placeholder="Repository text"
                    ref={textInputRef}
                    style={{ height: '130px' }}
                  />
                  <div className="flex items-center space-x-1">
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
                </div>
              </div>
              {textError && (
                <div className="flex items-center text-xs text-red-600 dark:text-red-400">
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
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {repo.date_added ? formatDate(repo.date_added) : '-'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {repo.date_posted ? formatDate(repo.date_posted) : '-'}
        </td>
      </tr>
    ))
  );

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">
              ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
              Url
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/6">
              Text
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
              Date Added
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">
              Date Posted
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {!isApiReady ? renderApiNotReady() :
           loading ? renderLoadingSkeleton() :
           totalItems === 0 || localRepositories.length === 0 ? renderEmptyState() :
           renderRepositoryRows()}
        </tbody>
      </table>

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