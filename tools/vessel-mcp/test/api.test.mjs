import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi, readConfig } from '../src/api.mjs';
import { declarations, schemaType } from '../src/schema.mjs';
import { getSchemas } from '../src/catalog.mjs';
import { redact } from '../src/registry.mjs';

const env = { VESSEL_MCP_URL: 'https://vessel.example/api', VESSEL_MCP_API_KEY: 'test-only-key', VESSEL_MCP_ENVIRONMENT_IDS: '1,2' };
test('rejects unsafe origins, embedded credentials and missing explicit scope', () => {
  for (const patch of [
    { VESSEL_MCP_URL: 'http://remote.example' },
    { VESSEL_MCP_URL: 'https://key@host/' },
    { VESSEL_MCP_URL: 'https://host/path' },
    { VESSEL_MCP_ENVIRONMENT_IDS: '' },
    { VESSEL_MCP_ENVIRONMENT_IDS: '../1' },
    { VESSEL_MCP_API_KEY: 'x\r\ny' },
  ])
    assert.throws(() => readConfig({ ...env, ...patch }));
  assert.equal(readConfig(env).origin, 'https://vessel.example');
});
test('unknown operations, raw URLs, out-of-scope IDs and extra arguments never fetch', async () => {
  let calls = 0;
  const api = createApi(readConfig(env), async () => {
    calls++;
  });
  for (const [name, args] of [
    ['https://evil.example', {}],
    ['docker.containers.list', { environmentId: 3 }],
    ['environments.list', { url: '/secrets' }],
  ])
    await assert.rejects(api(name, args));
  assert.equal(calls, 0);
});
test('API credentials remain host-side and metadata projection excludes credentials', async () => {
  const api = createApi(readConfig(env), async (url, options) => {
    assert.equal(url, 'https://vessel.example/api/endpoints');
    assert.equal(options.headers['X-API-Key'], env.VESSEL_MCP_API_KEY);
    assert.equal(options.redirect, 'error');
    return Response.json([
      { Id: 1, Name: 'local', TLSConfig: { secret: 'private' } },
      { Id: 8, Name: 'outside' },
    ]);
  });
  assert.deepEqual(await api('environments.list', {}), [{ Id: 1, Name: 'local' }]);
});
test('401 revocation, bad content, oversize responses and upstream errors fail closed', async () => {
  for (const response of [new Response('secret', { status: 401 }), new Response('<html>secret</html>'), Response.json({ value: 'x'.repeat(1024 * 1024) })]) {
    await assert.rejects(createApi(readConfig(env), async () => response)('environments.list', {}), (error) => !error.message.includes('secret'));
  }
  await assert.rejects(
    createApi(readConfig(env), async () => {
      throw new Error('secret');
    })('environments.list', {}),
    /API request failed/
  );
});
test('generated declarations quote hostile names, preserve required properties and unions', () => {
  assert.equal(
    schemaType({ type: 'object', required: ['id'], properties: { id: { type: 'integer' }, optional: { enum: ['a', 'b'] } }, additionalProperties: false }),
    '{ "id": number; "optional"?: "a" | "b" }'
  );
  const result = declarations(getSchemas(['docker.containers.list']));
  assert.match(result, /"environmentId": number/);
  assert.match(result, /Promise<unknown>/);
  assert.ok(declarations([{ name: 'x";evil()', inputSchema: {} }]).includes(JSON.stringify('x";evil()')));
});
test('known credentials and sensitive fields are redacted recursively', () => {
  assert.deepEqual(redact({ nested: [{ name: 'echo abc', apiKey: 'other' }] }, ['abc']), { nested: [{ name: 'echo [REDACTED]', apiKey: '[REDACTED]' }] });
});
