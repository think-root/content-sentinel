import { useState, useEffect, useCallback } from 'react';
import { Loader2, GitPullRequest, Play, AlertCircle, FolderDown, Zap } from 'lucide-react';
import { ResultDialog } from '../common/result-dialog';
import { getCollectSettings, updateCollectSettings, ManualGenerateResponse } from '@/api';
import { toast } from '../common/toast-config';
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card';
import { Input } from '../base/input';
import { Label } from '../base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select';
import { Button } from '../base/button';
import { Textarea } from '../base/textarea';

// Function to validate GitHub repository URLs
const isValidGithubRepoUrl = (url: string): boolean => {
  // GitHub repository URL pattern
  const githubUrlPattern = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/;
  return githubUrlPattern.test(url.trim());
};

const LANGUAGE_MAPPING = {
  'English': 'en',
  'German': 'de',
  'French': 'fr',
  'Spanish': 'es'
};

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;

interface GenerateFormProps {
  onManualGenerate: (url: string) => Promise<ManualGenerateResponse>;
  onAutoGenerate: (
    maxRepos: number,
    resource: string,
    since: string,
    spokenLanguageCode: string,
    period: string,
    language: string
  ) => Promise<ManualGenerateResponse>;
}

export function GenerateForm({ onManualGenerate, onAutoGenerate }: GenerateFormProps) {
  const [url, setUrl] = useState('');
  const [maxRepos, setMaxRepos] = useState<number | undefined>(() => {
    const saved = localStorage.getItem('dashboardMaxRepos');
    if (!saved) return 5;
    const parsed = parseInt(saved, 10);
    return Number.isNaN(parsed) ? 5 : parsed;
  });
  const [since, setSince] = useState(() => {
    const saved = localStorage.getItem('dashboardSince');
    return saved || 'daily';
  });
  const [spokenLanguageCode, setSpokenLanguageCode] = useState(() => {
    const saved = localStorage.getItem('dashboardSpokenLanguageCode');
    return saved || 'en';
  });
  const [resource, setResource] = useState(() => {
    const saved = localStorage.getItem('dashboardResource');
    return saved || 'github';
  });
  const [period, setPeriod] = useState(() => {
    const saved = localStorage.getItem('dashboardPeriod');
    return saved || 'past_24_hours';
  });
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('dashboardLanguage');
    return saved || 'All';
  });
  const [isManualLoading, setIsManualLoading] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [addedRepos, setAddedRepos] = useState<string[]>([]);
  const [notAddedRepos, setNotAddedRepos] = useState<string[]>([]);
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [dialogContext, setDialogContext] = useState<'manual' | 'collect'>('collect');

  const [isLoaded, setIsLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await getCollectSettings();

      const lastEdited = localStorage.getItem('dashboardLastEdited');
      const isRecentEdit = lastEdited && (Date.now() - parseInt(lastEdited, 10) < 20000); // 20 seconds window

      if (!isRecentEdit) {
        setMaxRepos(settings.max_repos);
        setSince(settings.since);
        setSpokenLanguageCode(settings.spoken_language_code);
        setResource(settings.resource || 'github');
        setPeriod(settings.period || 'past_24_hours');
        setLanguage(settings.language || 'All');

        localStorage.setItem('dashboardMaxRepos', settings.max_repos.toString());
        localStorage.setItem('dashboardSince', settings.since);
        localStorage.setItem('dashboardSpokenLanguageCode', settings.spoken_language_code);
        localStorage.setItem('dashboardResource', settings.resource || 'github');
        localStorage.setItem('dashboardPeriod', settings.period || 'past_24_hours');
        localStorage.setItem('dashboardLanguage', settings.language || 'All');
      }
    } catch {
      console.error('Failed to load collect settings');

      const savedMaxRepos = localStorage.getItem('dashboardMaxRepos') || '5';
      const savedSince = localStorage.getItem('dashboardSince') || 'daily';
      const savedLanguageCode = localStorage.getItem('dashboardSpokenLanguageCode') || 'en';
      const savedResource = localStorage.getItem('dashboardResource') || 'github';
      const savedPeriod = localStorage.getItem('dashboardPeriod') || 'past_24_hours';
      const savedLanguage = localStorage.getItem('dashboardLanguage') || 'All';

      const parsedMaxRepos = parseInt(savedMaxRepos, 10);
      setMaxRepos(Number.isNaN(parsedMaxRepos) ? 5 : parsedMaxRepos);
      setSince(savedSince);
      setSpokenLanguageCode(savedLanguageCode);
      setResource(savedResource);
      setPeriod(savedPeriod);
      setLanguage(savedLanguage);

      if (!localStorage.getItem('dashboardMaxRepos')) {
        localStorage.setItem('dashboardMaxRepos', '5');
      }
      if (!localStorage.getItem('dashboardSince')) {
        localStorage.setItem('dashboardSince', 'daily');
      }
      if (!localStorage.getItem('dashboardSpokenLanguageCode')) {
        localStorage.setItem('dashboardSpokenLanguageCode', 'en');
      }
      if (!localStorage.getItem('dashboardResource')) {
        localStorage.setItem('dashboardResource', 'github');
      }
      if (!localStorage.getItem('dashboardPeriod')) {
        localStorage.setItem('dashboardPeriod', 'past_24_hours');
      }
      if (!localStorage.getItem('dashboardLanguage')) {
        localStorage.setItem('dashboardLanguage', 'All');
      }
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSettings = useCallback(async () => {
    try {
      // Don't save if maxRepos is undefined, NaN, or out of bounds
      if (maxRepos === undefined || Number.isNaN(maxRepos) || maxRepos < 1 || maxRepos > 100) {
        return;
      }

      await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
      const response = await updateCollectSettings({
        max_repos: maxRepos,
        resource,
        since,
        spoken_language_code: spokenLanguageCode,
        period,
        language
      });

      if (response.status === 'success') {
        // toast.success(response.message || 'Settings saved successfully');

        localStorage.setItem('dashboardMaxRepos', maxRepos.toString());
        localStorage.setItem('dashboardSince', since);
        localStorage.setItem('dashboardSpokenLanguageCode', spokenLanguageCode);
        localStorage.setItem('dashboardResource', resource);
        localStorage.setItem('dashboardPeriod', period);
        localStorage.setItem('dashboardLanguage', language);
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error(error instanceof Error ? `Failed to save settings: ${error.message}` : 'Failed to save settings');
    }
  }, [maxRepos, resource, since, spokenLanguageCode, period, language]);

  useEffect(() => {
    if (!isLoaded) return;

    // Don't attempt to save if maxRepos is invalid
    if (maxRepos === undefined || Number.isNaN(maxRepos) || maxRepos < 1 || maxRepos > 100) {
      return;
    }

    const timer = setTimeout(() => {
      handleSaveSettings();
    }, 1000);

    return () => clearTimeout(timer);
  }, [handleSaveSettings, isLoaded, maxRepos]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url && !isManualLoading) {
      try {
        setIsManualLoading(true);

        // Check if input contains valid GitHub repository URLs
        const urls = url.split(/\s+/).filter(u => u.trim());
        const invalidUrls = urls.filter(u => !isValidGithubRepoUrl(u));

        if (invalidUrls.length > 0) {
          // If there are invalid URLs, show error dialog with a single clear message
          setAddedRepos([]);

          // Use the first invalid URL as the example in the error message
          const invalidUrl = invalidUrls[0];
          setNotAddedRepos([invalidUrl]);

          const errorMap: Record<string, string> = {};
          errorMap[invalidUrl] = `Invalid GitHub repository URL format. URLs should be in the format: https://github.com/username/repository`;

          setErrorMessages(errorMap);
          setDialogContext('manual');
          setIsResultDialogOpen(true);
        } else {
          // All URLs are valid, proceed with API call
          await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
          const response = await onManualGenerate(url);

          const added = response.added || [];
          const notAdded = response.dont_added || [];

          setAddedRepos(added as string[]);
          setNotAddedRepos(notAdded as string[]);

          const map: Record<string, string> = {};

          // Map detailed errors if available
          if (response.error_details) {
            Object.entries(response.error_details).forEach(([repoUrl, detail]) => {
              map[repoUrl] = detail.message;
            });
          }

          // Fallback to error_message or default if detailed error missing
          if (Object.keys(map).length === 0 && response.error_message && response.error_message.trim() !== '') {
            (response.dont_added || []).forEach(repo => {
              if (!map[repo]) {
                map[repo] = response.error_message!;
              }
            });
          }

          setErrorMessages(map);

          setDialogContext('manual');
          setIsResultDialogOpen(true);
        }

        setUrl('');

        const textarea = document.getElementById('url') as HTMLTextAreaElement;
        if (textarea) {
          textarea.style.height = '38px';
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to process manual generation');
      } finally {
        setTimeout(() => {
          setIsManualLoading(false);
        }, 500);
      }
    }
    return false;
  };

  const handleAutoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAutoLoading) {
      try {
        setIsAutoLoading(true);
        await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
        const response = await onAutoGenerate(maxRepos || 5, resource, since, spokenLanguageCode, period, language);

        // Always set added and notAdded from the response
        const added = response.added || [];
        const notAdded = response.dont_added || [];

        setAddedRepos(added as string[]);
        setNotAddedRepos(notAdded as string[]);

        // Build errorMessages map and set it
        const map: Record<string, string> = {};

        // Map detailed errors if available
        if (response.error_details) {
          Object.entries(response.error_details).forEach(([repoUrl, detail]) => {
            map[repoUrl] = detail.message;
          });
        }

        if (response.error_message && response.error_message.trim() !== '') {
          (response.dont_added || []).forEach(repo => {
            if (!map[repo]) {
              map[repo] = response.error_message!;
            }
          });
        }
        setErrorMessages(map);

        // Always open the dialog to show results (even if no repositories were found)
        setDialogContext('collect');
        setIsResultDialogOpen(true);
      } catch (error) {
        console.error(error);
        toast.error('Failed to process auto generation');
      } finally {
        setTimeout(() => {
          setIsAutoLoading(false);
        }, 500);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <ResultDialog
        isOpen={isResultDialogOpen}
        onClose={() => setIsResultDialogOpen(false)}
        added={addedRepos}
        notAdded={notAddedRepos}
        errorMessages={errorMessages}
        context={dialogContext}
        title={dialogContext === 'manual' ? 'Manual Generation' : 'Collect posts'}
      />

      {/* Manual Generation Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitPullRequest className="h-5 w-5 text-muted-foreground mr-2" />
            Manual Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Generate a post from repository URLs. Separate multiple URLs with spaces</span>
          </p>
          <form onSubmit={handleManualSubmit}>
            <div className="mb-4">
              <Label htmlFor="url">
                Repository URLs
              </Label>
              <div className="mt-1 flex rounded-md shadow-sm relative">
                <Textarea
                  name="url"
                  id="url"
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setUrl(e.target.value);
                  }}
                  disabled={isManualLoading}
                  rows={1}
                  style={{
                    resize: 'both',
                    minHeight: '38px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    height: 'auto'
                  }}
                  className={`flex-1 min-w-0 block w-full pr-2 ${isManualLoading ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                  placeholder="https://github.com/user/repo1"
                  onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';

                    if (target.value.trim() === '') {
                      target.style.height = '38px';
                    } else {
                      const newHeight = Math.min(target.scrollHeight, 300);
                      target.style.height = `${newHeight}px`;
                    }
                  }}
                />

              </div>
            </div>
            <div className="space-y-2">
              <Button
                type="submit"
                size="sm"
                disabled={isManualLoading}
                className="w-full sm:w-auto min-w-[120px]"
              >
                {isManualLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {isManualLoading ? 'Processing...' : 'Generate'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>


      {/* Collect Posts Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderDown className="h-5 w-5 text-muted-foreground mr-2" />
            Collect posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              Manage collect settings and manually generate new posts from {resource === 'github' ? 'GitHub' : 'OssInsight'}{' '}
              <a
                href={resource === 'github' ? "https://github.com/trending" : "https://ossinsight.io/"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                trends
              </a>
            </span>
          </p>
          <form onSubmit={handleAutoSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="maxRepos">
                  Count
                </Label>
                <Input
                  type="number"
                  name="maxRepos"
                  id="maxRepos"
                  value={maxRepos || ''}
                  onChange={(e) => {
                    const numValue = e.target.valueAsNumber;
                    if (!Number.isNaN(numValue) && numValue >= 1 && numValue <= 100) {
                      // Valid number - set state and persist to localStorage
                      setMaxRepos(numValue);
                      localStorage.setItem('dashboardMaxRepos', numValue.toString());
                      localStorage.setItem('dashboardLastEdited', Date.now().toString());
                    } else if (e.target.value === '') {
                      // Empty field - set to undefined, don't persist
                      setMaxRepos(undefined);
                      localStorage.setItem('dashboardLastEdited', Date.now().toString());
                    } else {
                      // Invalid input (NaN or out of bounds) - set to undefined, don't persist
                      setMaxRepos(undefined);
                      localStorage.setItem('dashboardLastEdited', Date.now().toString());
                    }
                  }}
                  min="1"
                  max="100"
                  disabled={isAutoLoading}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="resource">
                  Resource
                </Label>
                <Select
                  value={resource}
                  onValueChange={(value: string) => {
                    setResource(value);
                    localStorage.setItem('dashboardResource', value);
                    localStorage.setItem('dashboardLastEdited', Date.now().toString());
                  }}
                  disabled={isAutoLoading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="ossinsight">OssInsight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {resource === 'github' && (
                <>
                  <div>
                    <Label htmlFor="since">
                      Date range
                    </Label>
                    <Select
                      value={since}
                      onValueChange={(value: string) => {
                        setSince(value);
                        localStorage.setItem('dashboardSince', value);
                        localStorage.setItem('dashboardLastEdited', Date.now().toString());
                      }}
                      disabled={isAutoLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="language">
                      Spoken Language
                    </Label>
                    <Select
                      value={Object.entries(LANGUAGE_MAPPING).find(([, code]) => code === spokenLanguageCode)?.[0] || 'English'}
                      onValueChange={(value: string) => {
                        const languageCode = LANGUAGE_MAPPING[value as keyof typeof LANGUAGE_MAPPING];
                        setSpokenLanguageCode(languageCode);
                        localStorage.setItem('dashboardSpokenLanguageCode', languageCode);
                        localStorage.setItem('dashboardLastEdited', Date.now().toString());
                      }}
                      disabled={isAutoLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(LANGUAGE_MAPPING).map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {resource === 'ossinsight' && (
                <>
                  <div>
                    <Label htmlFor="period">
                      Period
                    </Label>
                    <Select
                      value={period}
                      onValueChange={(value: string) => {
                        setPeriod(value);
                        localStorage.setItem('dashboardPeriod', value);
                        localStorage.setItem('dashboardLastEdited', Date.now().toString());
                      }}
                      disabled={isAutoLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="past_24_hours">Past 24 Hours</SelectItem>
                        <SelectItem value="past_week">Past Week</SelectItem>
                        <SelectItem value="past_month">Past Month</SelectItem>
                        <SelectItem value="past_3_months">Past 3 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="progLanguage">
                      Language
                    </Label>
                    <Input
                      type="text"
                      name="progLanguage"
                      id="progLanguage"
                      value={language}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLanguage(value);
                        localStorage.setItem('dashboardLanguage', value);
                        localStorage.setItem('dashboardLastEdited', Date.now().toString());
                      }}
                      disabled={isAutoLoading}
                      className="mt-1"
                      placeholder="e.g. Python, JavaScript"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Programming language, separate multiple languages with commas (e.g. Go, Java). Use "All" for any language.
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
              <Button
                type="submit"
                size="sm"
                disabled={isAutoLoading}
                title="Generate posts out of collect schedule"
                className="w-full sm:w-auto min-w-[150px]"
              >
                {isAutoLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isAutoLoading ? 'Processing...' : 'Trigger'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}