// Proxy from the dashboard to content-alchemist and content-maestro. The browser
// calls /proxy/<service>/api/...; the URL and bearer token of each service come
// from the environment, so they never reach the browser.
//
// Shared by the Cloudflare Pages Function (functions/proxy), the Node server
// (server.js) and the Vite dev and preview servers, so it only uses web APIs.
import { createLocalJWKSet, jwtVerify } from 'jose';

export const PROXY_PREFIX = '/proxy/';

// apiFetch sends it on every request. A custom header can't be sent cross-site
// without a CORS preflight, which the proxy never answers, so another site
// can't make the browser call the proxy with the user's session.
export const PROXY_REQUEST_HEADER = 'x-content-sentinel';

const SERVICES = {
  alchemist: { url: 'ALCHEMIST_URL', token: 'ALCHEMIST_TOKEN' },
  maestro: { url: 'MAESTRO_URL', token: 'MAESTRO_TOKEN' },
};

// Request and response headers passed through; everything else is dropped.
const REQUEST_HEADERS = ['accept', 'content-type'];
const RESPONSE_HEADERS = ['content-type', 'retry-after'];

const CERTS_TTL_MS = 10 * 60 * 1000;
const certsByIssuer = new Map();

const error = (status, message) => Response.json({ status: 'error', message }, { status });

// Access signing keys, cached per isolate. Only the fetched keys are shared
// between requests, not a pending fetch: Workers cancel a promise that another
// request is waiting on when the request that created it ends.
async function accessKeys(issuer) {
  const cached = certsByIssuer.get(issuer);
  if (cached && cached.expires > Date.now()) return cached.keys;

  const response = await fetch(`${issuer}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error(`certs request failed: ${response.status}`);
  const keys = createLocalJWKSet(await response.json());
  certsByIssuer.set(issuer, { keys, expires: Date.now() + CERTS_TTL_MS });
  return keys;
}

/** Whether the request carries a valid Cloudflare Access token for this application. */
async function hasAccessIdentity(request, env) {
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return false;

  // Accept the team domain with or without the scheme and trailing slash.
  const issuer = `https://${env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;
  try {
    await jwtVerify(token, await accessKeys(issuer), { issuer, audience: env.ACCESS_AUD });
    return true;
  } catch (cause) {
    console.warn('[proxy] Access token rejected:', cause?.code ?? cause?.message ?? cause);
    return false;
  }
}

/**
 * The path below the service, or null when a segment could leave it: "." or
 * "..", or an encoded "/" or "\" that a server further along may decode.
 */
function servicePath(segments) {
  for (const segment of segments) {
    let decoded;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return null;
    }
    if (decoded === '.' || decoded === '..' || /[/\\]/.test(decoded)) return null;
  }
  return segments.join('/');
}

/**
 * Forward a /proxy/<service>/api/... request to the service.
 *
 * With ACCESS_TEAM_DOMAIN and ACCESS_AUD set, only requests with a valid
 * Cloudflare Access token get through. Without them the proxy is open, which
 * `requireAccess` forbids.
 *
 * @param {Request} request
 * @param {Record<string, string | undefined>} env
 * @param {{ requireAccess: boolean }} options
 * @returns {Promise<Response>}
 */
export async function proxyRequest(request, env, { requireAccess }) {
  // The URL parser has already resolved literal dot segments.
  const url = new URL(request.url);
  const [name, ...rest] = url.pathname.slice(PROXY_PREFIX.length).split('/');
  const service = Object.hasOwn(SERVICES, name) ? SERVICES[name] : undefined;
  const path = servicePath(rest);
  if (!url.pathname.startsWith(PROXY_PREFIX) || !service || rest[0] !== 'api' || path === null) {
    return error(404, 'Not found');
  }

  if (!request.headers.has(PROXY_REQUEST_HEADER)) {
    return error(403, `Missing the ${PROXY_REQUEST_HEADER} header`);
  }

  if (env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
    if (!(await hasAccessIdentity(request, env))) return error(403, 'Forbidden');
  } else if (requireAccess) {
    return error(403, 'Cloudflare Access is not configured: set ACCESS_TEAM_DOMAIN and ACCESS_AUD');
  }

  const baseUrl = env[service.url];
  const token = env[service.token];
  if (!baseUrl || !token) {
    return error(500, `${service.url} and ${service.token} are not set`);
  }

  const headers = new Headers({ Authorization: `Bearer ${token}` });
  for (const header of REQUEST_HEADERS) {
    const value = request.headers.get(header);
    if (value) headers.set(header, value);
  }

  let upstream;
  try {
    upstream = await fetch(`${baseUrl.replace(/\/+$/, '')}/${path}${url.search}`, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      // Following a redirect could send the token elsewhere, and passing it on
      // would look to the browser like the Access login redirect.
      redirect: 'manual',
    });
  } catch (cause) {
    console.error(`[proxy] ${name} is unreachable:`, cause);
    return error(502, `${name} is unreachable`);
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    console.error(`[proxy] ${name} redirected to ${upstream.headers.get('location')}`);
    return error(502, `${name} answered with a redirect; check ${service.url}`);
  }

  // fetch has already decoded the body, so content-encoding and length are not copied.
  const responseHeaders = new Headers({ 'cache-control': 'no-store' });
  for (const header of RESPONSE_HEADERS) {
    const value = upstream.headers.get(header);
    if (value) responseHeaders.set(header, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

/**
 * Serve the proxy from a Node `http` request handler (Express, Vite's connect).
 * Must run before any body parser.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {Record<string, string | undefined>} env
 * @param {{ requireAccess: boolean }} options
 */
export async function handleNodeProxyRequest(req, res, env, options) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);

  const headers = new Headers();
  for (const header of [...REQUEST_HEADERS, PROXY_REQUEST_HEADER, 'cf-access-jwt-assertion']) {
    const value = req.headers[header];
    if (typeof value === 'string') headers.set(header, value);
  }

  let request;
  try {
    const hasBody = chunks.length > 0 && !['GET', 'HEAD'].includes(req.method);
    request = new Request(new URL(req.originalUrl ?? req.url, 'http://localhost'), {
      method: req.method,
      headers,
      body: hasBody ? new Blob(chunks) : undefined,
    });
  } catch (cause) {
    // Request rejects methods such as CONNECT and TRACE
    request = null;
    console.warn('[proxy] Bad request:', cause instanceof Error ? cause.message : cause);
  }
  const response = request ? await proxyRequest(request, env, options) : error(400, 'Bad request');

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(new Uint8Array(await response.arrayBuffer()));
}
