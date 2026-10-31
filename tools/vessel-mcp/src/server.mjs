import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import { pathToFileURL } from 'node:url';
import { readConfig } from './api.mjs';
import { createRegistry } from './registry.mjs';
import { execute } from './sandbox.mjs';
import { StateStore } from './state.mjs';
import { SYSTEM_PROMPT } from './prompt.mjs';

export const metaTools = [
  {
    name: 'search_tools',
    description: 'Discover configured operations by keyword and tag, without loading schemas.',
    inputSchema: z.object({ query: z.string().max(200).default(''), tag: z.string().max(50).optional(), limit: z.number().int().min(1).max(20).default(10) }).strict(),
  },
  {
    name: 'get_schemas',
    description: 'Get exact schemas and generated TypeScript declarations for selected operations.',
    inputSchema: z.object({ names: z.array(z.string().max(150)).min(1).max(10) }).strict(),
  },
  { name: 'get_tags', description: 'List operation categories.', inputSchema: z.object({}).strict() },
  {
    name: 'execute',
    description:
      'Run a TypeScript function body. Call await tools["name"](args), return final JSON. No imports, process, fetch or credentials. Limits: 10s, 50MiB guest heap, 50 calls. Protected calls pause for external operator approval.',
    inputSchema: z.object({ code: z.string().max(32 * 1024) }).strict(),
  },
  {
    name: 'resume',
    description: 'Resume a paused execution after external operator approval. Cannot grant approval. Original call/time budgets remain in effect.',
    inputSchema: z.object({ continuationId: z.string().regex(/^[a-f0-9]{48}$/) }).strict(),
  },
];
const reply = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value) }] });

export async function createServer(config) {
  const server = new McpServer({ name: 'vessel-code-mode', version: '0.1.0' }, { instructions: SYSTEM_PROMPT });
  const registry = await createRegistry(config);
  const store = config.stateDirectory && config.stateKey ? new StateStore(config.stateDirectory, config.stateKey, registry.revision) : undefined;
  let active = false;
  for (const { name, ...definition } of metaTools) {
    server.registerTool(
      name,
      { ...definition, annotations: { readOnlyHint: !['execute', 'resume'].includes(name), destructiveHint: ['execute', 'resume'].includes(name), openWorldHint: true } },
      async (args, context) => {
        try {
          if (name === 'search_tools') return reply(registry.search(args.query, args.tag, args.limit));
          if (name === 'get_schemas') return reply(registry.schemas(args.names));
          if (name === 'get_tags') return reply(registry.tags());
          if (active) throw new Error('Another execution is active');
          active = true;
          try {
            const continuation = name === 'resume' ? await store?.take(args.continuationId) : undefined;
            if (name === 'resume' && !continuation) throw new Error('Persistent approvals are not configured');
            // Approval authorizes exactly the pending call. Subsequent protected
            // calls suspend again, even if they use the same operation name.
            let approved = continuation?.state.args[0];
            const result = await execute(
              args.code ?? '',
              async (operation, input, signal) => {
                const once = approved;
                approved = undefined;
                return registry.call(operation, input, signal, once);
              },
              {
                signal: context.signal,
                names: registry.entries.map((tool) => tool.name),
                continuation,
                onSuspend: store ? (state) => store.save(state) : undefined,
              }
            );
            return reply(result);
          } finally {
            active = false;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Request failed';
          const safe =
            /^(?:Unknown operation|Invalid operation|Environment outside|Operator approval|Persistent approvals|Another execution|Code limit|Operation (?:call|input|result)|Host rate|Sandbox |Execution |Continuation expired|Invalid continuation|Vessel API |Selected schemas)/.test(
              message
            )
              ? message
              : 'Request failed';
          return { ...reply({ error: safe }), isError: true };
        }
      }
    );
  }
  const close = server.close.bind(server);
  server.close = async () => {
    await registry.close();
    await close();
  };
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = readConfig();
    if (process.argv[2] === 'approve' || process.argv[2] === 'inspect') {
      const registry = await createRegistry(config);
      try {
        const store = new StateStore(config.stateDirectory, config.stateKey, registry.revision);
        const id = process.argv[3];
        if (process.argv[2] === 'approve') {
          await store.approve(id);
          process.stderr.write('Pending operation approved once.\n');
        } else {
          const pending = await store.read(id);
          process.stdout.write(
            JSON.stringify({ name: pending.state.args[0], arguments: pending.state.args[1], calls: pending.calls, remainingMs: pending.remainingMs, approved: pending.approved }) +
              '\n'
          );
        }
      } finally {
        await registry.close();
      }
    } else {
      const server = await createServer(config);
      await server.connect(new StdioServerTransport());
    }
  } catch {
    process.stderr.write('Vessel Code Mode failed. Check configuration, policy and continuation state.\n');
    process.exitCode = 1;
  }
}
