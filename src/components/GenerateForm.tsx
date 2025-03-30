import { useState } from 'react';
import { RefreshCw, Loader2, GitPullRequest, Zap, X } from 'lucide-react';
import { ResultDialog } from './ResultDialog';

interface GenerateFormProps {
  onManualGenerate: (url: string) => Promise<{status: string; added?: string[]; dont_added?: string[]}>;
  onAutoGenerate: (maxRepos: number, since: string, spokenLanguageCode: string) => Promise<{status: string; added?: string[]; dont_added?: string[]}>;
}

export function GenerateForm({ onManualGenerate, onAutoGenerate }: GenerateFormProps) {
  const [url, setUrl] = useState('');
  const [maxRepos, setMaxRepos] = useState(() => {
    const saved = localStorage.getItem('dashboardMaxRepos');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [since, setSince] = useState(() => {
    const saved = localStorage.getItem('dashboardSince');
    return saved || 'weekly';
  });
  const [spokenLanguageCode, setSpokenLanguageCode] = useState(() => {
    const saved = localStorage.getItem('dashboardSpokenLanguageCode');
    return saved || 'en';
  });
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [addedRepos, setAddedRepos] = useState<string[]>([]);
  const [notAddedRepos, setNotAddedRepos] = useState<string[]>([]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url && !isManualLoading) {
      try {
        setIsManualLoading(true);
        const response = await onManualGenerate(url);
        
        if (response.status === 'ok') {
          const added = response.added || [];
          const notAdded = response.dont_added || [];
          
          setAddedRepos(added);
          setNotAddedRepos(notAdded);
          
          setIsResultDialogOpen(true);
        }
        
        setUrl('');
        
        const textarea = document.getElementById('url') as HTMLTextAreaElement;
        if (textarea) {
          textarea.style.height = '38px';
        }
      } catch (error) {
        console.error(error);
      } finally {
        setTimeout(() => {
          setIsManualLoading(false);
        }, 500);
      }
    }
    return false;
  };

  const handleAutoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAutoLoading) {
      try {
        setIsAutoLoading(true);
        const response = await onAutoGenerate(maxRepos, since, spokenLanguageCode);
        
        if (response.status === 'ok') {
          const added = response.added || [];
          const notAdded = response.dont_added || [];
          
          setAddedRepos(added);
          setNotAddedRepos(notAdded);
          
          setIsResultDialogOpen(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setTimeout(() => {
          setIsAutoLoading(false);
        }, 500);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <ResultDialog 
        isOpen={isResultDialogOpen} 
        onClose={() => setIsResultDialogOpen(false)} 
        added={addedRepos} 
        notAdded={notAddedRepos} 
      />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <GitPullRequest className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Manual Generation</h2>
        </div>
        <form onSubmit={handleManualSubmit}>
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repository URLs (separate multiple URLs with spaces)
            </label>
            <div className="mt-1 flex rounded-md shadow-sm relative">
              <textarea
                name="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isManualLoading}
                rows={1}
                style={{
                  resize: 'both',
                  minHeight: '38px',
                  maxHeight: '300px',
                  overflow: 'auto',
                  height: 'auto'
                }}
                className={`flex-1 min-w-0 block w-full px-3 py-2 pr-8 rounded-md border border-gray-300 dark:border-gray-600 ${isManualLoading ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'} text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="https://github.com/user/repo1"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  
                  if (target.value.trim() === '') {
                    target.style.height = '38px';
                  } else {
                    const newHeight = Math.min(target.scrollHeight, 300);
                    target.style.height = `${newHeight}px`;
                  }
                }}
              />
              {url && (
                <button
                  onClick={() => {
                    setUrl('');
                    const textarea = document.getElementById('url') as HTMLTextAreaElement;
                    if (textarea) {
                      textarea.style.height = '38px';
                    }
                  }}
                  className="absolute right-0 top-0 h-full px-2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Clear input"
                  disabled={isManualLoading}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <button
              type="submit"
              disabled={isManualLoading}
              className={`inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isManualLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 w-full sm:w-auto min-w-[120px]`}
            >
              {isManualLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {isManualLoading ? 'Processing...' : 'Generate'}
            </button>
            

          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Zap className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Auto Generation (from github <a href="https://github.com/trending" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">trending</a>)</h2>
        </div>
        <form onSubmit={handleAutoSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="maxRepos" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Count
              </label>
              <div className="number-input-wrapper">
                <input
                  type="number"
                  name="maxRepos"
                  id="maxRepos"
                  value={maxRepos}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setMaxRepos(value);
                    localStorage.setItem('dashboardMaxRepos', value.toString());
                  }}
                  min="1"
                  max="100"
                  disabled={isAutoLoading}
                  className={`mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 ${isAutoLoading ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'} text-gray-900 dark:text-white py-2 pr-10 pl-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                />
                {!isAutoLoading && (
                  <div className="number-input-controls">
                    <div 
                      className="number-input-up" 
                      onClick={() => {
                        if (maxRepos < 100) {
                          const newValue = maxRepos + 1;
                          setMaxRepos(newValue);
                          localStorage.setItem('dashboardMaxRepos', newValue.toString());
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-500 dark:text-gray-400">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                    </div>
                    <div 
                      className="number-input-down" 
                      onClick={() => {
                        if (maxRepos > 1) {
                          const newValue = maxRepos - 1;
                          setMaxRepos(newValue);
                          localStorage.setItem('dashboardMaxRepos', newValue.toString());
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-500 dark:text-gray-400">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="since" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date range
              </label>
              <div className="select-wrapper">
                <div className="relative">
                  <select
                    id="since"
                    name="since"
                    value={since}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSince(value);
                      localStorage.setItem('dashboardSince', value);
                    }}
                    disabled={isAutoLoading}
                    className={`date-range-dropdown mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 ${isAutoLoading ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'} text-gray-900 dark:text-white py-2 pr-10 pl-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  {!isAutoLoading && (
                    <div 
                      className="select-arrow"
                      onClick={(e) => {
                        e.stopPropagation();
                        const select = document.getElementById('since') as HTMLSelectElement;
                        if (select) {
                          select.focus();
                          select.click();
                        }
                      }}
                    >
                      <div className="select-arrow-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-500 dark:text-gray-400">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Spoken Language
              </label>
              <div className="select-wrapper">
                <div className="relative">
                  <select
                    id="language"
                    name="language"
                    value={spokenLanguageCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSpokenLanguageCode(value);
                      localStorage.setItem('dashboardSpokenLanguageCode', value);
                    }}
                    disabled={isAutoLoading}
                    className={`spoken-language-dropdown mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 ${isAutoLoading ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'} text-gray-900 dark:text-white py-2 pr-10 pl-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  >
                    <option value="en">English</option>
                    <option value="zh">Chinese</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </select>
                  {!isAutoLoading && (
                    <div 
                      className="select-arrow"
                      onClick={(e) => {
                        e.stopPropagation();
                        const select = document.getElementById('language') as HTMLSelectElement;
                        if (select) {
                          // Direct click for iOS Safari
                          select.focus();
                          select.click();
                        }
                      }}
                    >
                      <div className="select-arrow-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-500 dark:text-gray-400">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={isAutoLoading}
            className={`mt-4 inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isAutoLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 w-full sm:w-auto min-w-[150px]`}
          >
            {isAutoLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isAutoLoading ? 'Processing...' : 'Generate'}
          </button>
        </form>
      </div>
    </div>
  );
}
