import { useState, useEffect } from 'react';
import { ApiSettings, LOCAL_STORAGE_KEY, getApiSettings } from '../utils/api-settings';
import { Toast } from './Toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<ApiSettings>(getApiSettings());
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'content-alchemist' | 'content-maestro'>('general');

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

      setToast({
        message: 'Settings successfully updated',
        type: 'success'
      });

      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      console.error('Settings save error:', error);
      setToast({
        message: errorMessage,
        type: 'error'
      });
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
    <>
      {toast && (
        <div className="fixed top-4 right-4 z-[60]">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}
      <div className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-all" onClick={onClose} />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg">
          <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between p-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>
                <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button className={`px-4 py-1.5 text-sm font-medium ${activeTab === 'general' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('general')}>General</button>
                <button className={`px-4 py-1.5 text-sm font-medium ${activeTab === 'content-alchemist' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('content-alchemist')}>Content Alchemist</button>
                <button className={`px-4 py-1.5 text-sm font-medium ${activeTab === 'content-maestro' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`} onClick={() => setActiveTab('content-maestro')}>Content Maestro</button>
              </div>
            </div>

            <div className="p-4 h-[250px] overflow-y-auto">
              <div className="space-y-3">
                {activeTab === 'general' && (
                  <>
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
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Available formats: DD, MM, YYYY, HH, mm, ss
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
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Format example: Europe/Kyiv, Europe/London, America/New_York
                      </p>
                    </div>
                  </>
                )}

                {activeTab === 'content-alchemist' && (
                  <div className="space-y-4">
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
                )}

                {activeTab === 'content-maestro' && (
                  <div className="space-y-4">
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
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-300 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 