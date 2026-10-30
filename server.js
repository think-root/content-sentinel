import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PROXY_PREFIX, accessIdentity, handleNodeProxyRequest, isAccessConfigured } from './api-proxy.js';
import { installPasswordAuth, passwordAuthConfig } from './password-auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const app = express();
const PORT = process.env.PORT || process.env.VITE_PORT || 3000;
const auth = passwordAuthConfig(process.env);

// Behind a reverse proxy on the same machine or network, take the client
// address and https from its X-Forwarded-* headers (login limits, Secure cookie).
app.set('trust proxy', 'loopback, linklocal, uniquelocal');

// For the Docker healthcheck, ahead of the login.
app.get('/healthz', (req, res) => {
  res.sendStatus(204);
});

if (auth) {
  installPasswordAuth(app, auth);
}

// The app used to live under /dashboard/; keep old bookmarks working.
app.get(/^\/dashboard(\/.*)?$/, (req, res) => {
  res.redirect(301, req.params[0] || '/');
});

// Who is signed in, for the Account tab of the settings dialog.
app.get('/auth/session', async (req, res, next) => {
  try {
    let session = { method: 'none' };
    if (auth) {
      session = { method: 'password', user: auth.user };
    } else if (isAccessConfigured(process.env)) {
      const token = req.headers['cf-access-jwt-assertion'];
      const request = new Request('http://localhost/', { headers: typeof token === 'string' ? { 'cf-access-jwt-assertion': token } : {} });
      const identity = await accessIdentity(request, process.env);
      if (identity) session = { method: 'access', user: identity.email ?? identity.common_name ?? null };
    }
    res.set('Cache-Control', 'no-store').json(session);
  } catch (error) {
    next(error);
  }
});

// The proxy holds the backend tokens: it needs Cloudflare Access or the
// password login above, unless running open is asked for.
const proxyOptions = { requireAccess: !auth && process.env.ALLOW_UNAUTHENTICATED_PROXY !== 'true' };
app.use(PROXY_PREFIX, (req, res, next) => {
  handleNodeProxyRequest(req, res, process.env, proxyOptions).catch(next);
});

app.use(express.static(distDir));

// Client-side routes get the SPA shell; a missing file must stay a 404, or the
// browser would receive index.html as a script or stylesheet.
app.get('*', (req, res) => {
  if (path.extname(req.path)) {
    return res.sendStatus(404);
  }
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}${auth ? ' with password login' : ''}`);
});
