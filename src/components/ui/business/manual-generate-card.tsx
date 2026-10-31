import { useState, useCallback, useRef } from 'react';
import { Loader2, GitPullRequest, AlertCircle, Zap, Clipboard } from 'lucide-react';
import type { ManualGenerateResponse } from '@/api/alchemist';
import { parseRepositoryUrls } from '@/utils/github-url';
import { buildGenerateErrorMessages } from '@/utils/generate-result';
import { toast } from '../common/toast-config';
import { Card, CardContent, CardHeader, CardTitle } from '../layout/card';
import { Label } from '../base/label';
import { Button } from '../base/button';
import { Textarea } from '../base/textarea';
import type { GenerateResult } from './generate-form';

const DEBUG_DELAY = import.meta.env.DEV ? Number(import.meta.env.VITE_DEBUG_DELAY) || 0 : 0;
const CLIPBOARD_TEXT_MIME_TYPES = ['text/plain', 'text/uri-list'] as const;

/**
 * The clipboard's text in one request. Each call to the Async Clipboard API
 * makes iOS show its own Paste prompt, so asking with readText first and read
 * after (a copied link can be text/uri-list only) put two prompts in a row.
 */
const readClipboardText = async () => {
  if (!navigator.clipboard?.read) {
    return (await navigator.clipboard.readText()).trim();
  }

  const clipboardItems = await navigator.clipboard.read();

  for (const mimeType of CLIPBOARD_TEXT_MIME_TYPES) {
    for (const item of clipboardItems) {
      if (!item.types.includes(mimeType)) continue;

      const blob = await item.getType(mimeType);
      const text = (await blob.text()).trim();

      if (text) {
        return text;
      }
    }
  }

  return '';
};

interface ManualGenerateCardProps {
  onManualGenerate: (url: string) => Promise<ManualGenerateResponse>;
  onResult: (result: GenerateResult) => void;
}

export function ManualGenerateCard({ onManualGenerate, onResult }: ManualGenerateCardProps) {
  const [url, setUrl] = useState('');
  const urlTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isManualLoading, setIsManualLoading] = useState(false);

  const resizeUrlTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';

    if (textarea.value.trim() === '') {
      textarea.style.height = '38px';
      return;
    }

    const newHeight = Math.min(textarea.scrollHeight, 300);
    textarea.style.height = `${newHeight}px`;
  }, []);

  const handlePasteRepositoryUrls = useCallback(async () => {
    if (isManualLoading) return;

    const textarea = urlTextareaRef.current;

    // Without clipboard access the field itself is the way to paste.
    const focusTextarea = () => {
      if (!textarea) return;

      requestAnimationFrame(() => {
        textarea.focus();
        const caretPosition = textarea.value.length;
        textarea.setSelectionRange(caretPosition, caretPosition);
      });
    };

    if (!navigator.clipboard?.readText) {
      focusTextarea();
      return;
    }

    try {
      const clipboardText = await readClipboardText();

      if (!clipboardText) {
        toast.error('Clipboard has no text');
        return;
      }

      const currentValue = url;
      const selectionStart = textarea?.selectionStart ?? currentValue.length;
      const selectionEnd = textarea?.selectionEnd ?? currentValue.length;
      const before = currentValue.slice(0, selectionStart);
      const after = currentValue.slice(selectionEnd);
      const prefix = before && !/\s$/.test(before) ? ' ' : '';
      const suffix = after && !/^\s/.test(after) ? ' ' : '';
      const nextValue = `${before}${prefix}${clipboardText}${suffix}${after}`;
      const nextCursor = before.length + prefix.length + clipboardText.length;

      setUrl(nextValue);

      requestAnimationFrame(() => {
        if (!urlTextareaRef.current) return;

        urlTextareaRef.current.focus();
        urlTextareaRef.current.setSelectionRange(nextCursor, nextCursor);
        resizeUrlTextarea(urlTextareaRef.current);
      });
    } catch (error) {
      // NotAllowedError: the Paste prompt was dismissed, nothing to report.
      if (error instanceof DOMException && error.name === 'NotAllowedError') return;
      console.error('Clipboard read failed:', error);
      focusTextarea();
      toast.error("Couldn't read the clipboard, paste into the field instead");
    }
  }, [isManualLoading, resizeUrlTextarea, url]);

  const handleUrlTextareaPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    requestAnimationFrame(() => {
      resizeUrlTextarea(textarea);
    });
  }, [resizeUrlTextarea]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (url && !isManualLoading) {
      try {
        setIsManualLoading(true);

        // Normalize the input: valid repository references are sent in canonical
        // form, everything else is reported per URL without blocking the rest.
        const { urls: normalizedUrls, invalid: invalidUrls } = parseRepositoryUrls(url);
        if (normalizedUrls.length === 0 && invalidUrls.length === 0) {
          toast.error('Enter at least one GitHub repository URL');
          return;
        }

        const invalidMap: Record<string, string> = {};
        invalidUrls.forEach(invalidUrl => {
          invalidMap[invalidUrl] = `Not a GitHub repository URL. Expected format: https://github.com/username/repository`;
        });

        if (normalizedUrls.length === 0) {
          onResult({ added: [], notAdded: invalidUrls, errorMessages: invalidMap, context: 'manual' });
        } else {
          await new Promise(resolve => setTimeout(resolve, DEBUG_DELAY));
          const response = await onManualGenerate(normalizedUrls.join(' '));

          onResult({
            added: response.added || [],
            notAdded: [...(response.dont_added || []), ...invalidUrls],
            errorMessages: buildGenerateErrorMessages(response, invalidMap),
            context: 'manual',
          });
        }

        setUrl('');

        if (urlTextareaRef.current) {
          urlTextareaRef.current.style.height = '38px';
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

  return (
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
                className={`flex-1 min-w-0 block w-full ${!url.trim() ? 'pr-11' : 'pr-2'} ${isManualLoading ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
                placeholder="https://github.com/user/repo1"
                ref={urlTextareaRef}
                onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                  resizeUrlTextarea(e.target as HTMLTextAreaElement);
                }}
                onPaste={handleUrlTextareaPaste}
              />
              {!url.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handlePasteRepositoryUrls}
                  disabled={isManualLoading}
                  className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground md:hidden"
                  title="Paste from clipboard"
                  aria-label="Paste from clipboard"
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              )}
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
  );
}
