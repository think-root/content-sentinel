import { useState } from 'react';
import { LogOut, Loader2, UserRound } from 'lucide-react';
import { signOut, type Session } from '@/api/session';
import { toast } from './toast-config';
import { Button } from '../base/button';

const METHOD_LABELS = {
  access: 'Cloudflare Access',
  password: 'Password',
} as const;

interface SettingsAccountTabProps {
  session: Exclude<Session, { method: 'none' }>;
}

export const SettingsAccountTab = ({ session }: SettingsAccountTabProps) => {
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(session);
      // Stays busy while the browser leaves the page
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out', { id: 'unique-toast-settings' });
      setSigningOut(false);
    }
  };

  return (
    <div className="bg-muted p-4 rounded-lg">
      <div className="flex items-center gap-3 mb-4 min-w-0">
        <UserRound className="h-8 w-8 p-1.5 rounded-full bg-background text-muted-foreground flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{session.user ?? 'Signed in'}</p>
          <p className="text-xs text-muted-foreground">Signed in with {METHOD_LABELS[session.method]}</p>
        </div>
      </div>
      <Button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full sm:w-auto bg-transparent text-destructive shadow-[inset_0_0_0_1px_hsl(var(--destructive)/0.5)] hover:bg-destructive/10 hover:text-destructive"
        size="sm"
        variant="outline"
      >
        {signingOut ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4 mr-2" />
        )}
        Sign out
      </Button>
    </div>
  );
};
