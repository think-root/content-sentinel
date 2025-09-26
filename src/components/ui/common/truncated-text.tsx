import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/base/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/base/tooltip';

interface TruncatedTextProps {
  text: string;
  maxChars?: number;
}

export function TruncatedText({ text, maxChars = 150 }: TruncatedTextProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return <p>-</p>;
  
  const hasMoreText = text.length > maxChars;
  const displayText = expanded ? text : hasMoreText ? text.substring(0, maxChars) + '...' : text;

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="whitespace-pre-line break-words leading-relaxed tracking-wide cursor-default">
              {displayText}
            </p>
          </TooltipTrigger>
          {hasMoreText && !expanded && (
            <TooltipContent side="top" align="start" className="max-w-[400px]">
              <p className="whitespace-pre-line break-words text-sm">{text}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      {hasMoreText && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs h-6 px-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show more
            </>
          )}
        </Button>
      )}
    </div>
  );
}