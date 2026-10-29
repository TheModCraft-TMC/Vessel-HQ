import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

// Exercise the actual patched transitive dependency used by the build tooling.
const require = createRequire(import.meta.url);
const merge = createRequire(require.resolve('babel-plugin-i18next-extract'))('deepmerge');

test('merging attacker-controlled own __proto__ keys preserves a normal result prototype', () => {
  const malicious = JSON.parse('{"__proto__":{"injected":true},"safe":1}');
  for (const result of [merge(malicious, {}), merge(Object.create(null), malicious), merge({}, { nested: malicious }).nested]) {
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.equal(result.injected, undefined);
    assert.equal({}.injected, undefined);
  }
});

test('normal nested objects, arrays, symbols and custom mergers still work', () => {
  const symbol = Symbol('value');
  assert.deepEqual(merge({ nested: { a: 1 }, list: [1], [symbol]: 2 }, { nested: { b: 2 }, list: [3] }), {
    nested: { a: 1, b: 2 }, list: [1, 3], [symbol]: 2,
  });
  assert.deepEqual(merge({ list: [1] }, { list: [2] }, { customMerge: (key) => key === 'list' ? (_, source) => source : undefined }), { list: [2] });
});
