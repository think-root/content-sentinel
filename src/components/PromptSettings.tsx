import { useState, useEffect, useCallback } from 'react';
import { Bot, Save, RotateCcw, AlertCircle, Loader2, RefreshCw, CheckCircle, Globe } from 'lucide-react';
import { usePromptSettings } from '../hooks/usePromptSettings';
import { toast } from 'react-hot-toast';
import { ConfirmDialog } from './ConfirmDialog';
import { languageValidator, ValidationResult } from '../utils/language-validation';

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

  const [localSettings, setLocalSettings] = useState({
    use_direct_url: true,
    llm_provider: 'openai',
    model: 'gpt-4.1',
    temperature: 0.5,
    content: '',
    llm_output_language: ''
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [temperatureError, setTemperatureError] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [languageValidation, setLanguageValidation] = useState<ValidationResult>({
    isValid: true,
    validCodes: [],
    invalidCodes: []
  });
  const [isValidatingLanguage, setIsValidatingLanguage] = useState(false);
  const [isLanguageInputFocused, setIsLanguageInputFocused] = useState(false);

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
    if (!codes.trim()) {
      setLanguageValidation({
        isValid: true,
        validCodes: [],
        invalidCodes: []
      });
      return;
    }

    setIsValidatingLanguage(true);
    try {
      const result = await languageValidator.validateLanguageCodes(codes);
      setLanguageValidation(result);
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
      toast('No changes to save', {
        icon: 'ℹ️',
        duration: 2000,
      });
      return;
    }

    try {
      await updateSettings(localSettings);
      setHasUnsavedChanges(false);
      toast.success('Prompt settings updated successfully');
    } catch (error) {
      console.error('Failed to save prompt settings:', error);
    }
  };

  const handleReset = () => {
    if (!hasUnsavedChanges) {
      toast('No changes to reset', {
        icon: 'ℹ️',
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <div className="flex items-center mb-6">
        <Bot className="h-6 w-6 text-gray-500 dark:text-gray-400 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Settings</h2>
        {hasUnsavedChanges && (
          <span className="ml-3 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
            Unsaved changes
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center">
        <AlertCircle className="h-4 w-4 mr-2" />
        Configure AI model settings for content generation
      </p>

      {!isApiReady ? (
        <div className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
          Data could not be loaded because API keys are not configured
        </div>
      ) : loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* LLM Provider */}
            <div>
              <label htmlFor="llm_provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provider
              </label>
              <select
                id="llm_provider"
                value={localSettings.llm_provider}
                onChange={(e) => handleFieldChange('llm_provider', e.target.value)}
                disabled={saving}
                className={`block w-full rounded-md border border-gray-300 dark:border-gray-600 ${
                  saving ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700 cursor-pointer'
                } text-gray-900 dark:text-white py-2 pr-10 pl-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none`}
                style={{
                  backgroundPosition: 'right 0.5rem center',
                  backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                {LLM_PROVIDERS.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Model */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model
              </label>
              <input
                type="text"
                id="model"
                value={localSettings.model}
                onChange={(e) => handleFieldChange('model', e.target.value)}
                disabled={saving}
                placeholder="e.g., openai/gpt-4.1-mini:online"
                className={`block w-full rounded-md border border-gray-300 dark:border-gray-600 ${
                  saving ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'
                } text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
              />
            </div>

            {/* LLM Output Language */}
            <div>
              <label htmlFor="llm_output_language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="h-4 w-4 inline mr-1" />
                Output Languages
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  id="llm_output_language"
                  value={localSettings.llm_output_language}
                  onChange={(e) => handleFieldChange('llm_output_language', e.target.value)}
                  onFocus={() => setIsLanguageInputFocused(true)}
                  onBlur={() => setIsLanguageInputFocused(false)}
                  disabled={saving}
                  placeholder="en,uk,fr,de"
                  className={`block w-full rounded-md border ${
                    isLanguageInputFocused && !languageValidation.isValid && localSettings.llm_output_language.trim()
                      ? 'border-red-300 dark:border-red-600 focus:border-red-300 dark:focus:border-red-600 focus:ring-red-500'
                      : isLanguageInputFocused && languageValidation.isValid && localSettings.llm_output_language.trim()
                      ? 'border-green-300 dark:border-green-600 focus:border-green-300 dark:focus:border-green-600 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                  } ${
                    saving ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'
                  } text-gray-900 dark:text-white py-2 px-3 pr-10 focus:outline-none sm:text-sm`}
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Comma-separated language codes (optional)
                  </div>
                  <div className="flex items-center">
                    {isValidatingLanguage && (
                      <Loader2 className="h-3 w-3 animate-spin text-gray-400 mr-2" />
                    )}
                    {!isValidatingLanguage && languageValidation.isValid && localSettings.llm_output_language.trim() && (
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    )}
                    {!isValidatingLanguage && !languageValidation.isValid && localSettings.llm_output_language.trim() && (
                      <AlertCircle className="h-3 w-3 text-red-500 mr-2" />
                    )}
                  </div>
                </div>
                {!languageValidation.isValid && languageValidation.message && (
                  <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {languageValidation.message}
                  </div>
                )}
                {languageValidation.isValid && languageValidation.validCodes.length > 0 && (
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid codes: {languageValidation.validCodes.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Temperature */}
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temperature ({localSettings.temperature})
              </label>
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
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>0.0 (Focused)</span>
                  <span>1.0 (Balanced)</span>
                  <span>2.0 (Creative)</span>
                </div>
                {temperatureError && (
                  <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {temperatureError}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Use Direct URL */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="use_direct_url"
              checked={localSettings.use_direct_url}
              onChange={(e) => handleFieldChange('use_direct_url', e.target.checked)}
              disabled={saving}
              title="When enabled, passes the repository URL directly to the LLM instead of the README content. This allows LLMs with internet access to fetch and analyze the repository directly."
              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded ${
                saving ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
            <label
              htmlFor="use_direct_url"
              title="When enabled, passes the repository URL directly to the LLM instead of the README content. This allows LLMs with internet access to fetch and analyze the repository directly."
              className={`ml-2 block text-sm text-gray-700 dark:text-gray-300 ${
                saving ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              Use direct URL for LLM API calls
            </label>
          </div>

          {/* Prompt */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prompt
            </label>
            <textarea
              id="content"
              value={localSettings.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              disabled={saving}
              style={{ height: '130px' }}
              className={`block w-full rounded-md border border-gray-300 dark:border-gray-600 ${
                saving ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'
              } text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-vertical`}
              placeholder="Enter your AI prompt content here..."
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {localSettings.content.length} characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving || !!temperatureError || (!languageValidation.isValid && !!localSettings.llm_output_language.trim())}
              className={`inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                saving || !!temperatureError || (!languageValidation.isValid && !!localSettings.llm_output_language.trim())
                  ? 'bg-green-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 w-full sm:w-auto min-w-[120px]`}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={handleReset}
              disabled={saving}
              className={`inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium ${
                saving
                  ? 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 w-full sm:w-auto min-w-[120px]`}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>

            <button
              onClick={handleResetToDefaults}
              disabled={saving}
              className={`inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                saving
                  ? 'bg-red-300 cursor-not-allowed'
                  : 'bg-red-800 hover:bg-red-900'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400 dark:focus:ring-offset-gray-800 w-full sm:w-auto`}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
};