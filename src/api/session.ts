import { apiFetch } from './client';

export type Session =
  | { method: 'access' | 'password'; user: string | null }
  | { method: 'none' };

const NO_SESSION: Session = { method: 'none' };

/**
 * How the dashboard is protected and who is signed in. `none` when nothing
 * protects it, and on servers without /auth/session (Vite answers it with the
 * SPA shell).
 */
export async function getSession(): Promise<Session> {
  try {
    const response = await apiFetch('/auth/session');
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return NO_SESSION;
    const session = await response.json();
    return session?.method === 'access' || session?.method === 'password' ? session : NO_SESSION;
  } catch {
    return NO_SESSION;
  }
}

/** Sign out and leave for the login page. */
export async function signOut(session: Session): Promise<void> {
  if (session.method === 'access') {
    window.location.href = '/cdn-cgi/access/logout';
    return;
  }
  const response = await apiFetch('/auth/logout', { method: 'POST' });
  if (!response.ok) throw new Error(`Failed to sign out: ${response.status}`);
  window.location.href = '/login';
}
