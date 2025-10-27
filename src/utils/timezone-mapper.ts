const TIMEZONE_ALIASES: Record<string, string> = {
  'Europe/Kyiv': 'Europe/Kiev',
};

export function normalizeTimezoneForIntl(timezone: string): string {
  const trimmed = timezone.trim();
  return TIMEZONE_ALIASES[trimmed] || trimmed;
}

export function isTimezoneAlias(timezone: string): boolean {
  return timezone.trim() in TIMEZONE_ALIASES;
}

