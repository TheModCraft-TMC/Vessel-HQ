import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { validateSources } from './source-policy.mjs';
import { sourceArchive } from './archive.mjs';

// Changing this policy requires a new trusted release baseline, never an extension grant.
const roots = [
  'web-src',
  'translations',
  'scripts',
  'patches',
  '__mocks__',
  '.storybook',
  'package.json',
  'pnpm-lock.yaml',
  'eslint.config.mjs',
  'vitest.config.mts',
  'vitest.extensions.config.mts',
  'examples/native-extensions',
  '.prettierrc',
  '.prettierignore',
  '.node-version',
  '.nvmrc',
  'RELEASE_VERSION',
];
const caches = new Set(['node_modules', '.next', '.cache', '.eslintcache', '.DS_Store']);
const namespace = 'web-src/core/native-extensions/packages';
const registration = 'web-src/core/native-extensions/generated/registrations.ts';
async function atomicJSON(file, value) {
  const temporary = `${file}.${process.pid}.tmp`;
  await fs.writeFile(temporary, json(value), { flag: 'wx' });
  await fs.rename(temporary, file);
}
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const fail = (message) => {
  throw new Error(message);
};
const safePath = (value) =>
  typeof value === 'string' &&
  ![...value].some((character) => character.charCodeAt(0) < 32 || character === '\\' || character === ':') &&
  !value.split('/').some((part) => ['', '.', '..'].includes(part)) &&
  !value.startsWith('/');
const excluded = (relative) => relative.split('/').some((part) => caches.has(part) || part === '.env' || part.startsWith('.env.')) || relative.endsWith('.tsbuildinfo');

