// Runs only inside the separately trusted build image. No package-defined hooks.
import { createHash } from 'node:crypto';
import { readFile, cp } from 'node:fs/promises';
import { spawn, spawnSync } from 'node:child_process';

const checks = new Set(['check:frontend-modernization', 'check:frontend-boundaries', 'check:app-router-compliance', 'typecheck', 'test:extensions', 'test', 'lint:ci', 'build']);
const check = process.argv[2];
if (check === '--seed-dependencies') {
  // This action receives only a fresh Docker volume, never candidate sources.
  await cp('/opt/vessel/node_modules', '/deps', { recursive: true, verbatimSymlinks: true });
  process.exit(0);
}
if (!checks.has(check)) throw new Error('Unknown validation operation');
const expected = (await readFile('/opt/vessel/lock.sha256', 'utf8')).trim();
const actual = createHash('sha256')
  .update(await readFile('/workspace/pnpm-lock.yaml'))
  .digest('hex');
if (expected !== actual) throw new Error('Build image dependencies do not match candidate lockfile');
// Existing repository guards resolve their root with git. Never mount the real
// checkout's .git or credentials into the build container.
if (spawnSync('git', ['init', '--quiet', '/workspace']).status !== 0) throw new Error('Cannot initialize disposable build metadata');
const child = spawn('pnpm', ['run', check, ...(['test', 'test:extensions'].includes(check) ? ['--maxWorkers=4'] : [])], {
  cwd: '/workspace',
  stdio: 'inherit',
  env: {
    PATH: process.env.PATH,
    HOME: '/tmp',
    COREPACK_HOME: '/opt/vessel/corepack',
    COREPACK_ENABLE_NETWORK: '0',
    COREPACK_ENABLE_DOWNLOAD_PROMPT: '0',
    NEXT_TELEMETRY_DISABLED: '1',
    // V8 otherwise caps this 6 GiB container at a ~2 GiB heap. Keep native
    // allocations and worker overhead within the remaining container budget.
    ...(check === 'build' ? { NODE_OPTIONS: '--max-old-space-size=4096' } : {}),
    CI: 'true',
  },
});
child.once('error', (error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
