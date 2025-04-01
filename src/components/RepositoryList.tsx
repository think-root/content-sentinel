import { useState, useEffect } from 'react';
import { Repository } from '../types';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUp, ArrowDown, X } from 'lucide-react';
import { formatDate } from '../utils/date-format';

interface RepositoryListProps {
  repositories: Repository[];
  fetchRepositories: (posted?: boolean, append?: boolean, fetchAll?: boolean, itemsPerPage?: number, sortBy?: 'id' | 'date_added' | 'date_posted', sortOrder?: 'ASC' | 'DESC', page?: number) => Promise<void>;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
}

function TruncatedText({ text, maxChars = 150 }: { text: string, maxChars?: number }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return <p>-</p>;
  
  const hasMoreText = text.length > maxChars;
  const displayText = expanded ? text : hasMoreText ? text.substring(0, maxChars) + '...' : text;
  
  return (
    <div>
      <p className="whitespace-pre-line break-words leading-relaxed tracking-wide">{displayText}</p>
      {hasMoreText && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-xs flex items-center"
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
        </button>
      )}
    </div>
  );
}

export function RepositoryList({ repositories, fetchRepositories, totalItems, totalPages, currentPage: initialPage, pageSize: initialPageSize, loading }: RepositoryListProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('dashboardExpanded');
    return saved === null ? true : saved === 'true';
  });

  const [searchTerm, setSearchTerm] = useState(() => {
    const saved = localStorage.getItem('dashboardSearchTerm');
    return saved || '';
  });
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'posted' | 'unposted'>(() => {
    const saved = localStorage.getItem('dashboardStatusFilter');
    return (saved as 'all' | 'posted' | 'unposted') || 'all';
  });
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('dashboardItemsPerPage');
    return saved ? parseInt(saved, 10) : initialPageSize;
  });
  
  const [sortBy, setSortBy] = useState<'id' | 'date_added' | 'date_posted'>(() => {
    const saved = localStorage.getItem('dashboardSortBy');
    return (saved as 'id' | 'date_added' | 'date_posted') || 'date_added';
  });

  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(() => {
    const saved = localStorage.getItem('dashboardSortOrder');
    return (saved as 'ASC' | 'DESC') || 'DESC';
  });
  
  const toggleExpanded = () => {
    const newValue = !isExpanded;
    setIsExpanded(newValue);
    localStorage.setItem('dashboardExpanded', newValue.toString());
  };

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    setItemsPerPage(initialPageSize);
  }, [initialPageSize]);

  const handleStatusFilterChange = (value: 'all' | 'posted' | 'unposted') => {
    if (loading) return;
    
    setStatusFilter(value);
    localStorage.setItem('dashboardStatusFilter', value);
    setCurrentPage(1);
    
    const posted = value === 'all' ? undefined : value === 'posted';
    fetchRepositories(posted, false, false, itemsPerPage, sortBy, sortOrder, 1);
  };

  const handleItemsPerPageChange = (value: number) => {
    if (loading) return;
    
    setItemsPerPage(value);
    localStorage.setItem('dashboardItemsPerPage', value.toString());
    setCurrentPage(1);
    
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(posted, false, value === 0, value, sortBy, sortOrder, 1);
  };

  const handleSortByChange = (value: 'id' | 'date_added' | 'date_posted') => {
    if (loading) return;
    
    setSortBy(value);
    localStorage.setItem('dashboardSortBy', value);
    setCurrentPage(1);
    
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(posted, false, itemsPerPage === 0, itemsPerPage, value, sortOrder, 1);
  };

  const handleSortOrderChange = (value: 'ASC' | 'DESC') => {
    if (loading) return;
    
    setSortOrder(value);
    localStorage.setItem('dashboardSortOrder', value);
    setCurrentPage(1);
    
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(posted, false, itemsPerPage === 0, itemsPerPage, sortBy, value, 1);
  };

  const toggleSortOrder = () => {
    handleSortOrderChange(sortOrder === 'ASC' ? 'DESC' : 'ASC');
  };

  const handlePageChange = (page: number) => {
    if (loading) return;
    
    setCurrentPage(page);
    const posted = statusFilter === 'all' ? undefined : statusFilter === 'posted';
    fetchRepositories(posted, false, false, itemsPerPage, sortBy, sortOrder, page);
  };

  const filteredItems = repositories.filter(repo => {
    const matchesSearch = searchTerm === '' || 
      repo.url.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (repo.text && repo.text.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (repo.date_added && formatDate(repo.date_added).toLowerCase().includes(searchTerm.toLowerCase())) ||
      (repo.date_posted && formatDate(repo.date_posted).toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'posted' && repo.posted) || 
      (statusFilter === 'unposted' && !repo.posted);
    
    return matchesSearch && matchesStatus;
  });

  const paginatedItems = itemsPerPage === 0 ? filteredItems :
    filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div
        className="flex items-center justify-between p-6 cursor-pointer select-none"
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Posts</h2>
        </div>
        <div className="text-gray-500 dark:text-gray-400">
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>
      
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden px-6 ${
          isExpanded ? 'max-h-full opacity-100 pb-6' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by URL, Text, or Dates..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                localStorage.setItem('dashboardSearchTerm', value);
              }}
              disabled={loading}
              className="pl-10 pr-8 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm py-2 px-3 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  localStorage.removeItem('dashboardSearchTerm');
                }}
                disabled={loading}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 relative">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as 'all' | 'posted' | 'unposted')}
                disabled={loading}
                className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-2.5 pl-3 pr-8 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 w-full sm:w-36 text-center appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundPosition: 'right 0.5rem center', backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                title="Filter repositories by status"
              >
                <option value="all">All</option>
                <option value="posted">Posted</option>
                <option value="unposted">Unposted</option>
              </select>
            
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                disabled={loading}
                className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-2.5 pl-3 pr-8 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 w-full sm:w-24 text-center appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundPosition: 'right 0.5rem center', backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                title="Number of items to display per page"
              >
                <option value={0}>All</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => handleSortByChange(e.target.value as 'id' | 'date_added' | 'date_posted')}
                disabled={loading}
                className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-2.5 pl-3 pr-8 focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 w-full sm:w-36 text-center appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundPosition: 'right 0.5rem center', backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                title="Sort repositories by field"
              >
                <option value="id">ID</option>
                <option value="date_added">Date Added</option>
                <option value="date_posted">Date Posted</option>
              </select>

              <button
                onClick={toggleSortOrder}
                disabled={loading}
                className="rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm py-2.5 px-3 h-[42px] focus:border-blue-500 focus:ring-blue-500 dark:focus:ring-blue-400 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                title={sortOrder === 'ASC' ? 'Ascending order' : 'Descending order'}
              >
                {sortOrder === 'ASC'
                  ? <ArrowUp className="h-4 w-4 transition-transform duration-300" />
                  : <ArrowDown className="h-4 w-4 transition-transform duration-300" />
                }
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="md:block hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/12">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Url</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/6">Text</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Date Added</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/6">Date Posted</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
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
                ) : totalItems === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No repositories found
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((repo) => (
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
                )}
              </tbody>
            </table>
          </div>
          <div className="md:hidden block">
            {loading ? (
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
            ) : totalItems === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No repositories found
              </div>
            ) : (
              paginatedItems.map((repo) => (
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
            )}
          </div>
        </div>
      

        {totalItems > 0 && (
          <>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 md:block hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 w-full">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {itemsPerPage === 0 ? (
                    <p>Showing all <span className="font-medium">{totalItems}</span> results</p>
                  ) : (
                    <p>
                      Showing <span className="font-medium">
                        {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                      </span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                      </span>{' '}
                      of <span className="font-medium">{totalItems}</span> results
                    </p>
                  )}
                </div>

                {itemsPerPage > 0 && totalItems > itemsPerPage && (
                  <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                    
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 border ${currentPage === pageNum ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'} text-xs sm:text-sm font-medium rounded-md min-w-[30px] sm:min-w-[40px] text-center justify-center`}
                          title={`Go to page ${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 md:hidden block">
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="text-xs text-gray-700 dark:text-gray-300 w-full text-center">
                  {itemsPerPage === 0 ? (
                    <p>Showing all <span className="font-medium">{totalItems}</span> results</p>
                  ) : (
                    <p>
                      Showing <span className="font-medium">
                        {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                      </span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalItems)}
                      </span>{' '}
                      of <span className="font-medium">{totalItems}</span> results
                    </p>
                  )}
                </div>

                {itemsPerPage > 0 && totalItems > itemsPerPage && (
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1 px-4 w-full justify-center">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] justify-center flex-shrink-0"
                      title="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                    
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-2 py-1 border text-sm font-medium rounded-md min-w-[32px] justify-center flex-shrink-0 ${currentPage === pageNum
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          title={`Go to page ${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-1 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[32px] justify-center flex-shrink-0"
                      title="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
