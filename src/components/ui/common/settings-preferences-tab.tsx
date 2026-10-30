import { AlertCircle } from 'lucide-react';
import type { ApiSettings } from '@/utils/api-settings';
import type { ValidationResult } from '@/utils/language-validation';
import { DATE_FORMAT_PRESETS, hasTime, sampleDate, stripSeconds, withSeconds } from '@/utils/date-format';
import { Input } from '../base/input';
import { Label } from '../base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select';
import { LanguageValidationIndicator } from './language-validation-indicator';

interface SettingsPreferencesTabProps {
  settings: ApiSettings;
  timezoneError: string | null;
  languageValidation: ValidationResult;
  isValidatingLanguage: boolean;
  updateSettings: (newSettings: Partial<ApiSettings>) => void;
}

export const SettingsPreferencesTab = ({
  settings,
  timezoneError,
  languageValidation,
  isValidatingLanguage,
  updateSettings,
}: SettingsPreferencesTabProps) => {
  const baseDateFormat = stripSeconds(settings.dateFormat || 'DD.MM.YYYY HH:mm');
  const includeSeconds = (settings.dateFormat || '').includes('ss');
  const dateFormatOptions = DATE_FORMAT_PRESETS.includes(baseDateFormat)
    ? DATE_FORMAT_PRESETS
    : [baseDateFormat, ...DATE_FORMAT_PRESETS];

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="dateFormat">Date Format</Label>
        <Select
          value={baseDateFormat}
          onValueChange={(value) => updateSettings({ dateFormat: withSeconds(value, includeSeconds) })}
        >
          <SelectTrigger id="dateFormat">
            <SelectValue placeholder="Select date format" />
          </SelectTrigger>
          <SelectContent>
            {dateFormatOptions.map((format) => (
              <SelectItem key={format} value={format}>
                {format} <span className="text-muted-foreground">— {sampleDate(format)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasTime(baseDateFormat) && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dateFormatSeconds"
              className="h-4 w-4 accent-primary cursor-pointer"
              checked={includeSeconds}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings({ dateFormat: withSeconds(baseDateFormat, e.target.checked) })}
            />
            <Label htmlFor="dateFormatSeconds" className="cursor-pointer font-normal">Show seconds</Label>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          type="text"
          id="timezone"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Enter timezone (e.g. Europe/Kyiv)"
          value={settings.timezone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings({ timezone: e.target.value.trim() })}
        />
        {timezoneError ? (
          <p className="text-sm text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {timezoneError}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Europe/Kyiv, Europe/London, America/New_York
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayLanguage">Language Code</Label>
        <div className="relative">
          <Input
            type="text"
            id="displayLanguage"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="uk or en, uk, fr"
            value={settings.displayLanguage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSettings({ displayLanguage: e.target.value.toLowerCase() })}
            className={settings.displayLanguage.trim() ? 'pr-10' : ''}
          />
          {settings.displayLanguage.trim() && (
            <LanguageValidationIndicator validation={languageValidation} isValidating={isValidatingLanguage} />
          )}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground flex items-start gap-2 leading-snug mt-1">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-[2px]" />
          <span className="whitespace-normal break-words">
            Language code for displaying posts. Uses{' '}
            <a
              href="https://en.wikipedia.org/wiki/ISO_639-1"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              ISO 639-1
            </a>{' '}
            standard.
          </span>
        </div>
      </div>
    </>
  );
};
