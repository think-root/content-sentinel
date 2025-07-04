import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TruncatedTextProps } from '../types/repositoryList';

export function TruncatedText({ text, maxChars = 150 }: TruncatedTextProps) {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return <p>-</p>;
  
  const hasMoreText = text.length > maxChars;
  const displayText = expanded ? text : hasMoreText ? text.substring(0, maxChars) + '...' : text;
  
  return (
    <div>
      <p className="whitespace-pre-line break-words leading-relaxed tracking-wide">{displayText}</p>
      {hasMoreText && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-xs flex items-center"
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
        </button>
      )}
    </div>
  );
}