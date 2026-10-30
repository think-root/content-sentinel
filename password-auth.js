// Optional password login for server.js: the whole dashboard, proxy included,
// behind one user name and password, for setups without Cloudflare Access.
//
// A login page sets a signed session cookie. The cookie holds no password: its
// signature is keyed on the user name and password, so changing either signs
// everyone out, and sessions survive a restart without any stored state.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import express from 'express';

export const SESSION_COOKIE = 'cs_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// Failed logins per client before it has to wait.
const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

// Tells apiFetch that the session is gone and the page should reload.
export const AUTH_REQUIRED_HEADER = 'x-content-sentinel-auth';

const sha256 = (value) => createHash('sha256').update(value).digest();
// Compare digests, so neither the length nor the content leaks through timing.
const matches = (given, expected) => timingSafeEqual(sha256(given), sha256(expected));

/**
 * Read BASIC_AUTH_USER and BASIC_AUTH_PASSWORD (named after the HTTP Basic
 * Auth this replaced). Returns null when neither is set and throws when only
 * one is, rather than leaving the dashboard open.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{ user: string, password: string } | null}
 */
export function passwordAuthConfig(env) {
  const user = env.BASIC_AUTH_USER;
  const password = env.BASIC_AUTH_PASSWORD;
  if (!user && !password) return null;
  if (!user || !password) {
    throw new Error('Set both BASIC_AUTH_USER and BASIC_AUTH_PASSWORD, or neither');
  }
  return { user, password };
}

const signingKey = ({ user, password }) => sha256(`content-sentinel session\0${user}\0${password}`);

/** A session token valid until `now + SESSION_MAX_AGE_MS`. */
export function createSessionToken(config, now = Date.now()) {
  const body = `${now + SESSION_MAX_AGE_MS}.${randomBytes(16).toString('base64url')}`;
  return `${body}.${createHmac('sha256', signingKey(config)).update(body).digest('base64url')}`;
}

/** Whether the token was signed with this configuration and hasn't expired. */
export function isValidSessionToken(token, config, now = Date.now()) {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  const expected = createHmac('sha256', signingKey(config)).update(`${expires}.${nonce}`).digest('base64url');
  return matches(signature, expected) && Number(expires) > now;
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return undefined;
}

// Only paths on this site, so the login page can't redirect elsewhere.
const safeNext = (next) => (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/');

const escapeHtml = (value) => value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function loginPage({ next, message }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Sign in · Content Sentinel</title>
<style>
  :root { --bg: #f8fafc; --card: #fff; --text: #0f172a; --muted: #64748b; --border: #e2e8f0; --accent: #2563eb; --error: #dc2626; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0b0f17; --card: #111827; --text: #f1f5f9; --muted: #94a3b8; --border: #1f2937; --accent: #3b82f6; --error: #f87171; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 1rem;
    background: var(--bg); color: var(--text); font: 16px/1.5 system-ui, -apple-system, sans-serif; }
  form { width: 100%; max-width: 22rem; padding: 1.5rem; border: 1px solid var(--border); border-radius: .75rem; background: var(--card); }
  h1 { margin: 0 0 1.25rem; font-size: 1.25rem; }
  label { display: block; margin: 0 0 .25rem; font-size: .875rem; color: var(--muted); }
  input { width: 100%; margin: 0 0 1rem; padding: .625rem .75rem; border: 1px solid var(--border); border-radius: .5rem;
    background: transparent; color: inherit; font: inherit; }
  button { width: 100%; padding: .625rem; border: 0; border-radius: .5rem; background: var(--accent); color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
  p { margin: 0 0 1rem; color: var(--error); font-size: .875rem; }
</style>
</head>
<body>
<form method="post" action="/login">
  <h1>Content Sentinel</h1>
  ${message ? `<p role="alert">${escapeHtml(message)}</p>` : ''}
  <input type="hidden" name="next" value="${escapeHtml(next)}">
  <label for="user">User name</label>
  <input id="user" name="user" autocomplete="username" autocapitalize="none" spellcheck="false" required autofocus>
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required>
  <button type="submit">Sign in</button>
</form>
</body>
</html>`;
}

/**
 * Add the login page, POST /auth/logout and the session check to an Express
 * app. Everything registered after this needs a session.
 *
 * @param {import('express').Express} app
 * @param {{ user: string, password: string }} config
 */
export function installPasswordAuth(app, config) {
  const failures = new Map();

  const cookie = (req, token, maxAge) => [
    `${SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(maxAge / 1000)}`,
    ...(req.secure ? ['Secure'] : []),
  ].join('; ');

  app.get('/login', (req, res) => {
    res.set('Cache-Control', 'no-store').type('html').send(loginPage({ next: safeNext(req.query.next) }));
  });

  app.post('/login', express.urlencoded({ extended: false, limit: '4kb' }), (req, res) => {
    const now = Date.now();
    for (const [ip, entry] of failures) if (entry.resetAt <= now) failures.delete(ip);

    const next = safeNext(req.body?.next);
    const entry = failures.get(req.ip);
    if (entry && entry.count >= MAX_FAILURES) {
      return res.status(429).type('html').send(loginPage({ next, message: 'Too many attempts. Try again in a few minutes.' }));
    }

    const user = String(req.body?.user ?? '');
    const password = String(req.body?.password ?? '');
    // Check both, so timing says nothing about which one was wrong
    const userOk = matches(user, config.user);
    const passwordOk = matches(password, config.password);
    if (!userOk || !passwordOk) {
      failures.set(req.ip, { count: (entry?.count ?? 0) + 1, resetAt: entry?.resetAt ?? now + FAILURE_WINDOW_MS });
      return res.status(401).type('html').send(loginPage({ next, message: 'Wrong user name or password.' }));
    }

    failures.delete(req.ip);
    res.set('Set-Cookie', cookie(req, createSessionToken(config, now), SESSION_MAX_AGE_MS));
    res.redirect(303, next);
  });

  app.use((req, res, next) => {
    if (isValidSessionToken(readCookie(req, SESSION_COOKIE), config)) return next();

    // Pages get the login page; API calls get a 401 that apiFetch recognises.
    if (req.method === 'GET' && (req.headers.accept ?? '').includes('text/html')) {
      return res.redirect(302, `/login?next=${encodeURIComponent(req.originalUrl)}`);
    }
    res.set(AUTH_REQUIRED_HEADER, 'login').status(401).json({ status: 'error', message: 'Sign in again' });
  });

  // A custom header, like the proxy, so another site can't sign the user out.
  app.post('/auth/logout', (req, res) => {
    if (!req.headers['x-content-sentinel']) return res.sendStatus(403);
    res.set('Set-Cookie', cookie(req, '', 0)).sendStatus(204);
  });
}
