import { useCallback, useEffect, useState } from 'react';
import { getCollectSettings, updateCollectSettings } from '../api/maestro';
import { toast } from '../components/ui/common/toast-config';
import { storage } from '../lib/storage';

// Collect sources that are unavailable upstream: OssInsight paused its star-based
// rankings, so its API answers with an empty result set. Stored settings pointing at
// one of these fall back to GitHub instead of leaving the form on a hidden source.
const PAUSED_RESOURCES = new Set(['ossinsight']);

const normalizeResource = (value: string | null | undefined) =>
  value && !PAUSED_RESOURCES.has(value) ? value : 'github';

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;

// A local edit this recent wins over the settings loaded from Content Maestro.
const RECENT_EDIT_WINDOW_MS = 20000;

const isValidMaxRepos = (value: number | undefined): value is number =>
  value !== undefined && !Number.isNaN(value) && value >= 1 && value <= 100;

const markEdited = () => storage.set('dashboardLastEdited', Date.now().toString());

/**
 * The collect form settings: loaded from Content Maestro, mirrored in
 * localStorage, and saved back a second after each change.
 */
export function useCollectSettings() {
  const [maxRepos, setMaxRepos] = useState<number | undefined>(() => storage.getInt('dashboardMaxRepos', 5));
  const [since, setSince] = useState(() => storage.get('dashboardSince') || 'daily');
  const [spokenLanguageCode, setSpokenLanguageCode] = useState(() => storage.get('dashboardSpokenLanguageCode') || 'en');
  const [resource, setResource] = useState(() => normalizeResource(storage.get('dashboardResource')));
  const [period, setPeriod] = useState(() => storage.get('dashboardPeriod') || 'past_24_hours');
  const [language, setLanguage] = useState(() => storage.get('dashboardLanguage') || 'All');
  const [isLoaded, setIsLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getCollectSettings();

      const lastEdited = storage.get('dashboardLastEdited');
      const isRecentEdit = lastEdited && (Date.now() - parseInt(lastEdited, 10) < RECENT_EDIT_WINDOW_MS);

      if (!isRecentEdit) {
        setMaxRepos(settings.max_repos);
        setSince(settings.since);
        setSpokenLanguageCode(settings.spoken_language_code);
        setResource(normalizeResource(settings.resource));
        setPeriod(settings.period || 'past_24_hours');
        setLanguage(settings.language || 'All');

        storage.set('dashboardMaxRepos', settings.max_repos.toString());
        storage.set('dashboardSince', settings.since);
        storage.set('dashboardSpokenLanguageCode', settings.spoken_language_code);
        storage.set('dashboardResource', normalizeResource(settings.resource));
        storage.set('dashboardPeriod', settings.period || 'past_24_hours');
        storage.set('dashboardLanguage', settings.language || 'All');
      }
    } catch {
      console.error('Failed to load collect settings');

      const savedResource = normalizeResource(storage.get('dashboardResource'));

      setMaxRepos(storage.getInt('dashboardMaxRepos', 5));
      setSince(storage.get('dashboardSince') || 'daily');
      setSpokenLanguageCode(storage.get('dashboardSpokenLanguageCode') || 'en');
      setResource(savedResource);
      setPeriod(storage.get('dashboardPeriod') || 'past_24_hours');
      setLanguage(storage.get('dashboardLanguage') || 'All');

      if (!storage.get('dashboardMaxRepos')) {
        storage.set('dashboardMaxRepos', '5');
      }
      if (!storage.get('dashboardSince')) {
        storage.set('dashboardSince', 'daily');
      }
      if (!storage.get('dashboardSpokenLanguageCode')) {
        storage.set('dashboardSpokenLanguageCode', 'en');
      }
      storage.set('dashboardResource', savedResource);
      if (!storage.get('dashboardPeriod')) {
        storage.set('dashboardPeriod', 'past_24_hours');
      }
      if (!storage.get('dashboardLanguage')) {
        storage.set('dashboardLanguage', 'All');
      }
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback(async () => {
    try {
      // Don't save if maxRepos is undefined, NaN, or out of bounds
      if (!isValidMaxRepos(maxRepos)) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const response = await updateCollectSettings({
        max_repos: maxRepos,
        resource,
        since,
        spoken_language_code: spokenLanguageCode,
        period,
        language
      });

      if (response.status === 'success') {
        storage.set('dashboardMaxRepos', maxRepos.toString());
        storage.set('dashboardSince', since);
        storage.set('dashboardSpokenLanguageCode', spokenLanguageCode);
        storage.set('dashboardResource', resource);
        storage.set('dashboardPeriod', period);
        storage.set('dashboardLanguage', language);
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error instanceof Error ? `Failed to save settings: ${error.message}` : 'Failed to save settings');
    }
  }, [maxRepos, resource, since, spokenLanguageCode, period, language]);

  // saveSettings changes with every setting, so any edit schedules a save.
  useEffect(() => {
    if (!isLoaded) return;

    // Don't attempt to save if maxRepos is invalid
    if (!isValidMaxRepos(maxRepos)) {
      return;
    }

    const timer = setTimeout(() => {
      saveSettings();
    }, 1000);

    return () => clearTimeout(timer);
  }, [saveSettings, isLoaded, maxRepos]);

  return {
    maxRepos,
    since,
    spokenLanguageCode,
    resource,
    period,
    language,
    /** Pass undefined for an empty or out-of-range input: it is shown but not persisted. */
    changeMaxRepos: (value: number | undefined) => {
      setMaxRepos(value);
      if (value !== undefined) {
        storage.set('dashboardMaxRepos', value.toString());
      }
      markEdited();
    },
    changeResource: (value: string) => {
      setResource(value);
      storage.set('dashboardResource', value);
      markEdited();
    },
    changeSince: (value: string) => {
      setSince(value);
      storage.set('dashboardSince', value);
      markEdited();
    },
    changeSpokenLanguageCode: (value: string) => {
      setSpokenLanguageCode(value);
      storage.set('dashboardSpokenLanguageCode', value);
      markEdited();
    },
    changePeriod: (value: string) => {
      setPeriod(value);
      storage.set('dashboardPeriod', value);
      markEdited();
    },
    changeLanguage: (value: string) => {
      setLanguage(value);
      storage.set('dashboardLanguage', value);
      markEdited();
    },
  };
}
