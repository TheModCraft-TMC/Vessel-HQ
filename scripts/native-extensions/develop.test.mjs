import assert from 'node:assert/strict';
import { test } from 'node:test';

import { approvedRecord, developmentPipeline } from './develop.mjs';

const expected = { extensionId: 'stack-network-overview', packageDigest: `sha256:${'a'.repeat(64)}`, archiveDigest: `sha256:${'b'.repeat(64)}` };
const approved = () => ({
  manifest: { id: expected.extensionId, packageDigest: expected.packageDigest },
  revision: 3,
  status: 'approved',
  archiveDigest: expected.archiveDigest,
  packageAvailable: true,
  trustedNativeUI: true,
  grants: [{ capability: 'ui.native', environmentIds: [] }],
});

test('development controller requires exact uploaded approved package and UI trust', () => {
  assert.equal(approvedRecord([approved()], expected).revision, 3);
});
for (const [name, mutate] of Object.entries({
  'package update': (record) => {
    record.manifest.packageDigest = `sha256:${'c'.repeat(64)}`;
  },
  'archive substitution': (record) => {
    record.archiveDigest = `sha256:${'c'.repeat(64)}`;
  },
  'disabled extension': (record) => {
    record.status = 'disabled';
  },
  'unapproved native trust': (record) => {
    record.trustedNativeUI = false;
  },
  'revoked native grant': (record) => {
    record.grants = [];
  },
  'manifest-only record': (record) => {
    record.packageAvailable = false;
  },
  'missing revision': (record) => {
    record.revision = 0;
  },
})) {
  test(`development controller rejects ${name}`, () => {
    const record = approved();
    mutate(record);
    assert.throws(() => approvedRecord([record], expected));
  });
}
test('development controller refuses implicit use and non-loopback backends', async () => {
  await assert.rejects(developmentPipeline({}), /Explicit --development/);
  await assert.rejects(developmentPipeline({ development: true, api: 'https://production.example' }), /loopback/);
});

test('development package sets reject incomplete, duplicate or substituted descriptors', async () => {
  const { packageSet } = await import('./develop.mjs');
  const item = { ...expected, archive: '/tmp/overview.vesselhq' };
  assert.deepEqual(packageSet({ packages: [item] }), [item]);
  assert.deepEqual(packageSet(item), [item]);
  for (const packages of [[], [item, item], [{ ...item, archiveDigest: 'untrusted' }], [{ ...item, extensionId: '../escape' }], [{ ...item, archive: undefined }]])
    assert.throws(() => packageSet({ packages }));
});
