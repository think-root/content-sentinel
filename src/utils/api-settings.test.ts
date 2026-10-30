import { describe, expect, it } from 'vitest';
import { areApiSettingsEqual, type ApiSettings } from './api-settings';

const settings = (overrides: Partial<ApiSettings> = {}): ApiSettings => ({
  apiBaseUrl: '',
  apiBearerToken: '',
  dateFormat: 'DD.MM.YYYY HH:mm',
  timezone: 'Europe/Kyiv',
  displayLanguage: 'uk',
  contentAlchemist: { apiBaseUrl: 'https://alchemist', apiBearerToken: 'a' },
  contentMaestro: { apiBaseUrl: 'https://maestro', apiBearerToken: 'm' },
  ...overrides,
});

describe('areApiSettingsEqual', () => {
  it('ignores whitespace, language case and empty values that mean the default', () => {
    expect(areApiSettingsEqual(
      settings(),
      settings({ dateFormat: '', timezone: ' Europe/Kyiv ', displayLanguage: 'UK' })
    )).toBe(true);
  });

  it('detects a changed field, including nested API settings', () => {
    expect(areApiSettingsEqual(settings(), settings({ timezone: 'Europe/London' }))).toBe(false);
    expect(areApiSettingsEqual(
      settings(),
      settings({ contentMaestro: { apiBaseUrl: 'https://maestro', apiBearerToken: 'other' } })
    )).toBe(false);
  });
});
