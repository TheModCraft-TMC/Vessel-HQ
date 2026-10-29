import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAudit } from './audit-npm-fresh.mjs';

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
