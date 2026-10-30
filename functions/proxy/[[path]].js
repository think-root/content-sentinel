// Cloudflare Pages Function for /proxy/*. The deployment is public, so the
// proxy only answers requests that passed Cloudflare Access.
import { proxyRequest } from '../../api-proxy.js';

export const onRequest = ({ request, env }) => proxyRequest(request, env, { requireAccess: true });
