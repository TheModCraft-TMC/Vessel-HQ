import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

async function releaseBuildLock(lock, ownerFile, owner) {
  const current = JSON.parse(await fs.readFile(ownerFile, 'utf8'));
  if (current.owner !== owner) throw new Error('Build lock ownership changed; inspect it before retrying.');
  await fs.rm(lock, { recursive: true });
}

// A crashed owner leaves a visible lock. Operators inspect it before removing it;
// automatically stealing a lock based on PID age can overlap a live Docker build.
export async function withBuildLock(directory, operation) {
  const root = await fs.realpath(directory);
  const lock = path.join(root, '.vessel-build.lock');
  try {
    await fs.mkdir(lock, { mode: 0o700 });
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('A build lock already exists. Inspect its owner before retrying.');
    throw error;
  }
  const owner = randomUUID();
  const ownerFile = path.join(lock, 'owner.json');
  try {
    await fs.writeFile(ownerFile, JSON.stringify({ owner, pid: process.pid, startedAt: new Date().toISOString() }), { flag: 'wx', mode: 0o600 });
    return await operation();
  } finally {
    await releaseBuildLock(lock, ownerFile, owner);
  }
}
