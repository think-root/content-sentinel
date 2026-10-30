// Optional HTTP Basic Auth for server.js: the whole dashboard, proxy included,
// behind one user name and password, for setups without Cloudflare Access.
import { createHash, timingSafeEqual } from 'node:crypto';

// Compare hashes, so neither the length nor the content leaks through timing.
const digest = (value) => createHash('sha256').update(value).digest();
const matches = (given, expected) => timingSafeEqual(digest(given), digest(expected));

/**
 * Read BASIC_AUTH_USER and BASIC_AUTH_PASSWORD. Returns null when neither is
 * set and throws when only one is, rather than leaving the dashboard open.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{ user: string, password: string } | null}
 */
export function basicAuthConfig(env) {
  const user = env.BASIC_AUTH_USER;
  const password = env.BASIC_AUTH_PASSWORD;
  if (!user && !password) return null;
  if (!user || !password) {
    throw new Error('Set both BASIC_AUTH_USER and BASIC_AUTH_PASSWORD, or neither');
  }
  return { user, password };
}

/**
 * Express middleware that answers 401 unless the request carries the
 * configured credentials.
 *
 * @param {{ user: string, password: string }} config
 */
export function basicAuth({ user, password }) {
  return (req, res, next) => {
    const [scheme, encoded] = (req.headers.authorization ?? '').split(' ');
    if (scheme?.toLowerCase() === 'basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      // Check both parts even when the first fails, so timing says nothing about which
      const userOk = separator !== -1 && matches(decoded.slice(0, separator), user);
      const passwordOk = separator !== -1 && matches(decoded.slice(separator + 1), password);
      if (userOk && passwordOk) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Content Sentinel", charset="UTF-8"');
    res.status(401).send('Authentication required');
  };
}
