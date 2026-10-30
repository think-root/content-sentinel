import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PROXY_PREFIX, handleNodeProxyRequest } from './api-proxy.js';
import { basicAuth, basicAuthConfig } from './basic-auth.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const app = express();
const PORT = process.env.PORT || process.env.VITE_PORT || 3000;
const auth = basicAuthConfig(process.env);

// For the Docker healthcheck, ahead of the password.
app.get('/healthz', (req, res) => {
  res.sendStatus(204);
});

if (auth) {
  app.use(basicAuth(auth));
}

// The app used to live under /dashboard/; keep old bookmarks working.
app.get(/^\/dashboard(\/.*)?$/, (req, res) => {
  res.redirect(301, req.params[0] || '/');
});

// The proxy holds the backend tokens: it needs Cloudflare Access or the
// password above, unless running open is asked for.
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
  console.log(`Server running on port ${PORT}${auth ? ' with Basic Auth' : ''}`);
});
