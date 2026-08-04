import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Menu, RotateCw } from 'lucide-react';
import { ThemeToggle } from '../common/theme-toggle';
import { RefreshIndicator } from '../common/refresh-indicator';
import { SettingsButton } from '../common/settings-button';
import { Card, CardHeader, CardFooter } from './card';
import { Button } from '../base/button';

interface DashboardLayoutProps {
  children: ReactNode;
  isRefreshing: boolean;
  isSettingsOpen: boolean;
  onSettingsOpen: () => void;
  onSettingsClose: () => void;
  onNavOpen: () => void;
  handleManualRefresh: (showNotification?: boolean) => Promise<boolean>;
  loading: boolean;
  previewsLoading: boolean;
  isApiReady: boolean;
}

export const DashboardLayout = ({
  children,
  isRefreshing,
  onSettingsOpen,
  onNavOpen,
  handleManualRefresh,
  loading,
}: DashboardLayoutProps) => {


  const renderHeader = () => (
    <div className="relative w-full px-4 sm:px-6 lg:px-8 mb-6">
      <Card>
        <CardHeader className="py-3 sm:py-4 px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <Link 
                to="/" 
                onClick={() => window.location.reload()} 
                className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2 sm:gap-3 hover:text-primary cursor-pointer transition-colors truncate"
              >
                <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <span className="truncate">Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onNavOpen}
                className="h-8 w-8 sm:h-10 sm:w-10 md:hidden"
                aria-label="Open navigation"
                aria-haspopup="dialog"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleManualRefresh(true)}
                disabled={loading || isRefreshing}
                className="h-8 w-8 sm:h-10 sm:w-10"
                title={isRefreshing ? "Refreshing..." : "Refresh data"}
              >
                <RotateCw
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </Button>
              <SettingsButton onOpen={onSettingsOpen} />
              <ThemeToggle />
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );

  const renderFooter = () => (
    <div className="w-full px-3 sm:px-6 lg:px-8 mt-4 sm:mt-6">
      <Card>
        <CardFooter className="p-3 sm:p-4 text-muted-foreground justify-center">
          <div className="text-center w-full text-sm">
            Developed by{' '}
            <a href="https://github.com/sigmanor" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
              sigmanor
            </a>{' '}
            with ❤️ and a bit of 🤖{' '}
            <br className="block sm:hidden" />
            Fully{' '}
            <a href="https://github.com/think-root/content-sentinel" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
              open source
            </a>{' '}
            License:{' '}
            <a href="https://github.com/think-root/content-sentinel/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
              MIT
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );


  return (
    <div className="w-full">
      <RefreshIndicator isRefreshing={isRefreshing} />
      <div className="py-3 sm:py-6">
        {renderHeader()}
        <main className="w-full px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
          {children}
        </main>
        {renderFooter()}
      </div>
    </div>
  );
};