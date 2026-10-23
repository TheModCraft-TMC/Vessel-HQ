import { readFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import Ajv2019 from 'ajv/dist/2019.js';
import { z } from 'zod';
import { catalog } from './catalog.mjs';
import { declarations } from './schema.mjs';
import { createApi } from './api.mjs';
import { ApprovalRequired } from './sandbox.mjs';
import { fingerprint } from './state.mjs';

function validator(schema) {
  if (Buffer.byteLength(JSON.stringify(schema)) > 64 * 1024) throw new Error('Operation schema limit exceeded');
  let nodes = 0;
  function inspect(value, depth = 0) {
    if (++nodes > 5000 || depth > 32) throw new Error('Operation schema complexity limit exceeded');
    if (value && typeof value === 'object') for (const child of Object.values(value)) inspect(child, depth + 1);
  }
  inspect(schema);
  const dialect = schema.$schema ?? '';
  const Implementation = dialect.includes('2020-12') ? Ajv2020 : dialect.includes('2019-09') ? Ajv2019 : Ajv;
  return new Implementation({ strict: false, allErrors: false, validateFormats: false }).compile(schema);
}
const serverConfig = z
  .array(
    z
      .object({
        name: z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/),
        command: z.string().min(1),
        args: z.array(z.string()).default([]),
        env: z.record(z.string(), z.string()).default({}),
        tools: z.array(z.object({ name: z.string().min(1).max(100), approval: z.boolean().default(true) }).strict()).max(1000),
      })
      .strict()
  )
  .max(20);

export function redact(value, secrets) {
  const clean = (input) => {
    if (typeof input === 'string') return secrets.reduce((text, secret) => (secret ? text.split(secret).join('[REDACTED]') : text), input);
    if (Array.isArray(input)) return input.map(clean);
    if (input && typeof input === 'object')
      return Object.fromEntries(Object.entries(input).map(([key, item]) => [clean(key), /password|secret|token|authorization|api.?key/i.test(key) ? '[REDACTED]' : clean(item)]));
    return input;
  };
  return clean(value);
}

export async function createRegistry(config, env = process.env) {
  const entries = catalog.map((tool) => ({ ...tool, inputSchema: z.toJSONSchema(tool.schema), approval: false, tags: tool.tags }));
  const validateInput = new Map(entries.map((tool) => [tool.name, (args) => tool.schema.safeParse(args).success]));
  const clients = [];
  const secrets = [config.apiKey];
  const api = createApi(config);
  const invoke = new Map(entries.map((tool) => [tool.name, (args, signal) => api(tool.name, args, signal)]));
  try {
    const servers = config.upstreamFile ? serverConfig.parse(JSON.parse(await readFile(config.upstreamFile, 'utf8'))) : [];
    for (const spec of servers) {
      const hostEnv = {};
      for (const [name, source] of Object.entries(spec.env)) {
        if (!env[source]) throw new Error('Missing upstream credential/environment reference');
        hostEnv[name] = env[source];
        secrets.push(env[source]);
      }
      const client = new Client({ name: 'vessel-code-mode', version: '0.1.0' });
      clients.push(client);
      await client.connect(new StdioClientTransport({ command: spec.command, args: spec.args, env: hostEnv, stderr: 'ignore', maxBufferSize: 1024 * 1024 }));
      const discovered = [];
      let cursor;
      let pages = 0;
      do {
        if (++pages > 100) throw new Error('Upstream discovery limit exceeded');
        const page = await client.listTools(cursor ? { cursor } : {});
        discovered.push(...page.tools);
        if (discovered.length > 10_000) throw new Error('Upstream tool limit exceeded');
        cursor = page.nextCursor;
      } while (cursor);
      for (const allowed of spec.tools) {
        const tool = discovered.find((entry) => entry.name === allowed.name);
        if (['__proto__', 'prototype', 'constructor'].includes(allowed.name)) throw new Error('Reserved tool name');
        if (!tool) throw new Error('Configured upstream tool is unavailable');
        const name = `${spec.name}.${tool.name}`;
        if (entries.some((entry) => entry.name === name)) throw new Error('Duplicate tool name');
        // Compile only operator-allowlisted schemas; remote $refs are never fetched.
        const validate = validator(tool.inputSchema);
        validateInput.set(name, validate);
        entries.push({
          name,
          description: (tool.description ?? '').slice(0, 1000),
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema,
          tags: [spec.name],
          approval: allowed.approval,
        });
        invoke.set(name, async (args, signal) => {
          if (!validate(args)) throw new Error('Invalid operation arguments');
          let result;
          try {
            result = await client.callTool({ name: tool.name, arguments: args }, undefined, { signal, timeout: 10_000 });
          } catch {
            throw new Error('Upstream operation failed');
          }
          if (result.isError) throw new Error('Upstream operation failed');
          return result.structuredContent ?? result.content;
        });
      }
    }
    if (Buffer.byteLength(JSON.stringify(entries.map(({ name, inputSchema, outputSchema, approval }) => ({ name, inputSchema, outputSchema, approval })))) > 1024 * 1024)
      throw new Error('Tool schema limit exceeded');
    const revision = fingerprint({
      origin: config.origin,
      scope: [...config.scope].sort((a, b) => a - b),
      identity: fingerprint(secrets),
      servers,
      schemas: entries.map(({ name, inputSchema, approval }) => ({ name, inputSchema, approval })),
    });
    let recent = [];
    return {
      entries,
      revision,
      search(query = '', tag, limit = 10) {
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        return redact(
          entries
            .filter((tool) => (!tag || tool.tags.includes(tag)) && words.every((word) => `${tool.name} ${tool.description} ${tool.tags}`.toLowerCase().includes(word)))
            .slice(0, limit)
            .map(({ name, description, tags, approval }) => ({ name, description, tags, approval })),
          secrets
        );
      },
      schemas(names) {
        const selected = names.map((name) => {
          const tool = entries.find((entry) => entry.name === name);
          if (!tool) throw new Error('Unknown operation');
          return tool;
        });
        const result = {
          tools: selected.map(({ name, description, inputSchema, outputSchema, approval }) => ({ name, description, inputSchema, outputSchema, approval })),
          typescript: declarations(selected),
        };
        if (Buffer.byteLength(JSON.stringify(result)) > 256 * 1024) throw new Error('Selected schemas exceed output limit');
        return redact(result, secrets);
      },
      tags: () => [...new Set(entries.flatMap((tool) => tool.tags))].sort((a, b) => a.localeCompare(b)),
      async call(name, args, signal, approvedName) {
        const tool = entries.find((entry) => entry.name === name);
        if (!tool || !args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Unknown operation or invalid arguments');
        if (Buffer.byteLength(JSON.stringify(args)) > 16 * 1024) throw new Error('Operation input limit exceeded');
        if (!validateInput.get(name)(args)) throw new Error('Invalid operation arguments');
        if (tool.approval && name !== approvedName) throw new ApprovalRequired('Operator approval required');
        recent = recent.filter((time) => time > Date.now() - 60_000);
        if (recent.length >= 120) throw new Error('Host rate limit exceeded');
        recent.push(Date.now());
        return redact(await invoke.get(name)(args, signal), secrets);
      },
      close: () => Promise.allSettled(clients.map((client) => client.close())),
    };
  } catch (error) {
    await Promise.allSettled(clients.map((client) => client.close()));
    throw error;
  }
}
