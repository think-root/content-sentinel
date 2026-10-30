import { storage } from '../lib/storage';
export interface ApiSettings {
  apiBaseUrl: string;
  apiBearerToken: string;
  dateFormat: string;
  timezone: string;
  displayLanguage: string;
  contentAlchemist: {
    apiBaseUrl: string;
    apiBearerToken: string;
  };
  contentMaestro: {
    apiBaseUrl: string;
    apiBearerToken: string;
  };
}

export const LOCAL_STORAGE_KEY = "api_settings";

const defaultSettings: ApiSettings = {
  apiBaseUrl: "",
  apiBearerToken: "",
  dateFormat: "DD.MM.YYYY HH:mm",
  timezone: "Europe/Kyiv",
  displayLanguage: "uk",
  contentAlchemist: {
    apiBaseUrl: "",
    apiBearerToken: "",
  },
  contentMaestro: {
    apiBaseUrl: "",
    apiBearerToken: "",
  },
};

export const getApiSettings = (): ApiSettings => {
  const settings = storage.get(LOCAL_STORAGE_KEY);
  if (!settings) {
    return defaultSettings;
  }

  const parsedSettings = JSON.parse(settings);
  return {
    ...defaultSettings,
    ...parsedSettings,
    contentAlchemist: {
      ...defaultSettings.contentAlchemist,
      ...parsedSettings.contentAlchemist,
    },
    contentMaestro: {
      ...defaultSettings.contentMaestro,
      ...parsedSettings.contentMaestro,
    },
  };
};

export const isApiConfigured = (): boolean => {
  const settings = getApiSettings();
  return !!(
    settings.contentAlchemist?.apiBaseUrl && 
    settings.contentAlchemist?.apiBearerToken && 
    settings.contentMaestro?.apiBaseUrl && 
    settings.contentMaestro?.apiBearerToken
  );
};

const normalizeValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeSettingsForCompare = (s: ApiSettings) => ({
  apiBaseUrl: normalizeValue(s.apiBaseUrl),
  apiBearerToken: normalizeValue(s.apiBearerToken),
  dateFormat: normalizeValue(s.dateFormat) || 'DD.MM.YYYY HH:mm',
  timezone: normalizeValue(s.timezone) || 'Europe/Kyiv',
  displayLanguage: (normalizeValue(s.displayLanguage) || 'uk').toLowerCase(),
  contentAlchemist: {
    apiBaseUrl: normalizeValue(s.contentAlchemist?.apiBaseUrl),
    apiBearerToken: normalizeValue(s.contentAlchemist?.apiBearerToken),
  },
  contentMaestro: {
    apiBaseUrl: normalizeValue(s.contentMaestro?.apiBaseUrl),
    apiBearerToken: normalizeValue(s.contentMaestro?.apiBearerToken),
  },
});

/**
 * Whether two settings would save the same thing: whitespace, letter case of
 * the language code and empty values that fall back to the defaults are ignored.
 */
export const areApiSettingsEqual = (oldSettings: ApiSettings, currentSettings: ApiSettings): boolean => {
  const a = normalizeSettingsForCompare(oldSettings);
  const b = normalizeSettingsForCompare(currentSettings);
  return (
    a.apiBaseUrl === b.apiBaseUrl &&
    a.apiBearerToken === b.apiBearerToken &&
    a.dateFormat === b.dateFormat &&
    a.timezone === b.timezone &&
    a.displayLanguage === b.displayLanguage &&
    a.contentAlchemist.apiBaseUrl === b.contentAlchemist.apiBaseUrl &&
    a.contentAlchemist.apiBearerToken === b.contentAlchemist.apiBearerToken &&
    a.contentMaestro.apiBaseUrl === b.contentMaestro.apiBaseUrl &&
    a.contentMaestro.apiBearerToken === b.contentMaestro.apiBearerToken
  );
};
