import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, RotateCw } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { SettingsButton } from '../SettingsButton';
import PullToRefresh from 'react-simple-pull-to-refresh';
import { RefreshCw } from 'lucide-react';

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
}

export const DashboardLayout = ({
  children,
  isSettingsOpen,
  onSettingsOpen,
  onSettingsClose,
  handleManualRefresh,
  handlePullToRefresh,
  loading,
  previewsLoading,
  isMobileDevice
}: DashboardLayoutProps) => {
  const renderHeader = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <header className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200/20 dark:border-gray-700/20 shadow-sm">
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

  if (isSettingsOpen) {
    return (
      <div className="w-full h-full">
        <div className="py-6">
          {renderHeader()}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {children}
          </main>
          {renderFooter()}
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh
      onRefresh={handlePullToRefresh}
      isPullable={!loading && !previewsLoading && isMobileDevice}
      pullingContent={
        <div className="text-center py-4 px-6 w-full max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-3">
            <RotateCw className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-800 dark:text-gray-100 font-medium text-base">Pull down to refresh</span>
          </div>
        </div>
      }
      refreshingContent={
        <div className="text-center py-4 px-6 w-full max-w-xs mx-auto">
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="text-gray-800 dark:text-gray-100 font-medium text-base">Refreshing...</span>
          </div>
        </div>
      }
      pullDownThreshold={70}
      maxPullDownDistance={150}
      resistance={2}
      backgroundColor="transparent"
      className="w-full h-full"
    >
      <div className="py-6">
        {renderHeader()}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {children}
        </main>
        {renderFooter()}
      </div>
    </PullToRefresh>
  );
};