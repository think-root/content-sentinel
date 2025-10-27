import { normalizeTimezoneForIntl } from './timezone-mapper';

export type ValidationResult = { isValid: boolean; message?: string };

// Allowed date format tokens (case-sensitive)
const ALLOWED_DATE_TOKENS = ["DD","MM","YYYY","HH","hh","mm","ss","A","a"] as const;

// Single-character separators allowed between tokens
const ALLOWED_SEPARATORS = /[\s.\-/:]/;

/**
 * Validate a date format string using allowed tokens.
 * Rules:
 * - Must include required tokens: DD, MM, YYYY (any order)
 * - Optional time tokens: HH, hh, mm, ss, A, a
 * - Case-sensitive tokens
 * - Allowed separators: space, ., -, /, :
 * - Reject unknown tokens or characters
 */
export function validateDateFormat(format: string): ValidationResult {
  const value = (format ?? "").trim();
  if (!value) {
    return { isValid: false, message: "Date format is required (e.g., DD.MM.YYYY HH:mm:ss)" };
  }

  const tokensFound: string[] = [];
  let i = 0;

  const startsWithAllowedToken = (s: string, pos: number): string | null => {
    for (const t of ALLOWED_DATE_TOKENS) {
      if (s.startsWith(t, pos)) return t;
    }
    return null;
  };

  while (i < value.length) {
    const token = startsWithAllowedToken(value, i);
    if (token) {
      tokensFound.push(token);
      i += token.length;
      continue;
    }
    const ch = value[i];
    if (ALLOWED_SEPARATORS.test(ch)) {
      i += 1;
      continue;
    }
    // Unknown character or token start
    return {
      isValid: false,
      message: "Allowed values: DD, MM, YYYY, HH, hh, mm, ss, A, a",
    };
  }

  const hasDD = tokensFound.includes("DD");
  const hasMM = tokensFound.includes("MM");
  const hasYYYY = tokensFound.includes("YYYY");
  if (!hasDD || !hasMM || !hasYYYY) {
    return {
      isValid: false,
      message: "Date format must include DD, MM, and YYYY (order flexible)",
    };
  }

  // All checks passed
  return { isValid: true };
}

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

  const hasSupportedValuesOf =
    typeof (Intl as any).supportedValuesOf === "function";
  if (hasSupportedValuesOf) {
    try {
      const supported = (Intl as any).supportedValuesOf("timeZone") as string[];
      if (!supported.includes(normalizedValue)) {
        return {
          isValid: false,
          message: "Timezone not recognized by Intl. Check spelling (e.g., Europe/Kyiv)",
        };
      }
      return { isValid: true };
    } catch {
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