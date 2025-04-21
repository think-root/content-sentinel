import { ReactNode, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, RotateCw, RefreshCw } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { SettingsButton } from '../SettingsButton';
import { toast } from 'react-hot-toast';

interface DashboardLayoutProps {
  children: ReactNode;
  isSettingsOpen: boolean;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
  handleManualRefresh: () => Promise<boolean>;
  handlePullToRefresh: () => Promise<void>;
  loading: boolean;
  previewsLoading: boolean;
  isMobileDevice: boolean;
  isApiReady: boolean;
}

export const DashboardLayout = ({
  children,
  isSettingsOpen,
  onSettingsOpen,
  onSettingsClose,
  handleManualRefresh,
  handlePullToRefresh,
  loading,
}: DashboardLayoutProps) => {
  const [pullingProgress, setPullingProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const startY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const maxPull = 70;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isPulling = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isPulling = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current !== null && !isRefreshing) {
        const distance = e.touches[0].clientY - startY.current;
        
        if (distance > 0) {
          if (!isPulling && distance > 10) {
            isPulling = true;
          }
          
          if (isPulling) {
            e.preventDefault();
            
            const resistedDistance = Math.min(distance * 0.5, maxPull);
            const progress = resistedDistance / maxPull;
            
            setPullingProgress(progress);
            setTranslateY(resistedDistance);

            if (progress >= 1) {
              startY.current = null;
              setIsRefreshing(true);
              setTranslateY(60);
              isPulling = false;

              void (async () => {
                try {
                  if (containerRef.current) {
                    containerRef.current.classList.add('ptr--refreshing');
                  }
                  
                  const delay = new Promise((res) => setTimeout(res, 1000));
                  await Promise.all([
                    handlePullToRefresh(),
                    delay,
                  ]);

                  toast.success("New data received from server", {
                    id: "new-data-notification",
                    duration: 5000,
                  });
                } catch (error) {
                  console.error("Pull to refresh failed:", error);
                  toast.error("Failed to refresh data", {
                    id: "refresh-error",
                    duration: 5000,
                  });
                } finally {
                  setIsResetting(true);
                  
                  setIsRefreshing(false);
                  setTranslateY(0);
                  setPullingProgress(0);
                  
                  setTimeout(() => {
                    if (containerRef.current) {
                      containerRef.current.classList.remove('ptr--refreshing');
                    }
                    
                    setTimeout(() => {
                      startY.current = null;
                      setIsResetting(false);
                    }, 300);
                  }, 300);
                }
              })();
            }
          }
        }
      }
    };

    const handleTouchEnd = () => {
      if (isRefreshing) return;

      isPulling = false;
      setPullingProgress(0);
      setTranslateY(0);
      startY.current = null;
    };

    const handleScroll = () => {
      if (window.scrollY > 5 && startY.current !== null && !isRefreshing) {
        isPulling = false;
        setPullingProgress(0);
        setTranslateY(0);
        startY.current = null;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isRefreshing, handlePullToRefresh, maxPull]);

  const renderHeader = () => (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <header className="relative z-10 bg-white dark:bg-gray-800 rounded-lg border border-gray-200/20 dark:border-gray-700/20 shadow-sm">
        <div className="flex items-center justify-between py-4 px-4">
          <div className="flex items-center">
            <Link to="/dashboard/" onClick={() => window.location.reload()} className="text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-3 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
              <LayoutDashboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              Dashboard
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-md ${loading ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer'} text-gray-700 dark:text-gray-200 transition-colors`}
              title="Refresh data"
              disabled={loading}
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <SettingsButton isOpen={isSettingsOpen} onOpen={onSettingsOpen} onClose={onSettingsClose} />
            <ThemeToggle />
          </div>
        </div>
      </header>
    </div>
  );

  const renderFooter = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      <footer className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200/20 dark:border-gray-700/20 shadow-sm p-4 text-center text-gray-600 dark:text-gray-400">
        Developed by <a href="https://github.com/Sigmanor" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">sigmanor</a> with ❤️ and a bit of 🤖 Fully <a href="https://github.com/think-root/content-sentinel" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">open source</a> License: <a href="https://github.com/think-root/content-sentinel/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">MIT</a>
      </footer>
    </div>
  );

  const CircularProgress = ({ progress }: { progress: number }) => {
    const radius = 24;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 0.5;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - progress * circumference;

    return (
      <div className="absolute top-1 left-1/2 -translate-x-1/2">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="#d1d5db"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke="#3b82f6"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.2s ease-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto ptr">
      <div
        ref={contentRef}
        className={`will-change-transform ptr__children ${isResetting ? 'ptr--reset' : ''}`}
        style={{ transform: `translateY(${translateY}px)` }}
      >
        {(pullingProgress > 0 || isRefreshing) && (
          <div
            className="relative -z-10 flex items-center justify-center"
            style={{
              height: isRefreshing ? '48px' : `${translateY}px`,
              opacity: Math.sqrt(pullingProgress),
            }}
          >
            {isRefreshing ? (
              <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
            ) : (
              <CircularProgress progress={pullingProgress} />
            )}
          </div>
        )}
        <div className="py-6">
          {renderHeader()}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {children}
          </main>
          {renderFooter()}
        </div>
      </div>
    </div>
  );
};
