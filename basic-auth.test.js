import { describe, expect, it, vi } from 'vitest';
import { basicAuth, basicAuthConfig } from './basic-auth.js';

describe('basicAuthConfig', () => {
  it('is off when neither variable is set', () => {
    expect(basicAuthConfig({})).toBeNull();
  });

  it('reads both variables', () => {
    expect(basicAuthConfig({ BASIC_AUTH_USER: 'me', BASIC_AUTH_PASSWORD: 'secret' })).toEqual({ user: 'me', password: 'secret' });
  });

  it.each([{ BASIC_AUTH_USER: 'me' }, { BASIC_AUTH_PASSWORD: 'secret' }])('refuses half a configuration: %o', (env) => {
    expect(() => basicAuthConfig(env)).toThrow();
  });
});

describe('basicAuth', () => {
  const middleware = basicAuth({ user: 'me', password: 'pa:ss wörd' });

  const run = (authorization) => {
    const res = { set: vi.fn(), status: vi.fn(() => res), send: vi.fn() };
    const next = vi.fn();
    middleware({ headers: authorization === undefined ? {} : { authorization } }, res, next);
    return { res, next };
  };
  const header = (credentials) => `Basic ${Buffer.from(credentials, 'utf8').toString('base64')}`;

  it('lets the right credentials through, including a colon and non-ASCII in the password', () => {
    const { res, next } = run(header('me:pa:ss wörd'));
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([
    ['no header', undefined],
    ['a wrong password', header('me:wrong')],
    ['a wrong user', header('you:pa:ss wörd')],
    ['no separator', header('mepa:ss wörd')],
    ['another scheme', 'Bearer abc'],
  ])('asks for credentials on %s', (_, authorization) => {
    const { res, next } = run(authorization);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.set).toHaveBeenCalledWith('WWW-Authenticate', expect.stringContaining('Basic'));
  });
});
