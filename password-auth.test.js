import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import {
  AUTH_REQUIRED_HEADER,
  SESSION_COOKIE,
  createSessionToken,
  installPasswordAuth,
  isValidSessionToken,
  passwordAuthConfig,
} from './password-auth.js';

const config = { user: 'me', password: 'pa:ss wörd' };

describe('passwordAuthConfig', () => {
  it('is off when neither variable is set', () => {
    expect(passwordAuthConfig({})).toBeNull();
  });

  it('reads both variables', () => {
    expect(passwordAuthConfig({ BASIC_AUTH_USER: 'me', BASIC_AUTH_PASSWORD: 'secret' })).toEqual({ user: 'me', password: 'secret' });
  });

  it.each([{ BASIC_AUTH_USER: 'me' }, { BASIC_AUTH_PASSWORD: 'secret' }])('refuses half a configuration: %o', (env) => {
    expect(() => passwordAuthConfig(env)).toThrow();
  });
});

describe('session tokens', () => {
  const now = 1_800_000_000_000;

  it('accepts its own token until it expires', () => {
    const token = createSessionToken(config, now);
    expect(isValidSessionToken(token, config, now + 1000)).toBe(true);
    expect(isValidSessionToken(token, config, now + 31 * 24 * 60 * 60 * 1000)).toBe(false);
  });

  it('rejects tokens after the password changes, and tampered ones', () => {
    const token = createSessionToken(config, now);
    expect(isValidSessionToken(token, { ...config, password: 'new' }, now)).toBe(false);

    const [, nonce, signature] = token.split('.');
    expect(isValidSessionToken(`${now + 10 ** 12}.${nonce}.${signature}`, config, now)).toBe(false);
    expect(isValidSessionToken('garbage', config, now)).toBe(false);
    expect(isValidSessionToken(undefined, config, now)).toBe(false);
  });
});

describe('installPasswordAuth', () => {
  let server;
  let base;

  beforeAll(async () => {
    const app = express();
    installPasswordAuth(app, config);
    app.get('/', (req, res) => res.send('dashboard'));
    app.get('/proxy/maestro/api/crons', (req, res) => res.json([]));
    await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(() => new Promise((resolve) => server.close(resolve)));

  const login = (user, password, next = '/') => fetch(`${base}/login`, {
    method: 'POST',
    redirect: 'manual',
    body: new URLSearchParams({ user, password, next }),
  });
  const sessionCookie = (response) => response.headers.get('set-cookie').split(';')[0];

  it('sends a page to the login and an API call a 401', async () => {
    const page = await fetch(`${base}/settings?x=1`, { headers: { accept: 'text/html' }, redirect: 'manual' });
    expect(page.status).toBe(302);
    expect(page.headers.get('location')).toBe('/login?next=%2Fsettings%3Fx%3D1');

    const api = await fetch(`${base}/proxy/maestro/api/crons`);
    expect(api.status).toBe(401);
    expect(api.headers.get(AUTH_REQUIRED_HEADER)).toBe('login');
  });

  it('signs in with the right credentials and keeps the user signed in', async () => {
    const response = await login('me', 'pa:ss wörd', '/archive');
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/archive');
    expect(response.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Lax; Max-Age=2592000/);

    const page = await fetch(`${base}/`, { headers: { cookie: sessionCookie(response) } });
    expect(await page.text()).toBe('dashboard');
  });

  it('only redirects within the site after signing in', async () => {
    for (const next of ['https://evil.test/', '//evil.test/', '/\\evil.test/']) {
      expect((await login('me', 'pa:ss wörd', next)).headers.get('location')).toBe('/');
    }
  });

  it('signs out only with the dashboard header', async () => {
    const cookie = sessionCookie(await login('me', 'pa:ss wörd'));
    expect((await fetch(`${base}/auth/logout`, { method: 'POST', headers: { cookie } })).status).toBe(403);

    const response = await fetch(`${base}/auth/logout`, { method: 'POST', headers: { cookie, 'x-content-sentinel': '1' } });
    expect(response.status).toBe(204);
    expect(response.headers.get('set-cookie')).toMatch(new RegExp(`^${SESSION_COOKIE}=; .*Max-Age=0`));
  });

  it('shows an error on wrong credentials and locks out after too many', async () => {
    const wrong = await login('me', 'wrong');
    expect(wrong.status).toBe(401);
    expect(await wrong.text()).toContain('Wrong user name or password');

    for (let i = 0; i < 9; i++) await login('you', 'pa:ss wörd');
    const locked = await login('me', 'pa:ss wörd');
    expect(locked.status).toBe(429);
  });
});
