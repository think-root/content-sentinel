// Requests to the backend services go through the dashboard's own proxy
// (api-proxy.js), which adds the service URL and token on the server.

/** Base URL of each service's API, e.g. `${API_BASE.maestro}/crons`. */
export const API_BASE = {
  alchemist: '/proxy/alchemist/api',
  maestro: '/proxy/maestro/api',
} as const;

// The proxy only answers requests with this header (see api-proxy.js).
const PROXY_REQUEST_HEADER = 'X-Content-Sentinel';

const RELOAD_KEY = 'sessionReloadAt';
const RELOAD_COOLDOWN_MS = 30_000;

/**
 * `fetch` for the dashboard's own server. When the session has expired, reload
 * the page so the browser signs in again: Cloudflare Access answers with a
 * redirect to its login page, which `fetch` can't follow across origins, and
 * the password login (password-auth.js) with a 401 marked by a header. Reload
 * once per cooldown, so a response that only looks like this can't loop.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set(PROXY_REQUEST_HEADER, '1');

  const response = await fetch(input, { ...init, headers, redirect: 'manual' });
  const sessionExpired = response.type === 'opaqueredirect'
    || (response.status === 401 && response.headers.get('x-content-sentinel-auth') === 'login');
  if (sessionExpired) {
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY));
    if (!lastReload || Date.now() - lastReload > RELOAD_COOLDOWN_MS) {
      sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      window.location.reload();
    }
    throw new Error('Your session has expired. Reload the page to sign in again.');
  }
  return response;
}
