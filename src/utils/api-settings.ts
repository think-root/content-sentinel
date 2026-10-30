import { storage } from '../lib/storage';

// The name is historical: these used to include the service URLs and tokens,
// which now live on the server (see api-proxy.js).
export interface ApiSettings {
  dateFormat: string;
  timezone: string;
  displayLanguage: string;
}

export const LOCAL_STORAGE_KEY = "api_settings";

const defaultSettings: ApiSettings = {
  dateFormat: "DD.MM.YYYY HH:mm",
  timezone: "Europe/Kyiv",
  displayLanguage: "uk",
};

// Fields older versions stored, bearer tokens included.
const LEGACY_FIELDS = ['apiBaseUrl', 'apiBearerToken', 'contentAlchemist', 'contentMaestro'];

export const getApiSettings = (): ApiSettings => {
  const settings = storage.get(LOCAL_STORAGE_KEY);
  if (!settings) {
    return defaultSettings;
  }

  const parsedSettings = JSON.parse(settings);

  // Drop the credentials an older version left in the browser.
  if (LEGACY_FIELDS.some((field) => field in parsedSettings)) {
    for (const field of LEGACY_FIELDS) delete parsedSettings[field];
    storage.set(LOCAL_STORAGE_KEY, JSON.stringify(parsedSettings));
  }

  return {
    ...defaultSettings,
    ...parsedSettings,
  };
};

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeSettingsForCompare = (s: ApiSettings) => ({
  dateFormat: normalizeValue(s.dateFormat) || 'DD.MM.YYYY HH:mm',
  timezone: normalizeValue(s.timezone) || 'Europe/Kyiv',
  displayLanguage: (normalizeValue(s.displayLanguage) || 'uk').toLowerCase(),
});

/**
 * Whether two settings would save the same thing: whitespace, letter case of
 * the language code and empty values that fall back to the defaults are ignored.
 */
export const areApiSettingsEqual = (oldSettings: ApiSettings, currentSettings: ApiSettings): boolean => {
  const a = normalizeSettingsForCompare(oldSettings);
  const b = normalizeSettingsForCompare(currentSettings);
  return (
    a.dateFormat === b.dateFormat &&
    a.timezone === b.timezone &&
    a.displayLanguage === b.displayLanguage
  );
};
