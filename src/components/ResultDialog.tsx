import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

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

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title || 'Collect posts'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {added.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {context === 'manual' ? `Successfully added (${added.length}):` : `Successfully added (${added.length}):`}
              </h4>
              <ul className="space-y-1 text-sm">
                {added.map((repo, index) => (
                  <li 
                    key={index} 
                    className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-2 rounded-md"
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
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {context === 'manual' ? `Not added (${notAdded.length}):` : `Not added (${notAdded.length}):`}
              </h4>
              <ul className="space-y-1 text-sm">
                {notAdded.map((repo, index) => (
                  <li 
                    key={index} 
                    className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-2 rounded-md"
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
                <p className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 p-3 rounded-md">
                  No new repositories found. All trending repositories are already in the database.
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  No repositories were processed.
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
