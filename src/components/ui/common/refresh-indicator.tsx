import * as React from 'react';
import { cn } from '@/lib/utils';

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  className?: string;
}

const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  isRefreshing,
  className,
}) => {
  return (
    <div
      className={cn(
        // `top` follows the safe-area inset, not 0: with viewport-fit=cover an
        // installed instance draws under the status bar, which would swallow this
        // 1px bar entirely. Body padding cannot do it - the element is fixed.
        'fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-50 h-1 bg-transparent transition-all duration-300 pointer-events-none',
        isRefreshing ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {isRefreshing && (
        <div className="h-full bg-primary/80 animate-pulse">
          <div className="h-full w-full bg-gradient-to-r from-primary to-primary-foreground/50 animate-pulse-slow" />
        </div>
      )}
    </div>
  );
};

export { RefreshIndicator };
export type { RefreshIndicatorProps };