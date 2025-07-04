import { RepositoryMobileViewProps } from '../types/repositoryList';
import { TruncatedText } from './TruncatedText';
import { formatDate } from '../utils/date-format';

export function RepositoryMobileView({
  repositories,
  loading,
  isApiReady,
  totalItems,
  itemsPerPage,
  searchTerm
}: RepositoryMobileViewProps) {
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
      {searchTerm && repositories.length === 0 ? 'No matching results found' : 'No data available'}
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
    repositories.map((repo) => (
      <div key={repo.id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</span>
          <div className="mt-1 text-sm text-gray-900 dark:text-white">
            {repo.id}
          </div>
        </div>

        <div className="mb-3">
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
      
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Text</span>
          <div className="mt-1 text-sm text-gray-900 dark:text-white">
            <TruncatedText text={repo.text} maxChars={150} />
          </div>
        </div>

        <div className="mb-3">
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
    ))
  );

  return (
    <>
      {!isApiReady ? renderApiNotReady() : 
       loading ? renderLoadingSkeleton() : 
       totalItems === 0 || repositories.length === 0 ? renderEmptyState() : 
       renderRepositoryCards()}
    </>
  );
}