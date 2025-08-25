import { useState, useEffect, useCallback } from 'react';
import { Loader2, GitPullRequest, Play, Save, X, AlertCircle, FolderDown, Zap } from 'lucide-react';
import { ResultDialog } from './ResultDialog';
import { getCollectSettings, updateCollectSettings, ManualGenerateResponse } from '../api';
import { toast } from 'react-hot-toast';

const LANGUAGE_MAPPING = {
  'English': 'en',
  'German': 'de',
  'French': 'fr',
  'Spanish': 'es'
};

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;

interface GenerateFormProps {
  onManualGenerate: (url: string) => Promise<ManualGenerateResponse>;
  onAutoGenerate: (maxRepos: number, since: string, spokenLanguageCode: string) => Promise<ManualGenerateResponse>;
}

export function GenerateForm({ onManualGenerate, onAutoGenerate }: GenerateFormProps) {
  const [url, setUrl] = useState('');
  const [maxRepos, setMaxRepos] = useState(() => {
    const saved = localStorage.getItem('dashboardMaxRepos');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [since, setSince] = useState(() => {
    const saved = localStorage.getItem('dashboardSince');
    return saved || 'daily';
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
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [dialogContext, setDialogContext] = useState<'manual' | 'collect'>('collect');

  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getCollectSettings();
      setMaxRepos(settings.max_repos);
      setSince(settings.since);
      setSpokenLanguageCode(settings.spoken_language_code);

      localStorage.setItem('dashboardMaxRepos', settings.max_repos.toString());
      localStorage.setItem('dashboardSince', settings.since);
      localStorage.setItem('dashboardSpokenLanguageCode', settings.spoken_language_code);
    } catch {
      console.error('Failed to load collect settings');

      const savedMaxRepos = localStorage.getItem('dashboardMaxRepos') || '5';
      const savedSince = localStorage.getItem('dashboardSince') || 'daily';
      const savedLanguage = localStorage.getItem('dashboardSpokenLanguageCode') || 'en';

      setMaxRepos(parseInt(savedMaxRepos, 10));
      setSince(savedSince);
      setSpokenLanguageCode(savedLanguage);

      if (!localStorage.getItem('dashboardMaxRepos')) {
        localStorage.setItem('dashboardMaxRepos', '5');
      }
      if (!localStorage.getItem('dashboardSince')) {
        localStorage.setItem('dashboardSince', 'daily');
      }
      if (!localStorage.getItem('dashboardSpokenLanguageCode')) {
        localStorage.setItem('dashboardSpokenLanguageCode', 'en');
      }
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const response = await updateCollectSettings({
        max_repos: maxRepos,
        since,
        spoken_language_code: spokenLanguageCode
      });

      if (response.status === 'success') {
        toast.success(response.message || 'Settings saved successfully');

        localStorage.setItem('dashboardMaxRepos', maxRepos.toString());
        localStorage.setItem('dashboardSince', since);
        localStorage.setItem('dashboardSpokenLanguageCode', spokenLanguageCode);
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error instanceof Error ? `Failed to save settings: ${error.message}` : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url && !isManualLoading) {
      try {
        setIsManualLoading(true);
        await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
        const response = await onManualGenerate(url);

        const added = response.added || [];
        const notAdded = response.dont_added || [];

        setAddedRepos(added as string[]);
        setNotAddedRepos(notAdded as string[]);

        const map: Record<string, string> = {};
        if (response.error_message && response.error_message.trim() !== '') {
          (response.dont_added || []).forEach(repo => {
            map[repo] = response.error_message!;
          });
        }
        setErrorMessages(map);

        setDialogContext('manual');
        setIsResultDialogOpen(true);
        
        setUrl('');
        
        const textarea = document.getElementById('url') as HTMLTextAreaElement;
        if (textarea) {
          textarea.style.height = '38px';
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to process manual generation');
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
        await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
        const response = await onAutoGenerate(maxRepos, since, spokenLanguageCode);
        
        // Always set added and notAdded from the response
        const added = response.added || [];
        const notAdded = response.dont_added || [];

        setAddedRepos(added as string[]);
        setNotAddedRepos(notAdded as string[]);

        // Build errorMessages map and set it
        const map: Record<string, string> = {};
        if (response.error_message && response.error_message.trim() !== '') {
          (response.dont_added || []).forEach(repo => {
            map[repo] = response.error_message!;
          });
        }
        setErrorMessages(map);

        // Always open the dialog to show results (even if no repositories were found)
        setDialogContext('collect');
        setIsResultDialogOpen(true);
      } catch (error) {
        console.error(error);
        toast.error('Failed to process auto generation');
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
        errorMessages={errorMessages}
        context={dialogContext}
        title={dialogContext === 'manual' ? 'Manual Generation' : 'Collect posts'}
      />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <GitPullRequest className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Manual Generation</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Generate a post from repository URLs. Separate multiple URLs with spaces</span>
        </p>
        <form onSubmit={handleManualSubmit}>
          <div className="mb-4">
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Repository URLs
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
                <Zap className="h-4 w-4 mr-2" />
              )}
              {isManualLoading ? 'Processing...' : 'Generate'}
            </button>
            

          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <FolderDown className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Collect posts</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            Manage collect settings and manually generate new posts from GitHub{' '}
            <a href="https://github.com/trending" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">trends</a>
          </span>
        </p>
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
                  disabled={isAutoLoading || isSaving}
                  className={`mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 ${(isAutoLoading || isSaving) ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-white py-2 pr-10 pl-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
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
                    disabled={isAutoLoading || isSaving}
                    className={`mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 ${
                      (isAutoLoading || isSaving) ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'
                    } text-gray-900 dark:text-white py-2 pr-10 pl-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  {!isAutoLoading && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-gray-500 dark:text-gray-400">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Spoken Language
              </label>
              <div className="mt-1"> {}
                <div className="select-wrapper">
                  <div className="relative">
                    <select
                      id="language"
                      name="language"
                      value={Object.entries(LANGUAGE_MAPPING).find(([, code]) => code === spokenLanguageCode)?.[0] || 'English'}
                      onChange={(e) => {
                        const value = LANGUAGE_MAPPING[e.target.value as keyof typeof LANGUAGE_MAPPING];
                        setSpokenLanguageCode(value);
                      }}
                      disabled={isAutoLoading || isSaving}
                      className={`block w-full rounded-md border border-gray-300 dark:border-gray-600 ${
                        (isAutoLoading || isSaving) ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'
                      } text-gray-900 dark:text-white py-2 pr-10 pl-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none`}
                      style={{
                        backgroundPosition: 'right 0.5rem center',
                        backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em'
                      }}
                    >
                      {Object.keys(LANGUAGE_MAPPING).map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
            <button
              type="submit"
              disabled={isAutoLoading || isSaving}
              title="Generate posts out of collect schedule"
              className={`inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isAutoLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 w-full sm:w-auto min-w-[150px]`}
            >
              {isAutoLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isAutoLoading ? 'Processing...' : 'Trigger'}
            </button>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving || isAutoLoading}
              title="Save settings to server"
              className={`inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isSaving || isAutoLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 w-full sm:w-auto min-w-[150px]`}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
