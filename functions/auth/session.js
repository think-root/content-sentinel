// Who is signed in, for the Account tab of the settings dialog.
import { accessIdentity, isAccessConfigured } from '../../api-proxy.js';

export const onRequestGet = async ({ request, env }) => {
  const identity = isAccessConfigured(env) ? await accessIdentity(request, env) : null;
  const session = identity
    ? { method: 'access', user: identity.email ?? identity.common_name ?? null }
    : { method: 'none' };
  return Response.json(session, { headers: { 'cache-control': 'no-store' } });
};
