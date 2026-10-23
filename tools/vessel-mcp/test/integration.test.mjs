import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as httpServer } from 'node:http';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { StateStore } from '../src/state.mjs';

const key = 'aa'.repeat(32);
test('encrypted continuations require approval, reject tampering/config drift and cannot replay', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'vessel-state-test-'));
  const store = new StateStore(directory, key, 'policy-a');
  const state = { state: { snapshot: Buffer.from('sensitive snapshot payload'), args: ['update', { id: 1 }] }, calls: 1, remainingMs: 1000 };
  try {
    const { continuationId: id } = await store.save(state);
    assert.equal((await readFile(join(directory, id))).includes('sensitive'), false);
    await assert.rejects(store.take(id), /approval/);
    await assert.rejects(new StateStore(directory, key, 'policy-b').read(id), /configuration/);
    await store.approve(id);
    const results = await Promise.allSettled([store.take(id), store.take(id)]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    await assert.rejects(store.take(id));
    const other = await store.save(state);
    const bytes = await readFile(join(directory, other.continuationId));
    bytes[30] ^= 1;
    await writeFile(join(directory, other.continuationId), bytes);
    await assert.rejects(store.read(other.continuationId));
    assert.throws(() => store.path('../escape'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('MCP wire discovery -> generated SDK -> execution -> operator approval -> resume after restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'vessel-wire-test-'));
  const fixture = fileURLToPath(new URL('./fixtures/upstream.mjs', import.meta.url));
  const entrypoint = fileURLToPath(new URL('../src/server.mjs', import.meta.url));
  const configFile = join(directory, 'upstreams.json');
  await writeFile(
    configFile,
    JSON.stringify([
      {
        name: 'fixture',
        command: process.execPath,
        args: [fixture],
        tools: [
          { name: 'list', approval: false },
          { name: 'update', approval: true },
        ],
      },
    ])
  );
  const http = httpServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ Id: 1, Name: 'local' }]));
  });
  await new Promise((resolve) => http.listen(0, '127.0.0.1', resolve));
  const env = {
    VESSEL_MCP_URL: `http://127.0.0.1:${http.address().port}`,
    VESSEL_MCP_API_KEY: 'wire-test-key',
    VESSEL_MCP_ENVIRONMENT_IDS: '1',
    VESSEL_MCP_UPSTREAM_CONFIG: configFile,
    VESSEL_MCP_STATE_DIRECTORY: join(directory, 'states'),
    VESSEL_MCP_STATE_KEY: key,
  };
  const connect = async () => {
    const client = new Client({ name: 'test', version: '1' });
    await client.connect(new StdioClientTransport({ command: process.execPath, args: [entrypoint], env, stderr: 'pipe' }));
    return client;
  };
  let client;
  const call = async (name, args) => {
    const r = await client.callTool({ name, arguments: args });
    return { ...JSON.parse(r.content[0].text), isError: r.isError };
  };
  try {
    client = await connect();
    assert.deepEqual(
      (await client.listTools()).tools.map((t) => t.name),
      ['search_tools', 'get_schemas', 'get_tags', 'execute', 'resume']
    );
    const schemas = await call('get_schemas', { names: ['fixture.list'] });
    assert.match(schemas.typescript, /"count": number/);
    const pending = await call('execute', {
      code: 'const items = await tools["fixture.list"]({count:3}); const target=items.items.filter(i=>i.id>1)[0]; return await tools["fixture.update"]({id:target.id});',
    });
    assert.equal(pending.status, 'approval_required');
    assert.equal(pending.calls, 2);
    const id = pending.continuationId;
    assert.match((await call('resume', { continuationId: id })).error, /approval/);
    // A fresh process loads the portable VM snapshot. Approval is a host-side
    // operator action, absent from the model's tools/list interface.
    const bytes = await readFile(join(env.VESSEL_MCP_STATE_DIRECTORY, id));
    assert.equal(bytes.includes('private-value'), false);
    await client.close();
    client = undefined;
    const { readConfig } = await import('../src/api.mjs');
    const { createRegistry } = await import('../src/registry.mjs');
    const registry = await createRegistry(readConfig(env));
    try {
      await new StateStore(env.VESSEL_MCP_STATE_DIRECTORY, key, registry.revision).approve(id);
    } finally {
      await registry.close();
    }
    client = await connect();
    const resumed = await call('resume', { continuationId: id });
    assert.deepEqual(resumed.value, { updated: 2 });
    assert.equal(resumed.calls, 2);
    assert.equal((await call('resume', { continuationId: id })).isError, true);
    const invalidWrite = await call('execute', { code: 'return await tools["fixture.update"]({id:"wrong"});' });
    assert.match(invalidWrite.error, /Invalid operation arguments/);
    const denied = await call('execute', { code: 'return await tools["fixture.list"]({count:"wrong"});' });
    assert.match(denied.error, /Invalid operation arguments/);
    const redacted = await call('execute', { code: 'return await tools["fixture.list"]({count:1});' });
    assert.equal(redacted.value.items[0].password, '[REDACTED]');
  } finally {
    await client?.close();
    await new Promise((resolve) => http.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
