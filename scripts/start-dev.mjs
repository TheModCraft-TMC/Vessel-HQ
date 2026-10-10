import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import process from 'node:process';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const apiOrigin = process.env.PORTAINER_API_ORIGIN || 'http://127.0.0.1:9000';

if (!(await backendIsReady())) {
  await run('make', ['dev-server']);
  if (!(await waitForBackend())) {
    throw new Error(`Development backend is unavailable at ${apiOrigin}`);
  }
}

await import('./start-frontend-dev.mjs');

async function backendIsReady() {
  try {
    const response = await fetch(`${apiOrigin}/api/status`, {
      signal: AbortSignal.timeout(2_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend() {
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await backendIsReady()) {
      return true;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 1_000);
    });
  }

  return false;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      stdio: 'inherit',
    });

    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed (${signal || `exit ${code}`})`));
    });
  });
}
