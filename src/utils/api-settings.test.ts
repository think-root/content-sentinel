import { afterEach, describe, expect, it } from 'vitest';
import { areApiSettingsEqual, getApiSettings, LOCAL_STORAGE_KEY, type ApiSettings } from './api-settings';

const settings = (overrides: Partial<ApiSettings> = {}): ApiSettings => ({
  dateFormat: 'DD.MM.YYYY HH:mm',
  timezone: 'Europe/Kyiv',
  displayLanguage: 'uk',
  ...overrides,
});

describe('areApiSettingsEqual', () => {
  it('ignores whitespace, language case and empty values that mean the default', () => {
    expect(areApiSettingsEqual(
      settings(),
      settings({ dateFormat: '', timezone: ' Europe/Kyiv ', displayLanguage: 'UK' })
    )).toBe(true);
  });

  it('detects a changed field', () => {
    expect(areApiSettingsEqual(settings(), settings({ timezone: 'Europe/London' }))).toBe(false);
  });
});

describe('getApiSettings', () => {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  } as Storage;

  afterEach(() => store.clear());

  it('removes the service URLs and tokens older versions stored', () => {
    store.set(LOCAL_STORAGE_KEY, JSON.stringify({
      apiBaseUrl: '',
      apiBearerToken: '',
      timezone: 'Europe/London',
      displayLanguage: 'en',
      contentAlchemist: { apiBaseUrl: 'https://alchemist', apiBearerToken: 'a' },
      contentMaestro: { apiBaseUrl: 'https://maestro', apiBearerToken: 'm' },
    }));

    expect(getApiSettings()).toEqual(settings({ timezone: 'Europe/London', displayLanguage: 'en' }));
    expect(JSON.parse(store.get(LOCAL_STORAGE_KEY)!)).toEqual({ timezone: 'Europe/London', displayLanguage: 'en' });
  });

  it('leaves current settings untouched', () => {
    const saved = JSON.stringify({ timezone: 'Europe/London' });
    store.set(LOCAL_STORAGE_KEY, saved);

    expect(getApiSettings().timezone).toBe('Europe/London');
    expect(store.get(LOCAL_STORAGE_KEY)).toBe(saved);
  });
});
