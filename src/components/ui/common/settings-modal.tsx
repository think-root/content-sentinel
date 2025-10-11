import { useState, useEffect, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { ApiSettings, LOCAL_STORAGE_KEY, getApiSettings } from '@/utils/api-settings';
import { toast } from './toast-config';
import { AlertCircle, Settings, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { languageValidator, ValidationResult } from '@/utils/language-validation';
import { validateDateFormat, validateTimezone } from '@/utils/settings-validators';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../base/tooltip';
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
  const [languageValidation, setLanguageValidation] = useState<ValidationResult>({
    isValid: true,
    validCodes: [],
    invalidCodes: []
  });
  const [isValidatingLanguage, setIsValidatingLanguage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dateFormatError, setDateFormatError] = useState<string | null>(null);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);

  // Track swipe-origin animations and direction (mobile-only)
  const [lastSwipeDir, setLastSwipeDir] = useState<"left" | "right" | null>(null);
  const [animateOnSwipe, setAnimateOnSwipe] = useState(false);
  
  const toastOptions = {
    id: 'unique-toast-settings'
  };

  // Language validation cache helpers
  const LANG_VALIDATION_CACHE_KEY = 'settingsLanguageValidationCache';
  const LANG_VALIDATION_TTL = 60 * 60 * 1000; // 1 hour

  const normalizeCodesStr = (codes: string) =>
    codes
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
      .sort()
      .join(',');

  const getValidationCache = (): Record<string, { result: ValidationResult; ts: number }> => {
    try {
      const raw = localStorage.getItem(LANG_VALIDATION_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const setValidationCache = (codesKey: string, result: ValidationResult) => {
    try {
      const cache = getValidationCache();
      cache[codesKey] = { result, ts: Date.now() };
      localStorage.setItem(LANG_VALIDATION_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // no-op
    }
  };

  const getValidationFromCache = (codesKey: string): ValidationResult | null => {
    const cache = getValidationCache();
    const entry = cache[codesKey];
    if (!entry) return null;
    if (Date.now() - entry.ts > LANG_VALIDATION_TTL) return null;
    return entry.result;
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
        setLastSwipeDir("left");
        setAnimateOnSwipe(true);
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex < tabs.length - 1) {
          setActiveTab(tabs[currentIndex + 1]);
        }
        setTimeout(() => setAnimateOnSwipe(false), 300);
      }
    },
    onSwipedRight: () => {
      if (isMobileDevice()) {
        setLastSwipeDir("right");
        setAnimateOnSwipe(true);
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex > 0) {
          setActiveTab(tabs[currentIndex - 1]);
        }
        setTimeout(() => setAnimateOnSwipe(false), 300);
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

  // Rehydrate settings from storage on open, normalize displayLanguage, and clear ephemeral UI state
  useEffect(() => {
    if (!isOpen) return;

    // Load fresh settings from localStorage
    const fresh = getApiSettings();
    const normalized = {
      ...fresh,
      displayLanguage: (fresh.displayLanguage || '').toLowerCase(),
    };

    setSettings(normalized);

    // Clear transient UI state so errors/spinners do not persist across opens
    resetFormState();
  }, [isOpen]);

  const validateLanguageCodes = useCallback(async (codes: string) => {
    const raw = codes || '';
    const normalized = normalizeCodesStr(raw);

    if (!normalized) {
      setLanguageValidation({ isValid: true, validCodes: [], invalidCodes: [] });
      return;
    }

    // Try cache first to avoid spinner/flicker
    const cached = getValidationFromCache(normalized);
    if (cached) {
      setLanguageValidation(cached);
      // Background refresh without spinner
      (async () => {
        try {
          const result = await languageValidator.validateLanguageCodes(raw);
          setLanguageValidation(result);
          setValidationCache(normalized, result);
        } catch (error) {
          console.error('Language validation error (background):', error);
        }
      })();
      return;
    }

    // No cache => show spinner and validate
    setIsValidatingLanguage(true);
    try {
      const result = await languageValidator.validateLanguageCodes(raw);
      setLanguageValidation(result);
      setValidationCache(normalized, result);
    } catch (error) {
      console.error('Language validation error:', error);
      setLanguageValidation({
        isValid: false,
        validCodes: [],
        invalidCodes: [],
        message: 'Validation service unavailable'
      });
    } finally {
      setIsValidatingLanguage(false);
    }
  }, []);

  // Debounced validation for display language
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateLanguageCodes(settings.displayLanguage);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [settings.displayLanguage, validateLanguageCodes]);

  // Debounced validation for date format (sync)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const value = settings.dateFormat || '';
      const result = validateDateFormat(value);
      if (!result.isValid) {
        setDateFormatError(result.message || 'Allowed values: DD, MM, YYYY, HH, hh, mm, ss, A, a and include DD, MM, YYYY.');
      } else {
        setDateFormatError(null);
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [settings.dateFormat]);

  // Debounced validation for timezone (sync)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const value = settings.timezone || '';
      if (!value.trim()) {
        // Empty timezone is allowed (no error)
        setTimezoneError(null);
        return;
      }
      const result = validateTimezone(value);
      if (!result.isValid) {
        setTimezoneError(result.message || 'Invalid timezone. Use IANA tz like Europe/Kyiv.');
      } else {
        setTimezoneError(null);
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [settings.timezone]);

  const handleSave = () => {
    if (isSaving) return;

    // Early guards for validation errors
    if (dateFormatError) {
      toast.error(dateFormatError, toastOptions);
      setIsSaving(false);
      return;
    }
    if (timezoneError) {
      toast.error(timezoneError, toastOptions);
      setIsSaving(false);
      return;
    }
    if (!languageValidation.isValid && settings.displayLanguage.trim()) {
      toast.error(languageValidation.message || 'Please fix language code errors before saving', toastOptions);
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    try {
      const settingsToSave = {
        apiBaseUrl: settings.apiBaseUrl || "",
        apiBearerToken: settings.apiBearerToken || "",
        dateFormat: settings.dateFormat || "DD.MM.YYYY HH:mm",
        timezone: settings.timezone || "Europe/Kyiv",
        displayLanguage: (settings.displayLanguage || "uk").toLowerCase(),
        contentAlchemist: {
          apiBaseUrl: settings.contentAlchemist?.apiBaseUrl || "",
          apiBearerToken: settings.contentAlchemist?.apiBearerToken || "",
        },
        contentMaestro: {
          apiBaseUrl: settings.contentMaestro?.apiBaseUrl || "",
          apiBearerToken: settings.contentMaestro?.apiBearerToken || "",
        },
      };

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));

      toast.dismiss('unique-toast-settings');
      toast.success('Settings successfully updated', toastOptions);

      // Keep isSaving=true until reload so user sees spinner and buttons remain disabled.
      setTimeout(() => {
        onClose();
        window.location.reload();
        // no setIsSaving(false) here because the page is reloading
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      console.error('Settings save error:', error);
      toast.dismiss('unique-toast-settings');
      toast.error(errorMessage, toastOptions);
      // On error, re-enable UI so user can retry.
      setIsSaving(false);
    }
  };

  const updateSettings = (newSettings: Partial<ApiSettings>) => {
    setSettings((prev: ApiSettings) => ({
      ...prev,
      ...newSettings
    }));
  };

  // Clear ephemeral UI state without touching persistence or tabs
  const resetFormState = () => {
    setDateFormatError(null);
    setTimezoneError(null);
    setLanguageValidation({ isValid: true, validCodes: [], invalidCodes: [] });
    setIsValidatingLanguage(false);
    setIsSaving(false);
    setIsSwiping(false);
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
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && !isSwiping && !isSaving && onClose()}>
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

          <div
            {...handlers}
            className={`mt-4 ${
              isMobileDevice() && animateOnSwipe && lastSwipeDir === 'left' ? 'motion-safe:animate-slide-fade-in-from-left' : ''
            } ${
              isMobileDevice() && animateOnSwipe && lastSwipeDir === 'right' ? 'motion-safe:animate-slide-fade-in-from-right' : ''
            }`}
          >
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
                {dateFormatError ? (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {dateFormatError}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    DD, MM, YYYY, HH (24h), hh (12h), mm, ss, A (AM/PM), a (am/pm)
                  </p>
                )}
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
                {timezoneError ? (
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {timezoneError}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    Europe/Kyiv, Europe/London, America/New_York
                  </p>
                )}
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
                <div className="space-y-2">
                  <Label htmlFor="displayLanguage">Language Code</Label>
                  <Input
                    type="text"
                    id="displayLanguage"
                    placeholder="uk or en, uk, fr"
                    value={settings.displayLanguage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings({ displayLanguage: e.target.value.toLowerCase() })}
                  />
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center justify-between">
                      <div className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2 leading-snug">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-[2px]" />
                        <span className="whitespace-normal break-words">
                          Language code for displaying posts. Uses{' '}
                          <a
                            href="https://en.wikipedia.org/wiki/ISO_639-1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            ISO 639-1
                          </a>{' '}
                          standard.
                        </span>
                      </div>
                      {settings.displayLanguage.trim() && (
                        <div className="flex items-center">
                          {isValidatingLanguage && (
                            <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                          )}
                          {!isValidatingLanguage && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  {languageValidation.isValid && (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  )}
                                  {!languageValidation.isValid && (
                                    <AlertCircle className="h-3 w-3 text-destructive" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {languageValidation.isValid && languageValidation.validCodes.length > 0 && (
                                  <div>Valid: {languageValidation.validCodes.join(', ')}</div>
                                )}
                                {!languageValidation.isValid && languageValidation.message && (
                                  <div>{languageValidation.message}</div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => { resetFormState(); onClose(); }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !!dateFormatError || !!timezoneError || (!languageValidation.isValid && !!settings.displayLanguage.trim())}
            aria-busy={isSaving ? 'true' : undefined}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  );
};