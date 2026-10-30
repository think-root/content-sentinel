import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { PROXY_REQUEST_HEADER, proxyRequest } from './api-proxy.js';

const env = {
  ALCHEMIST_URL: 'https://backend.test/think-root/',
  ALCHEMIST_TOKEN: 'alchemist-token',
  MAESTRO_URL: 'https://backend.test/content-maestro',
  MAESTRO_TOKEN: 'maestro-token',
};
const TEAM = 'team.cloudflareaccess.com';
const AUD = 'app-aud';
const accessEnv = { ...env, ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD };

let privateKey;
let jwks;
const upstream = vi.fn();

beforeAll(async () => {
  const keys = await generateKeyPair('RS256');
  privateKey = keys.privateKey;
  jwks = { keys: [{ ...(await exportJWK(keys.publicKey)), kid: 'k1', alg: 'RS256' }] };
});

// Serves the Access certificates; everything else goes to `upstream`.
vi.stubGlobal('fetch', async (url, init) => {
  if (String(url) === `https://${TEAM}/cdn-cgi/access/certs`) return Response.json(jwks);
  return upstream(String(url), init);
});

afterEach(() => upstream.mockReset());

const accessToken = ({ aud = AUD, exp = '5m', key = privateKey } = {}) =>
  new SignJWT({ email: 'owner@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setIssuer(`https://${TEAM}`)
    .setAudience(aud)
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(key);

// A request as apiFetch sends it
const request = (path, init = {}) => new Request(`https://dashboard.test${path}`, {
  ...init,
  headers: { [PROXY_REQUEST_HEADER]: '1', ...init.headers },
});

describe('proxyRequest', () => {
  it('forwards the method, path, query and body with the service token', async () => {
    upstream.mockResolvedValue(Response.json({ ok: true }, { status: 201, headers: { 'set-cookie': 'x=1' } }));

    const response = await proxyRequest(request('/proxy/alchemist/api/get-repository/?page=2', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: 'session=secret', authorization: 'Bearer forged' },
      body: '{"limit":1}',
    }), env, { requireAccess: false });

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get('set-cookie')).toBeNull();

    const [url, init] = upstream.mock.calls[0];
    expect(url).toBe('https://backend.test/think-root/api/get-repository/?page=2');
    expect(init.method).toBe('POST');
    expect(new TextDecoder().decode(init.body)).toBe('{"limit":1}');
    expect(Object.fromEntries(init.headers)).toEqual({
      authorization: 'Bearer alchemist-token',
      'content-type': 'application/json',
    });
  });

  it.each([
    '/proxy/unknown/api/crons',
    '/proxy/toString/api/crons',
    '/proxy/maestro/crons',
    '/proxy/maestro/api/../../other/api',
    '/proxy/maestro/api/%2e%2e/%2e%2e/other',
    '/proxy/maestro/api/..%2F..%2Fother%2Fapi',
    '/proxy/maestro/api/..%5C..%5Cother',
    '/proxy/maestro/api/%E0%A4%A',
  ])('rejects %s', async (path) => {
    const response = await proxyRequest(request(path), env, { requireAccess: false });
    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('refuses requests without its header, as a cross-site form or no-cors fetch sends them', async () => {
    const response = await proxyRequest(
      new Request('https://dashboard.test/proxy/alchemist/api/manual-generate/', { method: 'POST', body: '{}' }),
      env,
      { requireAccess: false },
    );
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('turns an upstream redirect into an error instead of passing it on', async () => {
    upstream.mockResolvedValue(new Response(null, { status: 301, headers: { location: 'https://elsewhere.test/' } }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await proxyRequest(request('/proxy/maestro/api/crons'), env, { requireAccess: false });
    expect(response.status).toBe(502);
    expect(response.headers.get('location')).toBeNull();
    expect(upstream.mock.calls[0][1].redirect).toBe('manual');
  });

  it('refuses to run open where Access is required but not configured', async () => {
    const response = await proxyRequest(request('/proxy/maestro/api/crons'), env, { requireAccess: true });
    expect(response.status).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('reports a service without URL or token', async () => {
    const response = await proxyRequest(request('/proxy/maestro/api/crons'), { ...env, MAESTRO_TOKEN: '' }, { requireAccess: false });
    expect(response.status).toBe(500);
    expect(upstream).not.toHaveBeenCalled();
  });

  it('answers 502 when the service is unreachable', async () => {
    upstream.mockRejectedValue(new TypeError('fetch failed'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await proxyRequest(request('/proxy/maestro/api/crons'), env, { requireAccess: false });
    expect(response.status).toBe(502);
  });

  describe('with Cloudflare Access', () => {
    const withToken = (token) =>
      request('/proxy/maestro/api/crons', token ? { headers: { 'cf-access-jwt-assertion': token } } : undefined);

    it('accepts a valid token for this application', async () => {
      upstream.mockResolvedValue(Response.json([]));
      const response = await proxyRequest(withToken(await accessToken()), accessEnv, { requireAccess: true });
      expect(response.status).toBe(200);
      expect(upstream).toHaveBeenCalledOnce();
    });

    it('accepts the team domain written as a URL', async () => {
      upstream.mockResolvedValue(Response.json([]));
      const response = await proxyRequest(
        withToken(await accessToken()),
        { ...accessEnv, ACCESS_TEAM_DOMAIN: `https://${TEAM}/` },
        { requireAccess: true },
      );
      expect(response.status).toBe(200);
    });

    it.each([
      ['no token', async () => undefined],
      ['a token for another application', async () => accessToken({ aud: 'other-aud' })],
      ['an expired token', async () => accessToken({ exp: Math.floor(Date.now() / 1000) - 60 })],
      ['a token signed with another key', async () => accessToken({ key: (await generateKeyPair('RS256')).privateKey })],
    ])('rejects %s', async (_, makeToken) => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      const response = await proxyRequest(withToken(await makeToken()), accessEnv, { requireAccess: false });
      expect(response.status).toBe(403);
      expect(upstream).not.toHaveBeenCalled();
    });
  });
});
