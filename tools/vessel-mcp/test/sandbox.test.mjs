import test from 'node:test';
import assert from 'node:assert/strict';
import { execute, ApprovalRequired, LIMITS } from '../src/sandbox.mjs';

const call = (code, invoke = async () => [1, 2, 3], options = {}) => execute(code, invoke, { names: ['list', 'update'], ...options });

test('TypeScript async workflow keeps intermediate results local', async () => {
  const result = await call('const min:number = 1; const items=await tools["list"]({}); let total=0; for(const n of items){if(n>min) total+=n;} return {total};');
  assert.deepEqual(result, { status: 'complete', value: { total: 5 }, calls: 1 });
});
test('multiple chained host reads and branches execute in one turn', async () => {
  const result = await call('const a=await tools["list"]({}); const b=await tools["list"]({}); return a.filter(n=>b.includes(n)).length;');
  assert.equal(result.value, 3);
  assert.equal(result.calls, 2);
});
test('no process, require, fetch, filesystem, network or environment capability', async () => {
  for (const code of [
    'return process.env;',
    'return require("fs");',
    'return await fetch("https://example.com");',
    'return globalThis.process;',
    'return tools.constructor.constructor("return process")();',
    'import fs from "node:fs"; return fs;',
  ]) {
    await assert.rejects(call(code), /Sandbox/);
  }
});
test('infinite loop and host request that ignores cancellation terminate', async () => {
  const start = Date.now();
  await assert.rejects(call('while(true){}', undefined, { limits: { timeoutMs: 200 } }), /limit|cancel|Sandbox/);
  await assert.rejects(
    call('return await tools["list"]({});', () => new Promise(() => {}), { limits: { timeoutMs: 200 } }),
    /limit|cancel/
  );
  assert.ok(Date.now() - start < 3000);
});
test('call budget is enforced before call 51', async () => {
  let calls = 0;
  await assert.rejects(
    call('for(let i=0;i<51;i++){ await tools["list"]({}); } return true;', async () => {
      calls++;
      return [];
    }),
    /call limit/
  );
  assert.equal(calls, 50);
});
test('guest heap, code and output limits reject excess', async () => {
  await assert.rejects(
    call('const a=[]; for(let i=0;i<1000000;i++) a.push("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"+i); return a;', undefined, { limits: { memoryLimitBytes: 1024 * 1024 } }),
    /Sandbox/
  );
  await assert.rejects(call(' '.repeat(LIMITS.maxCodeBytes + 1)), /Code limit/);
  await assert.rejects(call('return "x".repeat(300000);'), /output limit/);
});
test('fresh runs do not retain variables', async () => {
  assert.equal((await call('const privateState=42; return privateState;')).value, 42);
  assert.equal((await call('return privateState;')).value, null);
});
test('cancellation aborts active host operation', async () => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120);
  try {
    await assert.rejects(
      call('return await tools["list"]({});', () => new Promise(() => {}), { signal: controller.signal }),
      /cancel/
    );
  } finally {
    clearTimeout(timer);
  }
});
test('portable snapshot resumes in a fresh process and retains call budget', async () => {
  let saved;
  const pending = await call(
    'const before=await tools["list"]({}); const result=await tools["update"]({id:before[1]}); return result;',
    async (name) => {
      if (name === 'update') throw new ApprovalRequired();
      return [4, 8];
    },
    {
      onSuspend: async (state) => {
        saved = state;
        return { continuationId: 'example' };
      },
    }
  );
  assert.equal(pending.status, 'approval_required');
  assert.equal(saved.calls, 2);
  const result = await call('', async (name, args) => ({ name, id: args.id }), { continuation: saved });
  assert.deepEqual(result.value, { name: 'update', id: 8 });
  assert.equal(result.calls, 2);
});
