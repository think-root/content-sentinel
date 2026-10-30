import { normalizeTimezoneForIntl } from './timezone-mapper';

export type ValidationResult = { isValid: boolean; message?: string };

/**
 * Validate an IANA timezone string.
 * Rules:
 * - Empty string is valid (defaults may be applied elsewhere)
 * - Basic IANA pattern must match: Region/City (letters and underscores)
 * - Prefer Intl.supportedValuesOf('timeZone') when available
 * - Fallback to constructing Intl.DateTimeFormat with the tz
 */
export function validateTimezone(tz: string): ValidationResult {
  const value = (tz ?? "").trim();
  if (value === "") {
    return { isValid: true };
  }

  const ianaPattern = /^[A-Za-z_]+(?:\/[A-Za-z_]+)+$/;
  if (!ianaPattern.test(value)) {
    return {
      isValid: false,
      message: "Invalid timezone. Use IANA tz like Europe/Kyiv",
    };
  }

  const normalizedValue = normalizeTimezoneForIntl(value);

  // Intl.supportedValuesOf is ES2022, newer than the lib this project targets.
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: "timeZone") => string[];
  };
  if (typeof intl.supportedValuesOf === "function") {
    try {
      const supported = intl.supportedValuesOf("timeZone");
      if (!supported.includes(normalizedValue)) {
        return {
          isValid: false,
          message: "Timezone not recognized by Intl. Check spelling (e.g., Europe/Kyiv)",
        };
      }
      return { isValid: true };
    } catch {
      // Fall through to the DateTimeFormat check below.
    }
  }

  try {
    const fmt = new Intl.DateTimeFormat("en-US", { timeZone: normalizedValue });
    fmt.format(new Date());
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      message: "Timezone not recognized by Intl API. Use IANA tz like Europe/Kyiv",
    };
  }
}