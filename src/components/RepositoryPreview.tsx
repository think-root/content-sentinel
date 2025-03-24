import { Repository } from '../types';
import { formatDate } from '../utils/date';

interface RepositoryPreviewProps {
  title: string;
  repository?: Repository;
  loading: boolean;
}

export function RepositoryPreview({ title, repository, loading }: RepositoryPreviewProps) {

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {title === "Latest post" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h2>
        </div>
        {!loading && repository && (
          <div className="flex flex-col items-end text-xs text-gray-500 dark:text-gray-400">
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

      {loading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      ) : repository ? (
        <div>
          <a 
            href={repository.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm mb-2 block"
          >
            {repository.url.replace('https://github.com/', '')}
          </a>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{repository.text}</p>

        </div>
      ) : (
        <div className="text-gray-500 dark:text-gray-400 text-sm">
          No data available
        </div>
      )}
    </div>
  );
}
