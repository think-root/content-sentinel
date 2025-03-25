import { useEffect, useState } from 'react';
import { Stats } from './components/Stats';
import { RepositoryList } from './components/RepositoryList';
import { GenerateForm } from './components/GenerateForm';
import { CronJobs } from './components/CronJobs';
import { RepositoryPreview } from './components/RepositoryPreview';
import { getRepositories, manualGenerate, autoGenerate, ManualGenerateResponse, getLatestPostedRepository, getNextRepository } from './api';
import type { Repository } from './types';
import { X, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { SettingsButton } from './components/SettingsButton';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [stats, setStats] = useState({ all: 0, posted: 0, unposted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestPost, setLatestPost] = useState<Repository | undefined>();
  const [nextPost, setNextPost] = useState<Repository | undefined>();
  const [previewsLoading, setPreviewsLoading] = useState(true);

  const setErrorWithScroll = (errorMessage: string) => {
    setError(errorMessage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchRepositories = async (statusFilter?: boolean, append: boolean = false, fetchAll: boolean = false, itemsPerPage: number = 10, sortBy?: 'id' | 'date_added' | 'date_posted', sortOrder?: 'ASC' | 'DESC') => {
    try {
      if (!append) {
        setLoading(true);
      }
      
      const limit = itemsPerPage || 10;
      const response = await getRepositories(limit, statusFilter, fetchAll, sortBy, sortOrder);
      
      if (response && response.data && response.data.items) {
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
      } else {
        throw new Error('Invalid response format');
      }
    } catch {
      setErrorWithScroll('Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviews = async () => {
    try {
      setPreviewsLoading(true);
      const [latestResponse, nextResponse] = await Promise.all([
        getLatestPostedRepository(),
        getNextRepository()
      ]);
      
      setLatestPost(latestResponse.data.items[0]);
      setNextPost(nextResponse.data.items[0]);
    } catch {
      setErrorWithScroll('Failed to fetch repository previews');
    } finally {
      setPreviewsLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories(undefined, false, true);
    fetchPreviews();
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
    <Router>
      <Routes>
        <Route
          path="/dashboard/*"
          element={
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
              <div className="py-6">
                <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                  <div className="flex items-center justify-between py-6">
                    <div className="flex items-center">
                      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <LayoutDashboard className="h-6 w-6" />
                        Dashboard
                      </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                      <SettingsButton />
                      <ThemeToggle />
                    </div>
                  </div>
                </header>
                
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-md p-4 flex justify-between items-center">
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

                  <div className="grid md:grid-cols-2 gap-6">
                    <RepositoryPreview
                      title="Latest post"
                      repository={latestPost}
                      loading={previewsLoading}
                    />
                    <RepositoryPreview
                      title="Next post"
                      repository={nextPost}
                      loading={previewsLoading}
                    />
                  </div>

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
                    />
                  )}

                  <CronJobs />
                </main>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
