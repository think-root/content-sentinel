import { LogOut } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export function UserMenu() {
  const { logout } = useAuth();

  return (
    <button
      onClick={() => logout()}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      title="Sign out"
    >
      <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-300" />
    </button>
  );
} 