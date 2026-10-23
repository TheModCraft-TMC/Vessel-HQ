import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { getEncoding } from 'js-tiktoken';
import { metaTools } from '../src/server.mjs';
import { getSchemas, catalog } from '../src/catalog.mjs';
import { execute } from '../src/sandbox.mjs';
import { SYSTEM_PROMPT } from '../src/prompt.mjs';
import { z } from 'zod';

const encoder = getEncoding('cl100k_base');
const tokens = (value) => encoder.encode(typeof value === 'string' ? value : JSON.stringify(value)).length;
const meta = metaTools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema: z.toJSONSchema(inputSchema) }));
const baseline = getSchemas(catalog.map((tool) => tool.name));
const context = [baseline.length, 100, 1000].map((count) => {
  const tools = count === baseline.length ? baseline : Array.from({ length: count }, (_, i) => ({ ...baseline[i % baseline.length], name: `tool_${i}` }));
  const direct = tokens(tools);
  const discovery = tokens(meta) + tokens(SYSTEM_PROMPT);
  return {
    catalogSize: count,
    synthetic: count !== baseline.length,
    directSchemaTokens: direct,
    codeModeInitialTokens: discovery,
    reductionPercent: Number((100 * (1 - discovery / direct)).toFixed(2)),
  };
});
const rows = Array.from({ length: 500 }, (_, id) => ({ id, name: `service-${id}`, state: id % 2 ? 'running' : 'stopped' }));
const cases = [
  ['filter', 'const rows=await tools["list"]({}); return rows.filter(r=>r.state==="running").length;', rows.filter((r) => r.state === 'running').length],
  ['branch', 'const rows=await tools["list"]({}); if(rows.length>100) return "large"; return "small";', 'large'],
  ['chain', 'const a=await tools["list"]({}); const b=await tools["list"]({}); return {count:a.length+b.length};', { count: 1000 }],
];
const directPrograms = {
  filter: async (invoke) => (await invoke()).filter((row) => row.state === 'running').length,
  branch: async (invoke) => ((await invoke()).length > 100 ? 'large' : 'small'),
  chain: async (invoke) => ({ count: (await invoke()).length + (await invoke()).length }),
};
const workflows = [];
for (const [name, code, expected] of cases) {
  const directStart = performance.now();
  const directValue = await directPrograms[name](async () => rows);
  const directLatencyMs = Number((performance.now() - directStart).toFixed(3));
  assert.deepEqual(directValue, expected);
  const start = performance.now();
  const result = await execute(code, async () => rows, { names: ['list'] });
  const latencyMs = Number((performance.now() - start).toFixed(2));
  assert.deepEqual(result.value, expected);
  workflows.push({
    name,
    success: true,
    sandboxAndMockHostLatencyMs: latencyMs,
    directMockProgramLatencyMs: directLatencyMs,
    hostCalls: result.calls,
    directIntermediatePayloadTokens: result.calls * tokens(rows),
    finalPayloadTokens: tokens(result.value),
  });
}
process.stdout.write(
  JSON.stringify(
    {
      tokenizer: 'cl100k_base',
      method:
        'Offline deterministic fixtures; serialized tool definitions plus Code Mode instructions. No model calls, network or provider charges. Synthetic catalogs repeat real schema shapes under distinct names. Measures actual encoded tokens, not production model billing or task accuracy.',
      context,
      workflows,
      successRate: `${workflows.length}/${cases.length}`,
      limitations:
        'No legacy agent loop exists in this repository. Direct payload counts model the same fixture results returning to an LLM. Timings compare the same fixture programs on the host versus cold child process/native VM plus mocked host calls; neither includes LLM end-to-end latency. Code Mode adds local isolation overhead. Discovery/schema reply and generated code tokens are extra on-demand costs. Small catalogs may cost more in Code Mode.',
    },
    null,
    2
  ) + '\n'
);