async function inventory(root, selectedRoots, skip = () => false) {
  if (!(await fs.lstat(root)).isDirectory()) fail('Source root must be a directory, not a symlink');
  const entries = {};
  async function visit(relative) {
    if (!safePath(relative)) fail(`Unsafe source path: ${relative}`);
    if (skip(relative)) return;
    const absolute = path.join(root, relative);
    const stat = await fs.lstat(absolute);
    if (stat.isSymbolicLink()) fail(`Symlinks are forbidden: ${relative}`);
    if (stat.isDirectory()) {
      entries[relative] = { type: 'directory' };
      for (const child of (await fs.readdir(absolute)).sort()) await visit(`${relative}/${child}`);
    } else if (stat.isFile()) {
      entries[relative] = { type: 'file', digest: sha(await fs.readFile(absolute)), executable: Boolean(stat.mode & 0o111) };
    } else fail(`Unsupported file type: ${relative}`);
  }
  for (const relative of selectedRoots.sort()) {
    try {
      await visit(relative);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return Object.fromEntries(Object.entries(entries).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

async function artifactDigest(root) {
  const entries = {};
  const realRoot = await fs.realpath(root);
  if (realRoot !== path.resolve(root)) fail('Artifact root must not traverse symlinks');
  async function visit(relative) {
    const target = path.join(root, relative);
    const stat = await fs.lstat(target);
    if (stat.isSymbolicLink()) {
      const link = await fs.readlink(target);
      const resolved = await fs.realpath(target);
      if (path.isAbsolute(link) || !resolved.startsWith(`${realRoot}${path.sep}`)) fail('Artifact contains escaping symlink');
      entries[relative] = { type: 'symlink', target: link };
    } else if (stat.isDirectory()) {
      entries[relative] = { type: 'directory' };
      for (const name of (await fs.readdir(target)).sort()) await visit(path.join(relative, name));
    } else if (stat.isFile()) entries[relative] = { type: 'file', digest: sha(await fs.readFile(target)), executable: Boolean(stat.mode & 0o111) };
    else fail('Artifact contains unsupported file type');
  }
  if (!(await fs.lstat(path.join(root, 'web-src/server.js'))).isFile()) fail('Missing standalone console server');
  await visit('.');
  return sha(json(entries));
}

export async function baseline(root) {
  return { version: 1, policy: 'vessel-native-ui-v1', entries: await inventory(root, [...roots], excluded) };
}

async function trustedBaseline(file, expectedDigest) {
  const bytes = await fs.readFile(file);
  if (!/^[a-f0-9]{64}$/.test(expectedDigest) || sha(bytes) !== expectedDigest) fail('Baseline trust digest mismatch');
  const value = JSON.parse(bytes);
  if (value.version !== 1 || value.policy !== 'vessel-native-ui-v1') fail('Unsupported baseline policy');
  return value;
}

export async function verify(root, file, digest) {
  const expected = await trustedBaseline(file, digest);
  const actual = await baseline(root);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) fail('Protected source integrity mismatch (content, additions, deletions, or file type)');
  return expected;
}

function validateManifest(manifest, entries) {
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    Object.keys(manifest).some((key) => !['id', 'name', 'version', 'description', 'apiVersion', 'packageDigest', 'permissions', 'ui', 'backend'].includes(key))
  )
    fail('Unsupported manifest fields');
  if (typeof manifest.id !== 'string' || !/^[a-z0-9][a-z0-9.-]{1,126}[a-z0-9]$/.test(manifest.id) || manifest.id.includes('..')) fail('Invalid extension ID');
  if (
    manifest.apiVersion !== 'v1' ||
    typeof manifest.version !== 'string' ||
    manifest.version.length === 0 ||
    Buffer.byteLength(manifest.version) > 64 ||
    typeof manifest.name !== 'string' ||
    !manifest.name.trim() ||
    Buffer.byteLength(manifest.name) > 128 ||
    (manifest.description !== undefined && (typeof manifest.description !== 'string' || Buffer.byteLength(manifest.description) > 4096))
  )
    fail('Invalid extension identity/version');
  if (!Array.isArray(manifest.permissions) || manifest.permissions.length > 32) fail('Permissions must be declared');
  if (!manifest.ui && !manifest.backend) fail('A UI or backend entrypoint is required');
  if (manifest.ui && !manifest.permissions.some((p) => p?.capability === 'ui.native')) fail('Native UI permission must be declared');
  if (manifest.backend) {
    if (
      Object.keys(manifest.backend).some((key) => !['type', 'entrypoints'].includes(key)) ||
      manifest.backend.type !== 'executable' ||
      !manifest.backend.entrypoints ||
      typeof manifest.backend.entrypoints !== 'object' ||
      Array.isArray(manifest.backend.entrypoints) ||
      !Object.keys(manifest.backend.entrypoints).length
    )
      fail('Invalid backend descriptor');
    for (const [platform, entry] of Object.entries(manifest.backend.entrypoints)) {
      if (!['linux-amd64', 'linux-arm64'].includes(platform) || entry !== `backend/${platform}/extension` || entries[entry]?.type !== 'file')
        fail('Invalid backend executable entrypoint');
    }
  }
  const seen = new Set();
  for (const permission of manifest.permissions) {
    if (!permission || Object.keys(permission).some((key) => !['capability', 'environmentIds', 'stackIds'].includes(key))) fail('Unsupported permission fields');
    if (seen.has(permission.capability) || !['ui.native', 'environments.read', 'containers.read', 'stacks.read', 'stacks.network.read', 'stacks.traffic.read', 'storage.read', 'storage.write', 'storage.service.read', 'storage.service.write'].includes(permission.capability))
      fail('Invalid or duplicate capability');
    seen.add(permission.capability);
    if (
      !Array.isArray(permission.environmentIds) ||
      permission.environmentIds.length > 1000 ||
      permission.environmentIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
      new Set(permission.environmentIds).size !== permission.environmentIds.length ||
      (['ui.native', 'storage.read', 'storage.write', 'storage.service.read', 'storage.service.write'].includes(permission.capability) ? permission.environmentIds.length !== 0 : permission.environmentIds.length === 0)
    )
      fail('Explicit valid permission scopes required');
    if (['stacks.network.read', 'stacks.traffic.read'].includes(permission.capability)) {
      if (
        !Array.isArray(permission.stackIds) ||
        !permission.stackIds.length ||
        permission.stackIds.length > 1000 ||
        permission.stackIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
        new Set(permission.stackIds).size !== permission.stackIds.length
      )
        fail('Explicit stack scopes required');
    } else if (permission.stackIds !== undefined) fail('Stack scopes only apply to stack network and traffic reads');
  }
  if (!manifest.ui) return;
  if (
    !manifest.ui ||
    Object.keys(manifest.ui).some((key) => !['entry', 'slots'].includes(key)) ||
    !safePath(manifest.ui.entry) ||
    Buffer.byteLength(manifest.ui.entry) > 256 ||
    !/^ui\/.*\.(tsx|ts)$/.test(manifest.ui.entry) ||
    entries[manifest.ui.entry]?.type !== 'file'
  )
    fail('Invalid native UI entry');
  if (!Array.isArray(manifest.ui.slots) || !manifest.ui.slots.length || manifest.ui.slots.length > 32) fail('Native slots required');
  const slots = new Set();
  for (const slot of manifest.ui.slots) {
    if (
      !slot ||
      Object.keys(slot).some((key) => !['id', 'title', 'slot'].includes(key)) ||
      typeof slot.id !== 'string' ||
      !/^[a-z0-9][a-z0-9.-]{1,126}[a-z0-9]$/.test(slot.id) ||
      slots.has(slot.id) ||
      !['extension.page', 'docker.stack.detail.action'].includes(slot.slot) ||
      typeof slot.title !== 'string' ||
      !slot.title.trim() ||
      Buffer.byteLength(slot.title) > 128
    )
      fail('Invalid or duplicate native slot');
    slots.add(slot.id);
  }
}

export async function inspectPackage(root, { verifyDigest = true } = {}) {
  const names = await fs.readdir(root);
  const entries = await inventory(
    root,
    names,
    (name) => name === 'README.md' || (name.startsWith('ui/') && (name.split('/').includes('__tests__') || /\.(test|spec)\.tsx?$/.test(name)))
  );
  if (Object.keys(entries).length > 512) fail('Package exceeds 512 entries');
  if (entries['manifest.json']?.type !== 'file') fail('Missing manifest.json');
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'));
  validateManifest(manifest, entries);
  const binaries = new Map(Object.entries(manifest.backend?.entrypoints ?? {}).map(([platform, name]) => [name, platform]));
  const backendDirectories = new Set([...binaries.keys()].flatMap((name) => [name.split('/')[0], name.split('/').slice(0, 2).join('/')]));
  let expandedSize = 0;
  for (const [name, entry] of Object.entries(entries)) {
    if (!/^[A-Za-z0-9._/-]+$/.test(name) || name.length > 256 || name.split('/').length > 16) fail(`Package path must be bounded safe ASCII: ${name}`);
    const binary = binaries.get(name);
    const backendDirectory = entry.type === 'directory' && backendDirectories.has(name);
    if (name !== 'manifest.json' && name !== 'ui' && !binary && !backendDirectory && (!name.startsWith('ui/') || (entry.type === 'file' && !/\.(tsx|ts|css)$/.test(name))))
      fail(`Package path is not permitted: ${name}`);
    if (entry.type === 'file') {
      const bytes = await fs.readFile(path.join(root, name));
      expandedSize += bytes.length;
      if (bytes.length > 128 * 1024 * 1024 || expandedSize > 256 * 1024 * 1024) fail('Package exceeds source size limits');
      if (binary) {
        if (
          bytes.length < 64 ||
          bytes.readUInt32BE(0) !== 0x7f454c46 ||
          bytes[4] !== 2 ||
          bytes[5] !== 1 ||
          ![2, 3].includes(bytes.readUInt16LE(16)) ||
          bytes.readUInt16LE(18) !== (binary === 'linux-amd64' ? 62 : 183)
        )
          fail(`Backend must be a matching Linux ELF64 executable: ${name}`);
        entry.executable = true; // Canonical role, independent of local filesystem mode.
      } else if (entry.executable) fail(`Executable UI/manifest input forbidden: ${name}`);
    }
  }
  const sourceEntries = Object.fromEntries(Object.entries(entries).filter(([name]) => name !== 'manifest.json'));
  const packageDigest = `sha256:${sha(json(sourceEntries))}`;
  if (verifyDigest && manifest.packageDigest !== packageDigest) fail(`Package digest mismatch; calculated ${packageDigest}`);
  await validateSources(root, entries);
  return { manifest, entries, manifestDigest: `sha256:${entries['manifest.json'].digest}`, computedPackageDigest: packageDigest };
}

export async function pack(root, output) {
  if (!output.endsWith('.vesselhq')) fail('Package archive must end in .vesselhq');
  const source = await fs.realpath(root);
  const target = path.join(await fs.realpath(path.dirname(path.resolve(output))), path.basename(output));
  if (target.startsWith(`${source}${path.sep}`)) fail('Archive output must be outside the package');
  const inspected = await inspectPackage(root);
  const archiveEntries = [];
  let size = 0;
  for (const [name, entry] of Object.entries(inspected.entries)) {
    const bytes = entry.type === 'directory' ? Buffer.alloc(0) : await fs.readFile(path.join(root, name));
    if (entry.type === 'file' && sha(bytes) !== entry.digest) fail(`Package changed while packing: ${name}`);
    size += bytes.length;
    if (size > 256 * 1024 * 1024) fail('Expanded package exceeds 256 MiB');
    archiveEntries.push({ name, bytes, directory: entry.type === 'directory', executable: entry.executable });
  }
  const archive = sourceArchive(archiveEntries);
  if (archive.length > 64 * 1024 * 1024) fail('Package archive exceeds 64 MiB');
  await fs.writeFile(target, archive, { flag: 'wx', mode: 0o600 });
  return { path: target, packageDigest: inspected.manifest.packageDigest, archiveDigest: `sha256:${sha(archive)}`, bytes: archive.length };
}

async function copyEntries(source, destination, entries) {
  for (const [relative, entry] of Object.entries(entries)) {
    const target = path.join(destination, relative);
    if (entry.type === 'directory') await fs.mkdir(target, { recursive: true });
    else {
      const bytes = await fs.readFile(path.join(source, relative));
      if (sha(bytes) !== entry.digest) fail(`Input changed during staging: ${relative}`);
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, bytes, { flag: 'wx', mode: entry.executable ? 0o755 : 0o644 });
    }
  }
}

export async function stage(root, baselineFile, digest, output, packageRoots) {
  const protectedInputs = await verify(root, baselineFile, digest);
  const packages = [];
  for (const source of packageRoots) packages.push({ source, ...(await inspectPackage(source)) });
  if (!packages.length || new Set(packages.map((item) => item.manifest.id)).size !== packages.length) fail('Supply a nonempty package set with unique IDs');
  const absoluteOutput = path.join(await fs.realpath(path.dirname(path.resolve(output))), path.basename(output));
  const absoluteRoot = await fs.realpath(root);
  if (absoluteOutput === absoluteRoot || absoluteOutput.startsWith(`${absoluteRoot}${path.sep}`)) fail('Candidate must be outside the source tree');
  // mkdir without recursive guarantees no overwrite of an existing candidate.
  await fs.mkdir(absoluteOutput);
  await copyEntries(root, absoluteOutput, protectedInputs.entries);
  // Next rewrites this framework-owned declaration between dev and production.
  // Normalize only its known generated type imports in the disposable candidate;
  // arbitrary core content remains bound to the reviewed input inventory.
  const nextEnv = path.join(absoluteOutput, 'web-src/next-env.d.ts');
  try {
    const declarations = await fs.readFile(nextEnv, 'utf8');
    await fs.writeFile(nextEnv, declarations.replaceAll('import "./.next/dev/types/', 'import "./.next/types/'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const registrations = [];
  for (const item of packages) {
    const frontendEntries = Object.fromEntries(Object.entries(item.entries).filter(([name]) => name === 'manifest.json' || name === 'ui' || name.startsWith('ui/')));
    await copyEntries(item.source, path.join(absoluteOutput, namespace, item.manifest.id), frontendEntries);
    // The transformation is trusted assembler output. Approved package digests
    // identify the original sources; candidate input hashes bind compiled inputs.
    for (const [relative, entry] of Object.entries(item.entries)) {
      if (!relative.startsWith('ui/') || entry.type !== 'file' || !/\.(tsx|ts)$/.test(relative)) continue;
      const target = path.join(absoluteOutput, namespace, item.manifest.id, relative);
      await fs.writeFile(target, `'use client';\n${await fs.readFile(target, 'utf8')}`);
    }
    if (item.manifest.ui)
      registrations.push(
        `  { id: ${JSON.stringify(item.manifest.id)}, packageDigest: ${JSON.stringify(item.manifest.packageDigest)}, uiEntry: ${JSON.stringify(item.manifest.ui.entry)}, slots: ${JSON.stringify(item.manifest.ui.slots)}, load: () => import(${JSON.stringify(`../packages/${item.manifest.id}/${item.manifest.ui.entry.replace(/\.(tsx|ts)$/, '')}`)}) },`
      );
  }
  const generated = `'use client';\n// Generated by the trusted Vessel assembler.\nimport type { NativeExtensionRegistration } from '../types';\n\nexport const nativeExtensionRegistrations: NativeExtensionRegistration[] = [\n${registrations.join('\n')}\n];\n`;
  await fs.mkdir(path.dirname(path.join(absoluteOutput, registration)), { recursive: true });
  await fs.writeFile(path.join(absoluteOutput, registration), generated);
  const candidateInputs = await baseline(absoluteOutput);
  const receipt = {
    version: 1,
    status: 'staged',
    activatable: false,
    baselineDigest: digest,
    inputDigest: sha(json(candidateInputs)),
    registrationsDigest: sha(generated),
    packages: packages.map(({ manifest, manifestDigest, entries }) => ({
      manifest,
      manifestDigest,
      backendArtifacts: Object.fromEntries(Object.entries(entries).filter(([name, entry]) => name.startsWith('backend/') && entry.type === 'file')),
      runtimeStaged: false,
    })),
    checks: [],
  };
  await fs.writeFile(path.join(absoluteOutput, 'candidate-inputs.json'), json(candidateInputs));
  await fs.writeFile(path.join(absoluteOutput, 'candidate.json'), json(receipt));
  await verify(root, baselineFile, digest);
  return receipt;
}

const checks = ['check:frontend-modernization', 'check:frontend-boundaries', 'check:app-router-compliance', 'typecheck', 'test:extensions', 'test', 'lint:ci', 'build'];
function run(command, args, containerName) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env: { PATH: process.env.PATH, HOME: process.env.HOME } });
    let settled = false;
    let stopping = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      process.removeListener('SIGINT', interrupted);
      process.removeListener('SIGTERM', interrupted);
      if (error) reject(error);
      else resolve();
    };
    const stop = (message) => {
      if (stopping) return;
      stopping = true;
      child.kill('SIGTERM');
      const cleanup = spawn('docker', ['rm', '--force', containerName], { stdio: 'ignore', timeout: 30000, env: { PATH: process.env.PATH, HOME: process.env.HOME } });
      cleanup.once('error', () => finish(new Error(`${message}; container cleanup failed`)));
      cleanup.once('exit', (code) => finish(new Error(`${message}${code === 0 ? '' : '; verify container cleanup'}`)));
    };
    const interrupted = () => stop('Validation interrupted');
    const timer = setTimeout(() => stop('Validation exceeded 15 minute deadline'), 15 * 60 * 1000);
    process.once('SIGINT', interrupted);
    process.once('SIGTERM', interrupted);
    child.once('error', (error) => {
      if (!stopping) finish(error);
    });
    child.once('exit', (code) => {
      if (!stopping) finish(code === 0 ? undefined : new Error(`Validation exited with code ${code}`));
    });
  });
}

