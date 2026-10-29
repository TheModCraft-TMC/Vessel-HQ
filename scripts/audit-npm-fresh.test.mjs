import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { evaluateAudit, validatePnpmEntry } from './audit-npm-fresh.mjs';

test('missing or partial advisory results fail closed', () => {
  for (const report of [{}, { error: 'offline' }, { metadata: { vulnerabilities: { low: 0 } } }, { metadata: { vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0 } } }]) {
    assert.throws(() => evaluateAudit(report));
  }
});
test('moderate and higher findings block; low findings remain visible', () => {
  const counts = { low: 1, moderate: 0, high: 0, critical: 0 };
  assert.equal(evaluateAudit({ metadata: { vulnerabilities: counts, totalDependencies: 1 } }).blocking, 0);
  counts.high = 1;
  assert.equal(evaluateAudit({ metadata: { vulnerabilities: counts, totalDependencies: 1 } }).blocking, 1);
});

test('audit entry point rejects PATH commands and unexpected interpreters', () => {
  for (const entry of [undefined, 'pnpm', '--eval', path.resolve('npm-cli.js')]) assert.throws(() => validatePnpmEntry(entry));
  const entry = path.resolve('pnpm.cjs');
  assert.equal(validatePnpmEntry(entry), entry);
});
