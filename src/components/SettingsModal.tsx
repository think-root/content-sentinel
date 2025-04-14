import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ApiSettings, LOCAL_STORAGE_KEY, getApiSettings } from '../utils/api-settings';
import { toast, ToastOptions } from 'react-hot-toast';
import { AlertCircle, Settings, RefreshCw } from 'lucide-react';

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<ApiSettings>(getApiSettings());
  const [activeTab, setActiveTab] = useState<'general' | 'api' | 'cache'>('general');
  const [clearingCache, setClearingCache] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const toastOptions: ToastOptions = {
    id: 'unique-toast-settings'
  };

  const tabs: Array<'general' | 'api' | 'cache'> = ['general', 'api', 'cache'];

  const handlers = useSwipeable({
    onSwipeStart: () => {
      if (isMobileDevice()) {
        setIsSwiping(true);
      }
    },
    onSwiped: () => {
      if (isMobileDevice()) {
        setTimeout(() => setIsSwiping(false), 50);
      }
    },
    onSwipedLeft: () => {
      if (isMobileDevice()) {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1]);
        }
      }
    },
    onSwipedRight: () => {
      if (isMobileDevice()) {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1]);
        }
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const preventTouchMove = (e: TouchEvent | MouseEvent) => {
        if (!isMobileDevice()) return;
        
        const modalContent = document.querySelector('.settings-modal-content');
        
        if (modalContent && (e.target instanceof Node) && modalContent.contains(e.target)) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
      };
      
      document.addEventListener('touchmove', preventTouchMove, { passive: false, capture: true });
      document.addEventListener('touchstart', preventTouchMove, { passive: false, capture: true });
      document.addEventListener('touchend', preventTouchMove, { passive: false, capture: true });
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('touchmove', preventTouchMove, { capture: true });
        document.removeEventListener('touchstart', preventTouchMove, { capture: true });
        document.removeEventListener('touchend', preventTouchMove, { capture: true });
      };
    } else {
      document.body.style.overflow = '';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleSave = () => {
    console.log('Current settings:', settings);
    try {
      console.log('Content Alchemist settings:', settings.contentAlchemist);
      console.log('Content Maestro settings:', settings.contentMaestro);

      const settingsToSave = {
        apiBaseUrl: settings.apiBaseUrl || "",
        apiBearerToken: settings.apiBearerToken || "",
        dateFormat: settings.dateFormat || "DD.MM.YYYY HH:mm",
        timezone: settings.timezone || "Europe/Kyiv",
        contentAlchemist: {
          apiBaseUrl: settings.contentAlchemist?.apiBaseUrl || "",
          apiBearerToken: settings.contentAlchemist?.apiBearerToken || "",
        },
        contentMaestro: {
          apiBaseUrl: settings.contentMaestro?.apiBaseUrl || "",
          apiBearerToken: settings.contentMaestro?.apiBearerToken || "",
        },
      };

      console.log('Saving settings:', settingsToSave);

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));

      toast.dismiss('unique-toast-settings');
      toast.success('Settings successfully updated', toastOptions);

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      console.error('Settings save error:', error);
      toast.dismiss('unique-toast-settings');
      toast.error(errorMessage, toastOptions);
    }
  };

  const updateSettings = (newSettings: Partial<ApiSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const updateContentAlchemist = (field: keyof ApiSettings['contentAlchemist'], value: string) => {
    setSettings(prev => ({
      ...prev,
      contentAlchemist: {
        ...prev.contentAlchemist,
        [field]: value
      }
    }));
  };

  const updateContentMaestro = (field: keyof ApiSettings['contentMaestro'], value: string) => {
    setSettings(prev => ({
      ...prev,
      contentMaestro: {
        ...prev.contentMaestro,
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50"
      onTouchStart={(e) => e.stopPropagation()} 
      onMouseDown={(e) => e.stopPropagation()} 
    >
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all" 
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSwiping) {
            onClose();
          }
        }}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg settings-modal-content" style={{ zIndex: 9999 }}>
        <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-3">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                Settings
              </h3>
              <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              <button className={`px-4 py-1.5 text-sm font-medium ${activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('general')}>General</button>
              <button className={`px-4 py-1.5 text-sm font-medium ${activeTab === 'api' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('api')}>API</button>
              <button className={`px-4 py-1.5 text-sm font-medium ${activeTab === 'cache' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('cache')}>Cache</button>
            </div>
          </div>

          <div
            {...handlers}
            className="p-4 overflow-hidden transition-[height] duration-300 ease-in-out"
          >
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${tabs.indexOf(activeTab) * 100}%)` }}
            >
              <div className="w-full flex-shrink-0 px-1">
                {activeTab === 'general' && (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="dateFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Date Format
                      </label>
                      <input
                        type="text"
                        id="dateFormat"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="example: DD.MM.YYYY HH:mm:ss"
                        value={settings.dateFormat}
                        onChange={(e) => updateSettings({ dateFormat: e.target.value })}
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        DD, MM, YYYY, HH (24h), hh (12h), mm, ss, A (AM/PM), a (am/pm)
                      </p>
                    </div>
                    <div>
                      <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Timezone
                      </label>
                      <input
                        type="text"
                        id="timezone"
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter timezone (e.g. Europe/Kyiv)"
                        value={settings.timezone}
                        onChange={(e) => updateSettings({ timezone: e.target.value })}
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        Europe/Kyiv, Europe/London, America/New_York
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full flex-shrink-0 px-1">
                {activeTab === 'api' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Content Alchemist API</h3>
                      <div>
                        <label htmlFor="alchemistApiBaseUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          API Base URL
                        </label>
                        <input
                          type="text"
                          id="alchemistApiBaseUrl"
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter API base URL"
                          value={settings.contentAlchemist?.apiBaseUrl}
                          onChange={(e) => updateContentAlchemist('apiBaseUrl', e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="alchemistApiBearerToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          API Bearer Token
                        </label>
                        <input
                          type="password"
                          id="alchemistApiBearerToken"
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter API bearer token"
                          value={settings.contentAlchemist?.apiBearerToken}
                          onChange={(e) => updateContentAlchemist('apiBearerToken', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">Content Maestro API</h3>
                      <div>
                        <label htmlFor="maestroApiBaseUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          API Base URL
                        </label>
                        <input
                          type="text"
                          id="maestroApiBaseUrl"
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter API base URL"
                          value={settings.contentMaestro?.apiBaseUrl}
                          onChange={(e) => updateContentMaestro('apiBaseUrl', e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="maestroApiBearerToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          API Bearer Token
                        </label>
                        <input
                          type="password"
                          id="maestroApiBearerToken"
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter API bearer token"
                          value={settings.contentMaestro?.apiBearerToken}
                          onChange={(e) => updateContentMaestro('apiBearerToken', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full flex-shrink-0 px-1">
                {activeTab === 'cache' && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">API Cache Management</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        The application caches API responses to improve performance and reduce loading times. Clear the cache to fetch fresh data. You can also clear the cache if you encounter errors when loading data.
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          setClearingCache(true);
                          try {
                            if (window.clearAllCaches) {
                              window.clearAllCaches();
                            }

                            if (window.clearApiCache) {
                              await window.clearApiCache();
                            }

                            toast.success('Cache cleared successfully', toastOptions);

                            setTimeout(() => {
                              const currentUrl = window.location.href;
                              const separator = currentUrl.includes('?') ? '&' : '?';
                              const timestamp = Date.now();
                              window.location.href = `${currentUrl}${separator}cache_bust=${timestamp}`;
                            }, 1000);
                          } catch {
                            toast.error('Failed to clear cache', toastOptions);
                          } finally {
                            setClearingCache(false);
                          }
                        }}
                        disabled={clearingCache}
                        className={`inline-flex w-full sm:w-auto items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${clearingCache ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800`}
                      >
                        {clearingCache ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Clearing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Clear API Cache
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 sm:ml-3 sm:w-auto"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
