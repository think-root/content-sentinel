import { useState } from 'react';
import { Loader2, Play, AlertCircle, FolderDown } from 'lucide-react';
import type { ManualGenerateResponse } from '@/api/alchemist';
import { useCollectSettings } from '@/hooks/useCollectSettings';
import { buildGenerateErrorMessages } from '@/utils/generate-result';
import { toast } from '../common/toast-config';
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card';
import { Input } from '../base/input';
import { Label } from '../base/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../base/select';
import { Button } from '../base/button';
import type { GenerateResult } from './generate-form';

const LANGUAGE_MAPPING = {
  'English': 'en',
  'German': 'de',
  'French': 'fr',
  'Spanish': 'es'
};

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;

interface CollectPostsCardProps {
  onAutoGenerate: (
    maxRepos: number,
    resource: string,
    since: string,
    spokenLanguageCode: string,
    period: string,
    language: string
  ) => Promise<ManualGenerateResponse>;
  onResult: (result: GenerateResult) => void;
}

export function CollectPostsCard({ onAutoGenerate, onResult }: CollectPostsCardProps) {
  const {
    maxRepos,
    since,
    spokenLanguageCode,
    resource,
    period,
    language,
    changeMaxRepos,
    changeResource,
    changeSince,
    changeSpokenLanguageCode,
    changePeriod,
    changeLanguage,
  } = useCollectSettings();
  const [isAutoLoading, setIsAutoLoading] = useState(false);

  const handleAutoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAutoLoading) {
      try {
        setIsAutoLoading(true);
        await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
        const response = await onAutoGenerate(maxRepos || 5, resource, since, spokenLanguageCode, period, language);

        // Always open the dialog to show results (even if no repositories were found)
        onResult({
          added: response.added || [],
          notAdded: response.dont_added || [],
          errorMessages: buildGenerateErrorMessages(response),
          context: 'collect',
        });
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
                  // An empty or out-of-range value is shown but not persisted
                  changeMaxRepos(!Number.isNaN(numValue) && numValue >= 1 && numValue <= 100 ? numValue : undefined);
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
                onValueChange={changeResource}
                disabled={isAutoLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="github">GitHub</SelectItem>
                  {/* OssInsight paused its star-based rankings upstream; re-enable by
                      dropping `disabled` here and the migration in content-maestro. */}
                  <SelectItem value="ossinsight" disabled>OssInsight (paused)</SelectItem>
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
                    onValueChange={changeSince}
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
                      changeSpokenLanguageCode(LANGUAGE_MAPPING[value as keyof typeof LANGUAGE_MAPPING]);
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
                    onValueChange={changePeriod}
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
                    onChange={(e) => changeLanguage(e.target.value)}
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
  );
}
