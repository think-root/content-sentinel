import { RepositoryTableProps } from '../types/repositoryList';
import { TruncatedText } from './TruncatedText';
import { formatDate } from '../utils/date-format';

export function RepositoryTable({
  repositories,
  loading,
  isApiReady,
  totalItems,
  itemsPerPage,
  searchTerm
}: RepositoryTableProps) {
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
        {searchTerm && repositories.length === 0 ? 'No matching results found' : 'No data available'}
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
    repositories.map((repo) => (
      <tr key={repo.id}>
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
          <TruncatedText text={repo.text} maxChars={150} />
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
         totalItems === 0 || repositories.length === 0 ? renderEmptyState() : 
         renderRepositoryRows()}
      </tbody>
    </table>
  );
}