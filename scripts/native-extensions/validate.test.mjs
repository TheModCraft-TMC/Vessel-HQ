import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const validator = fileURLToPath(new URL('./validate.mjs', import.meta.url));

test('rejects unknown operations before reading trusted image files or launching tools', () => {
  for (const operation of [undefined, '--help', '--config=attacker.json', 'test;echo injected', 'test --filter=attacker', '../build', 'toString']) {
    const result = spawnSync(process.execPath, [validator, ...(operation ? [operation] : [])], {
      encoding: 'utf8',
      env: { PATH: '/unavailable' },
      timeout: 10000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unknown validation operation/);
    assert.doesNotMatch(result.stderr, /ENOENT|dependencies do not match/);
  }
});
