import { useState, useEffect, useMemo, useRef } from 'react';
import { ApiSettings, LOCAL_STORAGE_KEY, areApiSettingsEqual, getApiSettings } from '@/utils/api-settings';
import { toast } from './toast-config';
import { Settings, Loader2 } from 'lucide-react';
import { validateTimezone } from '@/utils/settings-validators';
import { useLanguageValidation } from '@/hooks/useLanguageValidation';
import { useDialogTabSwipe } from '@/hooks/useDialogTabSwipe';
import { TooltipProvider } from '../base/tooltip';
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
import { Button } from '../base/button';
import { storage } from '../../../lib/storage';
import { SettingsGeneralTab } from './settings-general-tab';
import { SettingsCacheTab } from './settings-cache-tab';
import { SettingsAccountTab } from './settings-account-tab';
import { getSession, type Session } from '@/api/session';

type SettingsTab = 'general' | 'account' | 'cache';

const toastOptions = {
  id: 'unique-toast-settings'
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<ApiSettings>(getApiSettings());
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [timezoneError, setTimezoneError] = useState<string | null>(null);
  const [session, setSession] = useState<Session>({ method: 'none' });
  // The Account tab only exists when something protects the dashboard
  const tabs = useMemo<SettingsTab[]>(
    () => (session.method === 'none' ? ['general', 'cache'] : ['general', 'account', 'cache']),
    [session.method]
  );
  const {
    languageValidation,
    isValidatingLanguage,
    validateLanguageCodes,
    resetLanguageValidation,
  } = useLanguageValidation('settingsLanguageValidationCache');
  const { handlers, isSwiping, resetSwipe, animationClass } = useDialogTabSwipe(tabs, activeTab, setActiveTab);

  // Capture initial settings snapshot on open to detect no-op saves
  const initialSettingsRef = useRef<ApiSettings | null>(null);

  // Clear ephemeral UI state without touching persistence or tabs
  const resetFormState = () => {
    setTimezoneError(null);
    resetLanguageValidation();
    setIsSaving(false);
    resetSwipe();
  };

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

    // Store initial snapshot for change detection
    initialSettingsRef.current = normalized;

    // Clear transient UI state so errors/spinners do not persist across opens
    resetFormState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Who is signed in, asked once on the first open
  const sessionRequestedRef = useRef(false);
  useEffect(() => {
    if (!isOpen || sessionRequestedRef.current) return;
    sessionRequestedRef.current = true;
    getSession().then(setSession);
  }, [isOpen]);

  // Debounced validation for display language
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateLanguageCodes(settings.displayLanguage);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [settings.displayLanguage, validateLanguageCodes]);

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

    // No-op save: if nothing changed, close immediately (no spinner, no toast, no reload)
    if (initialSettingsRef.current && areApiSettingsEqual(initialSettingsRef.current, settings)) {
      resetFormState();
      onClose();
      return; // Short-circuit: skip validation, saving, toasts, localStorage writes, and reload
    }

    // Early guards for validation errors
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
      const settingsToSave: ApiSettings = {
        dateFormat: settings.dateFormat || "DD.MM.YYYY HH:mm",
        timezone: settings.timezone || "Europe/Kyiv",
        displayLanguage: (settings.displayLanguage || "uk").toLowerCase(),
      };

      storage.set(LOCAL_STORAGE_KEY, JSON.stringify(settingsToSave));

      // Notify app to perform a single foreground refresh after settings save
      window.dispatchEvent(new CustomEvent('content-sentinel:settings-saved'));

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

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && !isSwiping && !isSaving && onClose()}>
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] sm:w-full max-h-[calc(100dvh-2rem)] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs className="flex flex-col min-h-0 flex-1" value={activeTab} onValueChange={(value: string) => setActiveTab(value as SettingsTab)}>
          <TabsList className={`grid w-full shrink-0 ${tabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="general">General</TabsTrigger>
            {session.method !== 'none' && <TabsTrigger value="account">Account</TabsTrigger>}
            <TabsTrigger value="cache">Cache</TabsTrigger>
          </TabsList>

          <div
            {...handlers}
            className={`mt-4 -mx-1 px-1 pb-1 min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin ${animationClass}`}
          >
            <TabsContent value="general" className="space-y-3">
              <SettingsGeneralTab
                settings={settings}
                timezoneError={timezoneError}
                languageValidation={languageValidation}
                isValidatingLanguage={isValidatingLanguage}
                updateSettings={updateSettings}
              />
            </TabsContent>

            {session.method !== 'none' && (
              <TabsContent value="account" className="space-y-4">
                <SettingsAccountTab session={session} />
              </TabsContent>
            )}

            <TabsContent value="cache" className="space-y-4">
              <SettingsCacheTab />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="shrink-0">
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
            disabled={isSaving || !!timezoneError || (!languageValidation.isValid && !!settings.displayLanguage.trim())}
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
