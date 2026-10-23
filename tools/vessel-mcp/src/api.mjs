import { catalog } from './catalog.mjs';

export const MAX_RESPONSE_BYTES = 1024 * 1024;

export function readConfig(env = process.env) {
  const base = new URL(env.VESSEL_MCP_URL ?? '');
  if (base.username || base.password || base.search || base.hash || !['', '/', '/api', '/api/'].includes(base.pathname))
    throw new Error('VESSEL_MCP_URL must be an origin or /api URL without credentials, query or fragment');
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)))
    throw new Error('Vessel requires HTTPS except for loopback development');
  const apiKey = env.VESSEL_MCP_API_KEY;
  if (!apiKey || /[\r\n]/.test(apiKey)) throw new Error('VESSEL_MCP_API_KEY is required');
  const ids = (env.VESSEL_MCP_ENVIRONMENT_IDS ?? '').split(',');
  if (!ids.length || ids.some((id) => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))))
    throw new Error('VESSEL_MCP_ENVIRONMENT_IDS must explicitly list positive environment IDs');
  if (Boolean(env.VESSEL_MCP_STATE_DIRECTORY) !== Boolean(env.VESSEL_MCP_STATE_KEY)) throw new Error('State directory and key must be configured together');
  return {
    origin: base.origin,
    apiKey,
    scope: new Set(ids.map(Number)),
    upstreamFile: env.VESSEL_MCP_UPSTREAM_CONFIG,
    stateDirectory: env.VESSEL_MCP_STATE_DIRECTORY,
    stateKey: env.VESSEL_MCP_STATE_KEY,
  };
}

export function createApi(config, fetchImpl = fetch) {
  return async (name, input, signal) => {
    const operation = catalog.find((entry) => entry.name === name);
    if (!operation) throw new Error('Unknown operation');
    const parsed = operation.schema.safeParse(input);
    if (!parsed.success) throw new Error('Invalid operation arguments');
    const args = parsed.data;
    if (args.environmentId !== undefined && !config.scope.has(args.environmentId)) throw new Error('Environment outside configured scope');
    let response;
    try {
      response = await fetchImpl(`${config.origin}/api${operation.path(args)}`, {
        method: 'GET',
        headers: { 'X-API-Key': config.apiKey, Accept: 'application/json' },
        redirect: 'error',
        signal,
      });
    } catch {
      throw new Error('Vessel API request failed');
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Vessel API refused request (${response.status})`);
    }
    if (!response.headers.get('content-type')?.includes('application/json')) {
      await response.body?.cancel();
      throw new Error('Vessel API returned non-JSON content');
    }
    let bytes = 0;
    const chunks = [];
    for await (const chunk of response.body ?? []) {
      bytes += chunk.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) throw new Error('Vessel API response limit exceeded');
      chunks.push(chunk);
    }
    let data;
    try {
      data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
      throw new Error('Invalid API response');
    }
    return operation.project(data, config.scope, args);
  };
}