// Untrusted UI can execute during bundling. Only run it in an operator-provided,
// pinned, pre-provisioned build image; never run package scripts on the host.
export async function build(candidate, image, trustedReceiptDigest) {
  if (!/^(?:[a-zA-Z0-9./:_-]+@)?sha256:[a-f0-9]{64}$/.test(image)) fail('Builder image must be pinned by sha256 digest');
  const root = await fs.realpath(candidate);
  const inputs = await fs.readFile(path.join(root, 'candidate-inputs.json'));
  const receiptBytes = await fs.readFile(path.join(root, 'candidate.json'));
  if (!/^[a-f0-9]{64}$/.test(trustedReceiptDigest) || sha(receiptBytes) !== trustedReceiptDigest) fail('Staged receipt trust digest mismatch');
  const receipt = JSON.parse(receiptBytes);
  if (receipt.status !== 'staged' || receipt.inputDigest !== sha(inputs)) fail('Invalid staged receipt');
  const expected = JSON.parse(inputs);
  if (JSON.stringify(await baseline(root)) !== JSON.stringify(expected)) fail('Candidate source integrity mismatch');
  for (const item of receipt.packages) {
    const packageRoot = path.join(root, namespace, item.manifest.id);
    await validateSources(packageRoot, await inventory(packageRoot, await fs.readdir(packageRoot)));
  }
  const dependenciesVolume = `vessel-extension-deps-${randomUUID()}`;
  receipt.builderImage = image;
  receipt.status = 'building';
  await atomicJSON(path.join(root, 'candidate.json'), receipt);
  try {
    const seedContainer = `vessel-extension-${randomUUID()}`;
    await run(
      'docker',
      [
        'run',
        '--rm',
        '--name',
        seedContainer,
        '--network=none',
        '--cap-drop=ALL',
        '--security-opt=no-new-privileges',
        '--read-only',
        '--pids-limit=256',
        '--memory=6g',
        '--cpus=4',
        '--user',
        '0:0',
        '--mount',
        `type=volume,src=${dependenciesVolume},dst=/deps`,
        image,
        'node',
        '/opt/vessel/validate.mjs',
        '--seed-dependencies',
      ],
      seedContainer
    );
    for (const check of checks) {
      const containerName = `vessel-extension-${randomUUID()}`;
      // Image supplies approved /opt/vessel/node_modules matching the lock digest.
      await run(
        'docker',
        [
          'run',
          '--rm',
          '--name',
          containerName,
          '--network=none',
          '--cap-drop=ALL',
          '--security-opt=no-new-privileges',
          '--read-only',
          '--pids-limit=256',
          '--memory=6g',
          '--cpus=4',
          '--user',
          `${process.getuid?.() ?? 65534}:${process.getgid?.() ?? 65534}`,
          '--tmpfs',
          '/tmp:rw,nosuid,nodev,size=1g',
          ...['.cache', '.vite', '.vite-temp'].flatMap((directory) => ['--tmpfs', `/workspace/node_modules/${directory}:rw,nosuid,nodev,size=1g,mode=1777`]),
          '--mount',
          `type=bind,src=${root},dst=/workspace`,
          '--mount',
          `type=volume,src=${dependenciesVolume},dst=/workspace/node_modules,readonly`,
          '--workdir',
          '/workspace',
          '--env',
          'HOME=/tmp',
          '--env',
          'NEXT_TELEMETRY_DISABLED=1',
          image,
          'node',
          '/opt/vessel/validate.mjs',
          check,
        ],
        containerName
      );
      if (JSON.stringify(await baseline(root)) !== JSON.stringify(expected)) fail('Build modified protected candidate inputs');
      receipt.checks.push({ name: check, passed: true });
    }
    receipt.artifactDigest = await artifactDigest(path.join(root, 'dist/next'));
    receipt.status = 'validated';
    // Health/browser checks, grant revision binding and serving adapter are mandatory.
    receipt.activatable = false;
    receipt.pending = ['browser-smoke', 'health', 'approval-revision', 'artifact-serving-adapter'];
  } catch (error) {
    receipt.status = 'failed';
    receipt.activatable = false;
    receipt.error = error.message;
    throw error;
  } finally {
    const cleanup = spawnSync('docker', ['volume', 'rm', '--force', dependenciesVolume], {
      stdio: 'ignore',
      timeout: 30000,
      env: { PATH: process.env.PATH, HOME: process.env.HOME },
    });
    if (cleanup.status !== 0) receipt.cleanupWarning = `Verify removal of Docker volume ${dependenciesVolume}`;
    await atomicJSON(path.join(root, 'candidate.json'), receipt);
  }
  return receipt;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'baseline' && args.length === 2) {
    const bytes = json(await baseline(args[0]));
    await fs.writeFile(args[1], bytes, { flag: 'wx' });
    process.stdout.write(`${sha(bytes)}\n`);
  } else if (command === 'verify' && args.length === 3) {
    await verify(...args);
    process.stdout.write('Protected source verified\n');
  } else if (command === 'inspect' && args.length === 1) process.stdout.write(json(await inspectPackage(args[0])));
  else if (command === 'digest' && args.length === 1) process.stdout.write(`${(await inspectPackage(args[0], { verifyDigest: false })).computedPackageDigest}\n`);
  else if (command === 'pack' && args.length === 2) process.stdout.write(json(await pack(...args)));
  else if (command === 'stage-archive' && args.length === 7) {
    const { prepareArchive } = await import('./develop.mjs');
    const [source, baselineFile, baselineDigest, candidate, archive, archiveDigest, extractor] = args;
    const receipt = await prepareArchive({ source, baselineFile, baselineDigest, candidate, archive, archiveDigest, extractor });
    process.stdout.write(json({ receipt, receiptDigest: sha(json(receipt)) }));
  } else if (command === 'stage' && args.length >= 5) {
    const receipt = await stage(...args.slice(0, 4), args.slice(4));
    process.stdout.write(json({ receipt, receiptDigest: sha(json(receipt)) }));
  } else if (command === 'build' && args.length === 3) process.stdout.write(json(await build(...args)));
  else
    fail(
      'Usage: builder.mjs baseline <trusted-root> <manifest> | verify <root> <manifest> <trusted-sha256> | inspect <package> | pack <package> <new-output.vesselhq> | stage <root> <manifest> <trusted-sha256> <new-output> <package...> | build <candidate> <image@sha256:digest> <trusted-receipt-sha256>'
    );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
