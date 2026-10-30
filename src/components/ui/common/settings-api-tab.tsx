import { AlertCircle } from 'lucide-react';
import type { ApiSettings } from '@/utils/api-settings';
import type { ValidationResult } from '@/utils/language-validation';
import { Input } from '../base/input';
import { Label } from '../base/label';
import { LanguageValidationIndicator } from './language-validation-indicator';

type ServiceSettings = ApiSettings['contentAlchemist'];

interface SettingsApiTabProps {
  settings: ApiSettings;
  languageValidation: ValidationResult;
  isValidatingLanguage: boolean;
  updateSettings: (newSettings: Partial<ApiSettings>) => void;
  updateContentAlchemist: (field: keyof ServiceSettings, value: string) => void;
  updateContentMaestro: (field: keyof ServiceSettings, value: string) => void;
}

export const SettingsApiTab = ({
  settings,
  languageValidation,
  isValidatingLanguage,
  updateSettings,
  updateContentAlchemist,
  updateContentMaestro,
}: SettingsApiTabProps) => (
  <>
    <div className="space-y-4">
      <h3 className="text-sm font-medium border-b pb-2">Content Alchemist API</h3>
      <div className="space-y-2">
        <Label htmlFor="alchemistApiBaseUrl">API Base URL</Label>
        <Input
          type="text"
          id="alchemistApiBaseUrl"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Enter API base URL"
          value={settings.contentAlchemist?.apiBaseUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContentAlchemist('apiBaseUrl', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="alchemistApiBearerToken">API Bearer Token</Label>
        <Input
          type="password"
          id="alchemistApiBearerToken"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Enter API bearer token"
          value={settings.contentAlchemist?.apiBearerToken}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContentAlchemist('apiBearerToken', e.target.value)}
        />
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
    </div>

    <div className="space-y-4">
      <h3 className="text-sm font-medium border-b pb-2">Content Maestro API</h3>
      <div className="space-y-2">
        <Label htmlFor="maestroApiBaseUrl">API Base URL</Label>
        <Input
          type="text"
          id="maestroApiBaseUrl"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Enter API base URL"
          value={settings.contentMaestro?.apiBaseUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContentMaestro('apiBaseUrl', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maestroApiBearerToken">API Bearer Token</Label>
        <Input
          type="password"
          id="maestroApiBearerToken"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Enter API bearer token"
          value={settings.contentMaestro?.apiBearerToken}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateContentMaestro('apiBearerToken', e.target.value)}
        />
      </div>
    </div>
  </>
);
