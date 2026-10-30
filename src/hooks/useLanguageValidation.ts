import { useCallback, useState } from 'react';
import { languageValidator, type ValidationResult } from '../utils/language-validation';
import { storage, type StorageKey } from '../lib/storage';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const VALID_EMPTY: ValidationResult = { isValid: true, validCodes: [], invalidCodes: [] };

type ValidationCache = Record<string, { result: ValidationResult; ts: number }>;

/** Order- and case-insensitive key for a comma-separated list of codes. */
export const normalizeLanguageCodes = (codes: string) =>
  codes
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(',');

/**
 * Tooltip text for a validation result. The validator can report a valid code
 * without listing it (e.g. when the available-languages list can't be fetched),
 * so there is always a fallback - otherwise hovering the icon shows an empty bubble.
 */
export const describeLanguageValidation = (validation: ValidationResult) =>
  validation.isValid
    ? validation.validCodes.length > 0
      ? `Valid: ${validation.validCodes.join(', ')}`
      : 'Valid language code'
    : validation.message ||
      (validation.invalidCodes.length > 0
        ? `Invalid: ${validation.invalidCodes.join(', ')}`
        : 'Invalid language code');

/**
 * Validates comma-separated ISO 639-1 codes against Content Alchemist. Results
 * are cached under `cacheKey` for an hour: a cached result shows immediately
 * and is refreshed in the background, so revisiting a form doesn't flash a spinner.
 */
export function useLanguageValidation(cacheKey: StorageKey) {
  const [languageValidation, setLanguageValidation] = useState<ValidationResult>(VALID_EMPTY);
  const [isValidatingLanguage, setIsValidatingLanguage] = useState(false);

  const validateLanguageCodes = useCallback(async (codes: string) => {
    const readCache = (): ValidationCache => {
      try {
        const raw = storage.get(cacheKey);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    };

    const writeCache = (codesKey: string, result: ValidationResult) => {
      const cache = readCache();
      cache[codesKey] = { result, ts: Date.now() };
      storage.set(cacheKey, JSON.stringify(cache));
    };

    const raw = codes || '';
    const normalized = normalizeLanguageCodes(raw);

    if (!normalized) {
      setLanguageValidation(VALID_EMPTY);
      return;
    }

    // Try cache first to avoid spinner/flicker
    const entry = readCache()[normalized];
    if (entry && Date.now() - entry.ts <= CACHE_TTL) {
      setLanguageValidation(entry.result);
      // Background refresh without spinner
      (async () => {
        try {
          const result = await languageValidator.validateLanguageCodes(raw);
          setLanguageValidation(result);
          writeCache(normalized, result);
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
      writeCache(normalized, result);
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
  }, [cacheKey]);

  /** Forget the last result, e.g. when a dialog reopens. */
  const resetLanguageValidation = useCallback(() => {
    setLanguageValidation(VALID_EMPTY);
    setIsValidatingLanguage(false);
  }, []);

  return {
    languageValidation,
    isValidatingLanguage,
    validateLanguageCodes,
    resetLanguageValidation,
  };
}
