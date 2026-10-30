import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { ValidationResult } from '@/utils/language-validation';
import { describeLanguageValidation } from '@/hooks/useLanguageValidation';
import { Tooltip, TooltipContent, TooltipTrigger } from '../base/tooltip';

interface LanguageValidationIndicatorProps {
  validation: ValidationResult;
  isValidating: boolean;
}

/** Spinner, check or alert icon placed inside a language codes input. Needs a TooltipProvider. */
export const LanguageValidationIndicator = ({ validation, isValidating }: LanguageValidationIndicatorProps) => (
  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
    {isValidating && (
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    )}
    {!isValidating && (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            {validation.isValid && (
              <CheckCircle className="h-4 w-4 text-success" />
            )}
            {!validation.isValid && (
              <AlertCircle className="h-4 w-4 text-destructive" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div>{describeLanguageValidation(validation)}</div>
        </TooltipContent>
      </Tooltip>
    )}
  </div>
);
