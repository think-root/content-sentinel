import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ApiSettings, LOCAL_STORAGE_KEY, getApiSettings } from '@/utils/api-settings';
import { toast } from './toast-config';
import { AlertCircle, Settings, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../base/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../base/tabs';
import { Input } from '../base/input';
import { Label } from '../base/label';
import { Button } from '../base/button';

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

  const toastOptions = {
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
        setIsSwiping(false);
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

      const preventTouchMove = (e: TouchEvent) => {
        if (!isMobileDevice()) return;
        const modalContent = document.querySelector('.settings-modal-content');
        const target = e.target as Node;
        if (modalContent && !modalContent.contains(target)) {
          e.preventDefault();
        }
      };

      document.addEventListener('touchmove', preventTouchMove, { passive: false });

      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('touchmove', preventTouchMove);
      };
    } else {
      document.body.style.overflow = '';
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
    setSettings((prev: ApiSettings) => ({
      ...prev,
      ...newSettings
    }));
  };

  const updateContentAlchemist = (field: keyof ApiSettings['contentAlchemist'], value: string) => {
    setSettings((prev: ApiSettings) => ({
      ...prev,
      contentAlchemist: {
        ...prev.contentAlchemist,
        [field]: value
      }
    }));
  };

  const updateContentMaestro = (field: keyof ApiSettings['contentMaestro'], value: string) => {
    setSettings((prev: ApiSettings) => ({
      ...prev,
      contentMaestro: {
        ...prev.contentMaestro,
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && !isSwiping && onClose()}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full settings-modal-content">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'general' | 'api' | 'cache')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
          </TabsList>

          <div {...handlers} className="mt-4">
            <TabsContent value="general" className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="dateFormat">Date Format</Label>
                <Input
                  type="text"
                  id="dateFormat"
                  placeholder="example: DD.MM.YYYY HH:mm:ss"
                  value={settings.dateFormat}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings({ dateFormat: e.target.value })}
                />
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  DD, MM, YYYY, HH (24h), hh (12h), mm, ss, A (AM/PM), a (am/pm)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  type="text"
                  id="timezone"
                  placeholder="Enter timezone (e.g. Europe/Kyiv)"
                  value={settings.timezone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings({ timezone: e.target.value })}
                />
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  Europe/Kyiv, Europe/London, America/New_York
                </p>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">Content Alchemist API</h3>
                <div className="space-y-2">
                  <Label htmlFor="alchemistApiBaseUrl">API Base URL</Label>
                  <Input
                    type="text"
                    id="alchemistApiBaseUrl"
                    placeholder="Enter API base URL"
                    value={settings.contentAlchemist?.apiBaseUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContentAlchemist('apiBaseUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alchemistApiBearerToken">API Bearer Token</Label>
                  <Input
                    type="password"
                    id="alchemistApiBearerToken"
                    placeholder="Enter API bearer token"
                    value={settings.contentAlchemist?.apiBearerToken}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContentAlchemist('apiBearerToken', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">Content Maestro API</h3>
                <div className="space-y-2">
                  <Label htmlFor="maestroApiBaseUrl">API Base URL</Label>
                  <Input
                    type="text"
                    id="maestroApiBaseUrl"
                    placeholder="Enter API base URL"
                    value={settings.contentMaestro?.apiBaseUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContentMaestro('apiBaseUrl', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maestroApiBearerToken">API Bearer Token</Label>
                  <Input
                    type="password"
                    id="maestroApiBearerToken"
                    placeholder="Enter API bearer token"
                    value={settings.contentMaestro?.apiBearerToken}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContentMaestro('apiBearerToken', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cache" className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">API Cache Management</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  The application caches API responses to improve performance and reduce loading times. Clear the cache to fetch fresh data. You can also clear the cache if you encounter errors when loading data.
                </p>
                <Button
                  onClick={async () => {
                    setClearingCache(true);
                    try {
                      let message = 'Cache cleared successfully';
                      
                      if ((window as any).clearAllCaches) {
                        message = (window as any).clearAllCaches();
                        console.log('Cache clearing completed:', message);
                      }

                      toast.success(message, toastOptions);

                      setTimeout(() => {
                        const currentUrl = window.location.href;
                        const separator = currentUrl.includes('?') ? '&' : '?';
                        const timestamp = Date.now();
                        window.location.href = `${currentUrl}${separator}cache_bust=${timestamp}`;
                      }, 1000);
                    } catch (error) {
                      console.error('Cache clearing failed:', error);
                      toast.error('Failed to clear cache', toastOptions);
                    } finally {
                      setClearingCache(false);
                    }
                  }}
                  disabled={clearingCache}
                  className="w-full sm:w-auto"
                  size="sm"
                  variant="destructive"
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
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};