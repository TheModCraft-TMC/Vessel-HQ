// Explicit development-only operator pipeline. Never invoked by an upload or
// extension package. Credentials remain in this trusted host process.
import { createHash, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify, parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

import { baseline, verify, stage, build } from './builder.mjs';

const execute = promisify(execFile);
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const namespace = 'web-src/core/native-extensions/packages';
const registration = 'web-src/core/native-extensions/generated/registrations.ts';

export function approvedRecord(records, expected) {
  const record = records.find((item) => item.manifest?.id === expected.extensionId);
  if (
    !record ||
    record.status !== 'approved' ||
    !Number.isSafeInteger(record.revision) ||
    record.revision < 1 ||
    !record.packageAvailable ||
    record.archiveDigest !== expected.archiveDigest ||
    record.manifest.packageDigest !== expected.packageDigest ||
    !record.trustedNativeUI ||
    !record.grants.some((grant) => grant.capability === 'ui.native' && (grant.environmentIds?.length ?? 0) === 0)
  )
    throw new Error('Exact uploaded package and native UI trust must be currently approved');
  return record;
}

export async function extractArchive(archive, archiveDigest, extractor, output) {
  if (!/^sha256:[a-f0-9]{64}$/.test(archiveDigest)) throw new Error('Trusted archive digest required');
  const result = await execute(path.resolve(extractor), ['--archive', path.resolve(archive), '--expected-digest', archiveDigest, '--out', output], {
    timeout: 30000,
    maxBuffer: 1024 * 1024,
    env: { PATH: process.env.PATH, HOME: process.env.HOME },
  });
  return JSON.parse(result.stdout);
}

async function snapshot(api, token, expected) {
  const response = await fetch(new URL('/api/native-extensions', api), { headers: { Authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Cannot read administrator approval (${response.status})`);
  const records = await response.json();
  if (!Array.isArray(records)) throw new Error('Invalid extension registry response');
  return approvedRecord(records, expected);
}

export function packageSet(options) {
  const packages = options.packages ?? [{ archive: options.archive, archiveDigest: options.archiveDigest, extensionId: options.extensionId, packageDigest: options.packageDigest }];
  if (!Array.isArray(packages) || !packages.length || packages.length > 32 || new Set(packages.map((item) => item?.extensionId)).size !== packages.length)
    throw new Error('Supply 1–32 unique extension packages');
  for (const item of packages) {
    if (!item || typeof item.archive !== 'string' || !item.archive || !/^[a-z0-9][a-z0-9.-]{1,126}[a-z0-9]$/.test(item.extensionId) || item.extensionId.includes('..') || !/^sha256:[a-f0-9]{64}$/.test(item.archiveDigest) || !/^sha256:[a-f0-9]{64}$/.test(item.packageDigest))
      throw new Error('Every package requires archive, extensionId, archiveDigest and packageDigest');
  }
  return packages;
}

export async function prepareArchives({ source, baselineFile, baselineDigest, candidate, extractor, packages }) {
  const temporary = await fs.mkdtemp('/tmp/vessel-verified-extension-');
  try {
    const roots = [];
    for (const [index, item] of packages.entries()) {
      const extracted = await extractArchive(item.archive, item.archiveDigest, extractor, path.join(temporary, `package-${index}`));
      roots.push(extracted.directory);
    }
    const receipt = await stage(source, baselineFile, baselineDigest, candidate, roots);
    receipt.archives = packages.map(({ archiveDigest, extensionId, packageDigest }) => ({ archiveDigest, extensionId, packageDigest }));
    await fs.writeFile(path.join(candidate, 'candidate.json'), json(receipt));
    return receipt;
  } finally {
    await fs.rm(temporary, { recursive: true, force: true });
  }
}

export async function prepareArchive(options) {
  const receipt = await prepareArchives({ ...options, packages: [{ archive: options.archive, archiveDigest: options.archiveDigest }] });
  receipt.archiveDigest = options.archiveDigest;
  await fs.writeFile(path.join(options.candidate, 'candidate.json'), json(receipt));
  return receipt;
}

export async function activateDevelopment({ source, candidate, receipt, baselineFile, baselineDigest, approve }) {
  if (receipt.status !== 'validated' || receipt.checks.length !== 8 || receipt.checks.some((check) => check.passed !== true) || !/^[a-f0-9]{64}$/.test(receipt.artifactDigest))
    throw new Error('Complete successful isolated validation is required');
  await verify(source, baselineFile, baselineDigest);
  const candidateInputs = await fs.readFile(path.join(candidate, 'candidate-inputs.json'));
  if (sha(candidateInputs) !== receipt.inputDigest || JSON.stringify(await baseline(candidate)) !== JSON.stringify(JSON.parse(candidateInputs)))
    throw new Error('Compiled candidate inputs changed before development activation');
  await approve();
  const hostRoot = path.join(source, 'web-src/core/native-extensions');
  const currentPackages = path.join(source, namespace);
  const nextPackages = path.join(hostRoot, `packages-next-${randomUUID()}`);
  const previousPackages = path.join(hostRoot, `packages-previous-${randomUUID()}`);
  const currentRegistration = path.join(source, registration);
  const previousRegistration = await fs.readFile(currentRegistration);
  const newRegistration = await fs.readFile(path.join(candidate, registration));
  if (sha(newRegistration) !== receipt.registrationsDigest) throw new Error('Generated registration changed');
  let movedPrevious = false;
  let selectedNext = false;
  const temporaryRegistration = `${currentRegistration}.${randomUUID()}.tmp`;
  try {
    await fs.cp(path.join(candidate, namespace), nextPackages, { recursive: true, errorOnExist: true, force: false, verbatimSymlinks: true });
    await approve();
    try {
      await fs.rename(currentPackages, previousPackages);
      movedPrevious = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await fs.rename(nextPackages, currentPackages);
    selectedNext = true;
    await fs.writeFile(temporaryRegistration, newRegistration, { flag: 'wx' });
    await fs.rename(temporaryRegistration, currentRegistration);
    await approve();
    // Only the trusted assembler namespaces may differ from the reviewed source.
    const before = JSON.parse(await fs.readFile(baselineFile, 'utf8'));
    const after = await baseline(source);
    const outsideNamespace = (entries) =>
      Object.fromEntries(
        Object.entries(entries).filter(
          ([name]) => name !== namespace && !name.startsWith(`${namespace}/`) && name !== registration && !name.startsWith('web-src/core/native-extensions/packages-previous-')
        )
      );
    if (JSON.stringify(outsideNamespace(before.entries)) !== JSON.stringify(outsideNamespace(after.entries)))
      throw new Error('Protected core changed during development activation');
    if (movedPrevious) await fs.rm(previousPackages, { recursive: true, force: true });
  } catch (error) {
    if (selectedNext) await fs.rm(currentPackages, { recursive: true, force: true });
    if (movedPrevious) await fs.rename(previousPackages, currentPackages);
    await fs.writeFile(currentRegistration, previousRegistration);
    throw error;
  } finally {
    await fs.rm(nextPackages, { recursive: true, force: true });
    await fs.rm(temporaryRegistration, { force: true });
  }
}

export async function developmentPipeline(options) {
  if (!options.development) throw new Error('Explicit --development required; this is not a production release adapter');
  const api = new URL(options.api);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(api.hostname) || !['http:', 'https:'].includes(api.protocol))
    throw new Error('Development controller requires a loopback backend API');
  const source = await fs.realpath(options.source);
  const candidate = path.resolve(options.candidate);
  const tokenFile = await fs.realpath(options.tokenFile);
  if ([source, candidate].some((root) => tokenFile === root || tokenFile.startsWith(`${root}${path.sep}`)))
    throw new Error('Operator credential must be outside source and candidate trees');
  const tokenStat = await fs.stat(tokenFile);
  if (!tokenStat.isFile() || (tokenStat.mode & 0o077) !== 0) throw new Error('Operator token file must be private (0600)');
  const token = (await fs.readFile(tokenFile, 'utf8')).trim();
  if (!token || /\s/.test(token)) throw new Error('Expected one bearer token in private credential file');
  let existing = [];
  try {
    existing = await fs.readdir(path.join(source, namespace));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (existing.length) throw new Error('Initial development controller requires an empty compiled package set; retain the reviewed baseline for a later complete-set rebuild');
  const packages = packageSet(options);
  const initial = await Promise.all(packages.map((expected) => snapshot(api, token, expected)));
  const approve = async () => {
    const current = await Promise.all(packages.map((expected) => snapshot(api, token, expected)));
    if (JSON.stringify(current) !== JSON.stringify(initial)) throw new Error('Approval, package, or grants changed while compiling; candidate rejected');
  };
  const staged = await prepareArchives({ ...options, source, candidate, packages });
  if (staged.packages.length !== packages.length || staged.packages.some((item, index) => item.manifest.id !== packages[index].extensionId || item.manifest.packageDigest !== packages[index].packageDigest))
    throw new Error('Staged packages differ from approved package set');
  staged.approvals = initial;
  await fs.writeFile(path.join(candidate, 'candidate.json'), json(staged));
  await approve();
  const compiled = await build(candidate, options.image, sha(json(staged)));
  await approve();
  await activateDevelopment({ source, candidate, receipt: compiled, baselineFile: options.baselineFile, baselineDigest: options.baselineDigest, approve });
  const result = {
    status: 'development-source-selected',
    productionActivatable: false,
    packages: packages.map((item, index) => ({ extensionId: item.extensionId, packageDigest: item.packageDigest, archiveDigest: item.archiveDigest, approvalRevision: initial[index].revision })),
    checks: compiled.checks,
    artifactDigest: compiled.artifactDigest,
    browserSmokeRequired: true,
  };
  await fs.writeFile(path.join(candidate, 'development-selection.json'), json(result), { flag: 'wx' });
  return result;
}

async function main() {
  const { values } = parseArgs({
    options: Object.fromEntries(
      ['source', 'baseline-file', 'baseline-digest', 'candidate', 'archive', 'archive-digest', 'extractor', 'api', 'token-file', 'extension-id', 'package-digest', 'image', 'packages-file']
        .map((name) => [name, { type: 'string' }])
        .concat([['development', { type: 'boolean', default: false }]])
    ),
  });
  const options = Object.fromEntries(Object.entries(values).map(([name, value]) => [name.replace(/-([a-z])/g, (_, character) => character.toUpperCase()), value]));
  if (options.packagesFile) options.packages = JSON.parse(await fs.readFile(options.packagesFile, 'utf8'));
  process.stdout.write(json(await developmentPipeline(options)));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
