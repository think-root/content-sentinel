import { useEffect, useState } from 'react';
import { Stats } from './components/Stats';
import { RepositoryList } from './components/RepositoryList';
import { GenerateForm } from './components/GenerateForm';
import { CronJobs } from './components/CronJobs';
import { getRepositories, manualGenerate, autoGenerate, ManualGenerateResponse } from './api';
import type { Repository } from './types';
import { X } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';

function App() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [stats, setStats] = useState({ all: 0, posted: 0, unposted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setErrorWithScroll = (errorMessage: string) => {
    setError(errorMessage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchRepositories = async (statusFilter?: boolean, page: number = 1, append: boolean = false, fetchAll: boolean = false, itemsPerPage: number = 10) => {
    try {
      if (!append) {
        setLoading(true);
      }
      
      const limit = itemsPerPage || 10;
      const response = await getRepositories(limit, statusFilter, page, fetchAll);
      
      const processedItems = response.data.items.map((item: Repository) => ({
        ...item,
        posted: Boolean(item.posted)
      }));
      
      setRepositories(processedItems);
      setStats({
        all: response.data.all,
        posted: response.data.posted,
        unposted: response.data.unposted,
      });
    } catch {
      setErrorWithScroll('Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories(undefined, 1, false, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualGenerate = async (url: string): Promise<ManualGenerateResponse> => {
    try {
      const response = await manualGenerate(url);
      if (response.status === 'ok') {
        const added = response.added || [];
        
        if (added.length > 0) {
          const scrollPosition = window.scrollY;
          await fetchRepositories();
          window.scrollTo(0, scrollPosition);
        }
      }
      return response;
    } catch {
      setErrorWithScroll('Failed to generate repository');
      return { status: 'error' };
    }
  };

  const handleAutoGenerate = async (maxRepos: number, since: string, spokenLanguageCode: string) => {
    try {
      const response = await autoGenerate(maxRepos, since, spokenLanguageCode);
      if (response.status === 'ok') {
        fetchRepositories();
      }
      return response;
    } catch {
      setErrorWithScroll('Failed to auto-generate repositories');
      return { status: 'error', added: [], dont_added: [] };
    }
  };



  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="py-6">
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-gray-900 dark:text-gray-300 mr-3">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-300">Dashboard</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md p-4 flex justify-between items-center">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="text-red-500 dark:text-red-300 hover:text-red-700 dark:hover:text-red-100 focus:outline-none"
                aria-label="Close error message"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <Stats
            total={stats.all}
            posted={stats.posted}
            unposted={stats.unposted}
          />

          <GenerateForm
            onManualGenerate={handleManualGenerate}
            onAutoGenerate={handleAutoGenerate}
          />

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading repositories...</p>
            </div>
          ) : (
            <RepositoryList
              repositories={repositories}
              fetchRepositories={fetchRepositories}
              stats={stats}
            />
          )}

          <CronJobs />
        </main>
      </div>
    </div>
  );
}

export default App;
