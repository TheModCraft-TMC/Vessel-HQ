import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function evaluateAudit(report) {
  const counts = report?.metadata?.vulnerabilities;
  if (report.error || !Number.isSafeInteger(report?.metadata?.totalDependencies) || report.metadata.totalDependencies <= 0 || !counts || !['low', 'moderate', 'high', 'critical'].every(
    (level) => Number.isSafeInteger(counts[level]) && counts[level] >= 0
  )) throw new Error('Advisory service returned an unavailable or incomplete audit report');
  return { counts, blocking: counts.moderate + counts.high + counts.critical };
}

export function validatePnpmEntry(entry) {
  if (typeof entry !== 'string' || !path.isAbsolute(entry) || !['pnpm.cjs', 'pnpm.js', 'pnpm.mjs'].includes(path.basename(entry))) {
    throw new Error('Run pnpm check:npm-security:fresh so pnpm supplies its absolute entry point');
  }
  return entry;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = 'dist/security/npm-audit.json';
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify({ error: 'Advisory scan did not complete' }));
  try {
    const entry = validatePnpmEntry(process.env.npm_execpath);
    // Reuse the invoking, pinned package manager through this fixed Node binary.
    // Do not search PATH for another executable after the scan has started.
    const result = spawnSync(process.execPath, [entry, 'audit', '--json', '--audit-level=moderate'], {
      encoding: 'utf8', timeout: 180_000, maxBuffer: 20 * 1024 * 1024,
    });
    if (result.stdout) fs.writeFileSync(output, result.stdout);
    if (result.error) throw result.error;
    const { counts, blocking } = evaluateAudit(JSON.parse(result.stdout));
    console.log(`Fresh npm advisory counts: ${JSON.stringify(counts)}; report: ${output}`);
    if (blocking || result.status !== 0) process.exitCode = 1;
  } catch (error) {
    console.error(`Fresh advisory scan failed: ${error.message}`);
    process.exitCode = 1;
  }
}
