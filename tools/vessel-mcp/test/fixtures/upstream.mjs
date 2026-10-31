import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
const server = new McpServer({ name: 'fixture', version: '1' });
server.registerTool('list', { inputSchema: z.object({ count: z.number().int().min(0).max(100) }).strict() }, async ({ count }) => ({
  content: [],
  structuredContent: { items: Array.from({ length: count }, (_, id) => ({ id, password: randomUUID() })) },
}));
server.registerTool('update', { inputSchema: z.object({ id: z.number().int() }).strict() }, async ({ id }) => ({ content: [], structuredContent: { updated: id } }));
await server.connect(new StdioServerTransport());
