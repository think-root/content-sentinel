import type { IncomingMessage, ServerResponse } from 'node:http';

type ProxyEnv = Record<string, string | undefined>;

export const PROXY_PREFIX: string;
export const PROXY_REQUEST_HEADER: string;

export function isAccessConfigured(env: ProxyEnv): boolean;

export function accessIdentity(request: Request, env: ProxyEnv): Promise<Record<string, unknown> | null>;

export function proxyRequest(
  request: Request,
  env: ProxyEnv,
  options: { requireAccess: boolean },
): Promise<Response>;

export function handleNodeProxyRequest(
  req: IncomingMessage,
  res: ServerResponse,
  env: ProxyEnv,
  options: { requireAccess: boolean },
): Promise<void>;
