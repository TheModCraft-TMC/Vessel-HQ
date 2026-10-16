import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

import { baseline, verify, inspectPackage, stage, build, pack } from './builder.mjs';

const sha = (value) => createHash('sha256').update(value).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;
async function fixture(t) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'vessel-extension-test-'));
  t.after(() => fs.rm(temp, { recursive: true, force: true }));
  const root = path.join(temp, 'source');
  await fs.mkdir(path.join(root, 'web-src/app'), { recursive: true });
  await fs.writeFile(path.join(root, 'web-src/app/permissions.tsx'), 'protected');
  await fs.writeFile(path.join(root, 'package.json'), '{}');
  const value = json(await baseline(root));
  const file = path.join(temp, 'baseline.json');
  await fs.writeFile(file, value);
  return { temp, root, file, digest: sha(value) };
}
const example = path.resolve('examples/native-extensions/environment-summary');

test('trusted inventory verifies unmodified sources', async (t) => {
  const f = await fixture(t);
  await verify(f.root, f.file, f.digest);
});
for (const change of ['modified', 'added', 'deleted', 'symlink', 'executable']) {
  test(`rejects protected ${change} input`, async (t) => {
    const f = await fixture(t);
    const target = path.join(f.root, 'web-src/app/permissions.tsx');
    if (change === 'modified') await fs.writeFile(target, 'tampered');
    if (change === 'added') await fs.writeFile(path.join(f.root, 'web-src/app/injected.tsx'), 'new');
    if (change === 'deleted') await fs.unlink(target);
    if (change === 'symlink') {
      await fs.unlink(target);
      await fs.symlink('/etc/passwd', target);
    }
    if (change === 'executable') await fs.chmod(target, 0o755);
    await assert.rejects(verify(f.root, f.file, f.digest));
  });
}
test('replacement baseline cannot bless modified sources', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'package.json'), '{"scripts":{"build":"evil"}}');
  await fs.writeFile(f.file, json(await baseline(f.root)));
  await assert.rejects(verify(f.root, f.file, f.digest), /trust digest/);
});
test('cache and credential files are never staged', async (t) => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.root, 'web-src/.env.production'), 'secret');
  await fs.mkdir(path.join(f.root, 'web-src/.next'));
  await fs.writeFile(path.join(f.root, 'web-src/.next/cache'), 'output');
  const candidate = path.join(f.temp, 'candidate');
  const receipt = await stage(f.root, f.file, f.digest, candidate, [example]);
  assert.equal(receipt.status, 'staged');
  assert.equal(receipt.activatable, false);
  await assert.rejects(fs.stat(path.join(candidate, 'web-src/.env.production')));
  await assert.rejects(fs.stat(path.join(candidate, 'web-src/.next')));
  const registrations = await fs.readFile(path.join(candidate, 'web-src/core/native-extensions/generated/registrations.ts'), 'utf8');
  assert.match(registrations, /nativeExtensionRegistrations/);
  assert.match(registrations, /packageDigest: "sha256:/);
  assert.ok(registrations.startsWith("'use client';"));
  const stagedModule = await fs.readFile(path.join(candidate, 'web-src/core/native-extensions/packages/environment-summary/ui/index.tsx'), 'utf8');
  assert.ok(stagedModule.startsWith("'use client';"));
  assert.equal((await inspectPackage(example)).manifest.packageDigest, receipt.packages[0].manifest.packageDigest);
  await assert.rejects(stage(f.root, f.file, f.digest, candidate, [example]), /EEXIST/);
});
test('cannot stage inside protected source via a symlinked parent', async (t) => {
  const f = await fixture(t);
  const alias = path.join(f.temp, 'alias');
  await fs.symlink(f.root, alias);
  await assert.rejects(stage(f.root, f.file, f.digest, path.join(alias, 'candidate'), [example]), /outside/);
});
test('duplicate IDs reject before creating any candidate', async (t) => {
  const f = await fixture(t);
  const output = path.join(f.temp, 'candidate');
  await assert.rejects(stage(f.root, f.file, f.digest, output, [example, example]), /unique IDs/);
  await assert.rejects(fs.stat(output));
});
for (const mutation of ['protected-path', 'symlink', 'digest', 'entry-traversal', 'capability', 'self-grant', 'install-hook']) {
  test(`rejects package ${mutation}`, async (t) => {
    const f = await fixture(t);
    const source = path.join(f.temp, 'extension');
    await fs.cp(example, source, { recursive: true });
    const file = path.join(source, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(file));
    if (mutation === 'protected-path') {
      await fs.mkdir(path.join(source, 'web-src'));
      await fs.writeFile(path.join(source, 'web-src/proxy.ts'), 'evil');
    }
    if (mutation === 'symlink') await fs.symlink('/etc/passwd', path.join(source, 'ui/secret.ts'));
    if (mutation === 'digest') await fs.appendFile(path.join(source, 'ui/index.tsx'), '//tampered');
    if (mutation === 'entry-traversal') manifest.ui.entry = '../web-src/proxy.ts';
    if (mutation === 'capability') manifest.permissions.push({ capability: 'permissions.write', environmentIds: [] });
    if (mutation === 'self-grant') manifest.grants = manifest.permissions;
    if (mutation === 'install-hook') manifest.scripts = { postinstall: 'evil' };
    await fs.writeFile(file, json(manifest));
    await assert.rejects(inspectPackage(source));
  });
}
test('requires digest-pinned builder image before any execution', async () => {
  await assert.rejects(build('/nonexistent', 'node:latest'), /pinned/);
});
test('modified candidate refuses to invoke container build', async (t) => {
  const f = await fixture(t);
  const output = path.join(f.temp, 'candidate');
  const receipt = await stage(f.root, f.file, f.digest, output, [example]);
  await fs.writeFile(path.join(output, 'package.json'), 'tampered');
  await assert.rejects(build(output, `example/builder@sha256:${'a'.repeat(64)}`, sha(json(receipt))), /integrity mismatch/);
});

