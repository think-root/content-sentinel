import { useState, useEffect, useCallback } from 'react';
import { /*Bot,*/ Save, RotateCcw, AlertCircle, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { usePromptSettings } from '@/hooks/usePromptSettings';
import { toast } from '../common/toast-config';
import { ConfirmDialog } from '../common/confirm-dialog';
import { languageValidator, ValidationResult } from '@/utils/language-validation';
import { Card, CardContent, /*CardDescription,*/ CardHeader, /*CardTitle*/ } from '../layout/card';
import { Button } from '../base/button';
import { Input } from '../base/input';
import { Textarea } from '../base/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select';
import { Switch } from '../base/switch';
import { Badge } from '../common/badge';
import { Label } from '../base/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../base/tooltip';

const LLM_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'mistral_api', label: 'Mistral API' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'chutes', label: 'Chutes' }
];

interface PromptSettingsProps {
  isApiReady?: boolean;
}

export const PromptSettings = ({ isApiReady = true }: PromptSettingsProps) => {
  const { settings, loading, saving, fetchSettings, updateSettings, resetToDefaults } = usePromptSettings();

  // Initialize local state from cached settings (when available) to avoid UI flicker on mount/tab switch
  const initialLocal = settings ? {
    use_direct_url: settings.use_direct_url,
    llm_provider: settings.llm_provider,
    model: settings.model,
    temperature: settings.temperature,
    content: settings.content,
    llm_output_language: settings.llm_output_language || ''
  } : {
    use_direct_url: true,
    llm_provider: 'openai',
    model: 'gpt-4.1',
    temperature: 0.5,
    content: '',
    llm_output_language: ''
  };

  const [localSettings, setLocalSettings] = useState(initialLocal);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [temperatureError, setTemperatureError] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [languageValidation, setLanguageValidation] = useState<ValidationResult>({
    isValid: true,
    validCodes: [],
    invalidCodes: []
  });
  const [isValidatingLanguage, setIsValidatingLanguage] = useState(false);

  // Language validation cache helpers
  const LANG_VALIDATION_CACHE_KEY = 'promptLanguageValidationCache';
  const LANG_VALIDATION_TTL = 60 * 60 * 1000; // 1 hour

  const normalizeCodesStr = (codes: string) =>
    codes
      .split(',')
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean)
      .sort()
      .join(',');

  const getValidationCache = (): Record<string, { result: ValidationResult; ts: number }> => {
    try {
      const raw = localStorage.getItem(LANG_VALIDATION_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const setValidationCache = (codesKey: string, result: ValidationResult) => {
    try {
      const cache = getValidationCache();
      cache[codesKey] = { result, ts: Date.now() };
      localStorage.setItem(LANG_VALIDATION_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // no-op
    }
  };

  const getValidationFromCache = (codesKey: string): ValidationResult | null => {
    const cache = getValidationCache();
    const entry = cache[codesKey];
    if (!entry) return null;
    if (Date.now() - entry.ts > LANG_VALIDATION_TTL) return null;
    return entry.result;
  };

  useEffect(() => {
    if (isApiReady) {
      fetchSettings();
    }
  }, [fetchSettings, isApiReady]);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        use_direct_url: settings.use_direct_url,
        llm_provider: settings.llm_provider,
        model: settings.model,
        temperature: settings.temperature,
        content: settings.content,
        llm_output_language: settings.llm_output_language || ''
      });
      setHasUnsavedChanges(false);
      // Re-validate languages from cache immediately (no spinner), then background refresh
      const codes = settings.llm_output_language || '';
      const normalized = normalizeCodesStr(codes);
      if (normalized) {
        const cached = getValidationFromCache(normalized);
        if (cached) {
          setLanguageValidation(cached);
          // Background refresh
          (async () => {
            try {
              const result = await languageValidator.validateLanguageCodes(codes);
              setLanguageValidation(result);
              setValidationCache(normalized, result);
            } catch (error) {
              console.error('Language validation error (init background):', error);
            }
          })();
        } else {
          // Trigger standard validation flow
          validateLanguageCodes(codes);
        }
      } else {
        setLanguageValidation({ isValid: true, validCodes: [], invalidCodes: [] });
      }
    }
  }, [settings]);

  const validateTemperature = (value: number): boolean => {
    if (value < 0 || value > 2) {
      setTemperatureError('Temperature must be between 0.0 and 2.0');
      return false;
    }
    setTemperatureError(null);
    return true;
  };

  const validateLanguageCodes = useCallback(async (codes: string) => {
    const raw = codes || '';
    const normalized = normalizeCodesStr(raw);

    if (!normalized) {
      setLanguageValidation({ isValid: true, validCodes: [], invalidCodes: [] });
      return;
    }

    // Try cache first to avoid spinner/flicker
    const cached = getValidationFromCache(normalized);
    if (cached) {
      setLanguageValidation(cached);
      // Background refresh without spinner
      (async () => {
        try {
          const result = await languageValidator.validateLanguageCodes(raw);
          setLanguageValidation(result);
          setValidationCache(normalized, result);
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
      setValidationCache(normalized, result);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateLanguageCodes(localSettings.llm_output_language);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localSettings.llm_output_language, validateLanguageCodes]);

  const handleFieldChange = useCallback((field: string, value: string | number | boolean) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev, [field]: value };

      // Check if there are unsaved changes
      if (settings) {
        const hasChanges = Object.keys(newSettings).some(key =>
          newSettings[key as keyof typeof newSettings] !== settings[key as keyof typeof settings]
        );
        setHasUnsavedChanges(hasChanges);
      }

      return newSettings;
    });

    if (field === 'temperature' && typeof value === 'number') {
      validateTemperature(value);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!validateTemperature(localSettings.temperature)) {
      return;
    }

    // Validate language codes before saving
    if (!languageValidation.isValid && localSettings.llm_output_language.trim()) {
      toast.error(languageValidation.message || 'Please fix language code errors before saving');
      return;
    }

    if (!hasUnsavedChanges) {
      toast.info('No changes to save', {
        duration: 2000,
      });
      return;
    }

    try {
      await updateSettings({ ...localSettings, llm_output_language: (localSettings.llm_output_language || 'en').toLowerCase() });
      setHasUnsavedChanges(false);
      toast.success('Prompt settings updated successfully');
    } catch (error) {
      console.error('Failed to save prompt settings:', error);
    }
  };

  const handleReset = () => {
    if (!hasUnsavedChanges) {
      toast.info('No changes to reset', {
        duration: 2000,
      });
      return;
    }

    if (settings) {
      setLocalSettings({
        use_direct_url: settings.use_direct_url,
        llm_provider: settings.llm_provider,
        model: settings.model,
        temperature: settings.temperature,
        content: settings.content,
        llm_output_language: settings.llm_output_language || ''
      });
      setHasUnsavedChanges(false);
      setTemperatureError(null);
      setLanguageValidation({
        isValid: true,
        validCodes: [],
        invalidCodes: []
      });
      toast.success('Changes reset successfully');
    }
  };

  const handleResetToDefaults = () => {
    setShowResetDialog(true);
  };

  const confirmResetToDefaults = async () => {
    setShowResetDialog(false);
    try {
      await resetToDefaults();
      setHasUnsavedChanges(false);
      setTemperatureError(null);
      setLanguageValidation({
        isValid: true,
        validCodes: [],
        invalidCodes: []
      });
      toast.success('Settings reset to defaults successfully');
    } catch (error) {
      console.error('Failed to reset to defaults:', error);
      toast.error('Failed to reset settings to defaults');
    }
  };

  const cancelResetToDefaults = () => {
    setShowResetDialog(false);
  };

  return (
    <TooltipProvider>
      <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center">
          {/* <Bot className="h-6 w-6 text-muted-foreground mr-2" /> */}
          {/* <CardTitle>AI Settings</CardTitle> */}
          {hasUnsavedChanges && (
            <Badge
              variant="outline"
              className="ml-3 bg-orange-100 text-orange-800 border-orange-300 font-semibold dark:bg-orange-900 dark:text-orange-100 dark:border-orange-700"
            >
              Unsaved changes
            </Badge>
          )}
        </div>
        {/* <CardDescription className="flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          Configure AI model settings for content generation
        </CardDescription> */}
      </CardHeader>

      <CardContent>
        {!isApiReady ? (
          <div className="text-muted-foreground text-sm text-center py-8">
            Data could not be loaded because API keys are not configured
          </div>
        ) : loading && !settings ? (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
              <div>
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
            <div>
              <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LLM Provider */}
              <div className="space-y-2">
                <Label htmlFor="llm_provider" className="flex items-center">
                  Provider
                </Label>
                <Select
                  value={localSettings.llm_provider}
                  onValueChange={(value) => handleFieldChange('llm_provider', value)}
                  disabled={saving}
                >
                  <SelectTrigger id="llm_provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {LLM_PROVIDERS.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* AI Model */}
              <div className="space-y-2">
                <Label htmlFor="model" className="flex items-center">
                  Model
                </Label>
                <Input
                  id="model"
                  type="text"
                  value={localSettings.model}
                  onChange={(e) => handleFieldChange('model', e.target.value)}
                  disabled={saving}
                  placeholder="e.g., openai/gpt-4.1-mini:online"
                />
              </div>

              {/* LLM Output Language */}
              <div className="space-y-2">
                <Label htmlFor="llm_output_language" className="flex items-center">
                  Output Languages
                </Label>
                <Input
                  id="llm_output_language"
                  type="text"
                  value={localSettings.llm_output_language}
                  onChange={(e) => handleFieldChange('llm_output_language', e.target.value.toLowerCase())}
                  disabled={saving}
                  placeholder="en,uk,fr,de"
                />
                {/* Helper + validation inline under input */}
                <div className="space-y-1 mt-1">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">Comma-separated language codes</div>
                    {localSettings.llm_output_language.trim() && (
                      <div className="flex items-center">
                        {isValidatingLanguage && (
                          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                        )}
                        {!isValidatingLanguage && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                {languageValidation.isValid && (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                )}
                                {!languageValidation.isValid && (
                                  <AlertCircle className="h-3 w-3 text-destructive" />
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {languageValidation.isValid && languageValidation.validCodes.length > 0 && (
                                <div>Valid: {languageValidation.validCodes.join(', ')}</div>
                              )}
                              {!languageValidation.isValid && languageValidation.message && (
                                <div>{languageValidation.message}</div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


            <div className="grid grid-cols-1 gap-6">
              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Temperature ({localSettings.temperature})
                </Label>
                <div className="space-y-2">
                  <input
                    type="range"
                    id="temperature"
                    min="0"
                    max="2"
                    step="0.1"
                    value={localSettings.temperature}
                    onChange={(e) => handleFieldChange('temperature', parseFloat(e.target.value))}
                    disabled={saving}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0.0 (Focused)</span>
                    <span>1.0 (Balanced)</span>
                    <span>2.0 (Creative)</span>
                  </div>
                  {temperatureError && (
                    <div className="flex items-center text-xs text-destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {temperatureError}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Use Direct URL */}
            <div className="flex items-center space-x-2">
              <Switch
                id="use_direct_url"
                checked={localSettings.use_direct_url}
                onCheckedChange={(checked) => handleFieldChange('use_direct_url', checked)}
                disabled={saving}
                title="When enabled, passes the repository URL directly to the LLM instead of the README content. This allows LLMs with internet access to fetch and analyze the repository directly."
              />
              <Label
                htmlFor="use_direct_url"
                className="cursor-pointer"
                title="When enabled, passes the repository URL directly to the LLM instead of the README content. This allows LLMs with internet access to fetch and analyze the repository directly."
              >
                Use direct URL for LLM API calls
              </Label>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <Label htmlFor="content">Prompt</Label>
              <Textarea
                id="content"
                value={localSettings.content}
                onChange={(e) => handleFieldChange('content', e.target.value)}
                disabled={saving}
                placeholder="Enter your AI prompt content here..."
                className="min-h-[130px] resize-vertical"
              />
              <div className="text-xs text-muted-foreground">
                {localSettings.content.length} characters
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-border">
              <Button
                onClick={handleSave}
                disabled={saving || !!temperatureError || (!languageValidation.isValid && !!localSettings.llm_output_language.trim())}
                variant="default"
                    className="w-full sm:w-auto min-w-[120px]"
                    size="sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save'}
              </Button>

              <Button
                onClick={handleReset}
                disabled={saving}
                variant="outline"
                className="w-full sm:w-auto min-w-[120px]"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>

              <Button
                onClick={handleResetToDefaults}
                disabled={saving}
                variant="destructive"
                className="w-full sm:w-auto"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        isOpen={showResetDialog}
        title="Reset to Defaults"
        message="Are you sure you want to reset all prompt settings to defaults? This action cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={confirmResetToDefaults}
        onCancel={cancelResetToDefaults}
        variant="warning"
      />
      </Card>
    </TooltipProvider>
  );
};