import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { evaluateAudit, evaluateAuditResult, validatePnpmEntry } from './audit-npm-fresh.mjs';

test('missing or partial advisory results fail closed', () => {
  for (const report of [
    {},
    { error: 'offline' },
    { metadata: { vulnerabilities: { low: 0 } } },
    { metadata: { vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0 } } },
  ]) {
    assert.throws(() => evaluateAudit(report));
  }
});

test('CLI applies severity policy to pnpm JSON finding status and retains the report', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vessel-audit-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const entry = path.join(directory, 'pnpm.cjs');
  const script = fileURLToPath(new URL('./audit-npm-fresh.mjs', import.meta.url));
  for (const [severity, expected] of [
    ['low', 0],
    ['moderate', 1],
    ['high', 1],
    ['critical', 1],
  ]) {
    const report = { metadata: { totalDependencies: 10, vulnerabilities: { info: 0, low: 0, moderate: 0, high: 0, critical: 0, [severity]: 1 } } };
    fs.writeFileSync(entry, `process.stdout.write(${JSON.stringify(JSON.stringify(report))}); process.exitCode = 1;`);
    const result = spawnSync(process.execPath, [script], {
      cwd: directory,
      env: { ...process.env, npm_execpath: entry },
      encoding: 'utf8',
    });
    assert.equal(result.status, expected, result.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory, 'dist/security/npm-audit.json'), 'utf8')), report);
  }
});

test('unexpected process failures fail closed even with valid-looking counts', () => {
  const report = { metadata: { totalDependencies: 10, vulnerabilities: { low: 1, moderate: 0, high: 0, critical: 0 } } };
  for (const [status, signal] of [
    [2, null],
    [null, 'SIGTERM'],
    [1, 'SIGTERM'],
  ]) {
    assert.throws(() => evaluateAuditResult(report, status, signal), /process failed/);
  }
  report.metadata.vulnerabilities.low = 0;
  assert.throws(() => evaluateAuditResult(report, 1, null), /process failed/);
  assert.equal(evaluateAuditResult(report, 0, null).blocking, 0);
  for (const info of [-1, '1', NaN]) {
    report.metadata.vulnerabilities.info = info;
    assert.throws(() => evaluateAuditResult(report, 1, null), /incomplete/);
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