test('forged receipt and input inventory cannot replace trusted staging identity', async (t) => {
  const f = await fixture(t);
  const output = path.join(f.temp, 'candidate');
  const receipt = await stage(f.root, f.file, f.digest, output, [example]);
  const trustedDigest = sha(json(receipt));
  await fs.writeFile(path.join(output, 'package.json'), 'tampered');
  const forgedInputs = json(await baseline(output));
  await fs.writeFile(path.join(output, 'candidate-inputs.json'), forgedInputs);
  receipt.inputDigest = sha(forgedInputs);
  await fs.writeFile(path.join(output, 'candidate.json'), json(receipt));
  await assert.rejects(build(output, `example/builder@sha256:${'a'.repeat(64)}`, trustedDigest), /receipt trust digest/);
});

test('packs deterministic interoperable .vesselhq ZIP without machine metadata', async (t) => {
  const f = await fixture(t);
  const first = await pack(example, path.join(f.temp, 'reference.vesselhq'));
  const second = await pack(example, path.join(f.temp, 'again.vesselhq'));
  assert.equal(first.archiveDigest, second.archiveDigest);
  assert.equal(first.packageDigest, (await inspectPackage(example)).manifest.packageDigest);
  const verifyZip = spawnSync(
    'python3',
    [
      '-c',
      'import json,sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(json.dumps({"names":z.namelist(),"mode":z.getinfo("ui/index.tsx").external_attr>>16,"source":z.read("ui/index.tsx").decode()}))',
      first.path,
    ],
    { encoding: 'utf8' }
  );
  if (verifyZip.error?.code === 'ENOENT') {
    t.diagnostic('Python ZIP interoperability check unavailable');
    return;
  }
  assert.equal(verifyZip.status, 0, verifyZip.stderr);
  const contents = JSON.parse(verifyZip.stdout);
  assert.deepEqual(contents.names, ['manifest.json', 'ui/', 'ui/index.tsx']);
  assert.equal(contents.mode, 0o100644);
  assert.equal(contents.source, await fs.readFile(path.join(example, 'ui/index.tsx'), 'utf8'));
  await assert.rejects(pack(example, first.path), /EEXIST/);
  await assert.rejects(pack(example, path.join(f.temp, 'wrong.zip')), /vesselhq/);
});

async function backendPackage(t) {
  const f = await fixture(t);
  const source = path.join(f.temp, 'extension');
  await fs.cp(example, source, { recursive: true });
  const binary = Buffer.alloc(64);
  binary.writeUInt32BE(0x7f454c46, 0);
  binary[4] = 2;
  binary[5] = 1;
  binary.writeUInt16LE(2, 16);
  binary.writeUInt16LE(62, 18);
  const entry = 'backend/linux-amd64/extension';
  await fs.mkdir(path.join(source, 'backend/linux-amd64'), { recursive: true });
  await fs.writeFile(path.join(source, entry), binary, { mode: 0o644 });
  const manifest = JSON.parse(await fs.readFile(path.join(source, 'manifest.json')));
  manifest.backend = { type: 'executable', entrypoints: { 'linux-amd64': entry } };
  await fs.writeFile(path.join(source, 'manifest.json'), json(manifest));
  await assert.rejects(inspectPackage(source), (error) => {
    const digest = error.message.match(/calculated (sha256:[a-f0-9]{64})/);
    assert.ok(digest, error.message);
    manifest.packageDigest = digest[1];
    return true;
  });
  await fs.writeFile(path.join(source, 'manifest.json'), json(manifest));
  return { ...f, source, entry };
}

for (const capabilities of [['storage.service.read'], ['storage.service.write'], ['storage.service.read', 'storage.service.write']]) {
  test(`backend-only package accepts independent global machine grants: ${capabilities.join(', ')}`, async (t) => {
    const f = await backendPackage(t);
    const file = path.join(f.source, 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(file));
    delete manifest.ui;
    await fs.rm(path.join(f.source, 'ui'), { recursive: true });
    manifest.permissions = capabilities.map((capability) => ({ capability, environmentIds: [] }));
    await fs.writeFile(file, json(manifest));
    manifest.packageDigest = (await inspectPackage(f.source, { verifyDigest: false })).computedPackageDigest;
    await fs.writeFile(file, json(manifest));
    const inspected = await inspectPackage(f.source);
    assert.equal(inspected.manifest.ui, undefined);
    assert.deepEqual(inspected.manifest.permissions, manifest.permissions);
    const archive = await pack(f.source, path.join(f.temp, 'machine-notes.vesselhq'));
    assert.equal(archive.packageDigest, manifest.packageDigest);
  });
}

for (const capability of ['storage.service.read', 'storage.service.write']) {
  for (const scope of ['environment', 'stack']) {
    test(`rejects ${scope} scope on global ${capability}`, async (t) => {
      const f = await backendPackage(t);
      const file = path.join(f.source, 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(file));
      manifest.permissions.push({
        capability,
        environmentIds: scope === 'environment' ? [1] : [],
        ...(scope === 'stack' ? { stackIds: [1] } : {}),
      });
      await fs.writeFile(file, json(manifest));
      await assert.rejects(inspectPackage(f.source), scope === 'environment' ? /permission scopes/ : /Stack scopes only/);
    });
  }
}

test('backend role determines executable inventory consistently across filesystem modes', async (t) => {
  const f = await backendPackage(t);
  const first = await inspectPackage(f.source);
  assert.equal(first.entries[f.entry].executable, true);
  await fs.chmod(path.join(f.source, f.entry), 0o755);
  assert.equal((await inspectPackage(f.source)).manifest.packageDigest, first.manifest.packageDigest);
  const archive = await pack(f.source, path.join(f.temp, 'backend.vesselhq'));
  const verifyZip = spawnSync('python3', [
    '-c',
    'import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; assert z.getinfo("backend/linux-amd64/extension").external_attr>>16 == 0o100755',
    archive.path,
  ]);
  if (!verifyZip.error) assert.equal(verifyZip.status, 0);
});

test('frontend candidate never includes backend executables in browser packages', async (t) => {
  const f = await backendPackage(t);
  const receipt = await stage(f.root, f.file, f.digest, path.join(f.temp, 'candidate'), [f.source]);
  assert.equal(receipt.packages[0].runtimeStaged, false);
  assert.equal(receipt.packages[0].backendArtifacts[f.entry].executable, true);
  await assert.rejects(fs.stat(path.join(f.temp, 'candidate/web-src/core/native-extensions/packages/environment-summary/backend')));
});

test('backend rejects script payloads and mismatched ELF platforms', async (t) => {
  const f = await backendPackage(t);
  await fs.writeFile(path.join(f.source, f.entry), '#!/bin/sh\necho nope\n');
  await assert.rejects(inspectPackage(f.source), /ELF64/);
});

test('staging normalizes only Next-generated dev type imports without changing the source', async (t) => {
  const f = await fixture(t);
  const declarations = '/// <reference types="next" />\nimport "./.next/dev/types/routes.d.ts";\nimport "./.next/dev/types/root-params.d.ts";\n// protected\n';
  await fs.writeFile(path.join(f.root, 'web-src/next-env.d.ts'), declarations);
  const input = json(await baseline(f.root));
  await fs.writeFile(f.file, input);
  const candidate = path.join(f.temp, 'candidate');
  await stage(f.root, f.file, sha(input), candidate, [example]);
  assert.equal(await fs.readFile(path.join(f.root, 'web-src/next-env.d.ts'), 'utf8'), declarations);
  assert.equal(await fs.readFile(path.join(candidate, 'web-src/next-env.d.ts'), 'utf8'), declarations.replaceAll('import "./.next/dev/types/', 'import "./.next/types/'));
});

test('translation inputs are protected and copied into isolated candidates', async (t) => {
  const f = await fixture(t);
  await fs.mkdir(path.join(f.root, 'translations/en'), { recursive: true });
  const translations = path.join(f.root, 'translations/en/translation.json');
  await fs.writeFile(translations, '{"label":"reviewed"}\n');
  const bytes = json(await baseline(f.root));
  await fs.writeFile(f.file, bytes);
  const candidate = path.join(f.temp, 'candidate');
  await stage(f.root, f.file, sha(bytes), candidate, [example]);
  assert.equal(await fs.readFile(path.join(candidate, 'translations/en/translation.json'), 'utf8'), '{"label":"reviewed"}\n');
  await fs.writeFile(translations, '{"label":"changed"}\n');
  await assert.rejects(verify(f.root, f.file, sha(bytes)), /integrity mismatch/);
});
