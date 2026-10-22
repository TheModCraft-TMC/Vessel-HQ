import fs from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import YAML from 'yaml';
import { findVulnerableVersions } from './check-npm-security.mjs';

const alerts = JSON.parse(fs.readFileSync('docs/security/dependency-npm-alerts.json', 'utf8'));

test('records every one of the 61 supplied alerts, with distinct ids and valid ranges', () => {
  assert.equal(alerts.length, 61);
  assert.equal(new Set(alerts.map((alert) => alert.number)).size, 61);
  for (const alert of alerts) {
    assert.match(alert.ghsa, /^GHSA-(?:[a-z0-9]{4}-){2}[a-z0-9]{4}$/);
    // Every original vulnerable version must fail, even NO_PATCH entries.
    assert.equal(findVulnerableVersions({ packages: { [`${alert.package}@${alert.previousVersion}`]: {} } }, [alert]).length, 1);
  }
});

test('rejects all NO_PATCH packages instead of treating null patches as clean', () => {
  for (const alert of alerts.filter((item) => item.firstPatchedVersion === null)) {
    assert.ok(['bootstrap', 'braces', 'sprintf-js'].includes(alert.package));
    assert.equal(findVulnerableVersions({ packages: { [`${alert.package}@${alert.previousVersion}`]: {} } }, alerts).length > 0, true);
  }
});

test('checks every resolved version, not merely the first or the direct importer', () => {
  const alert = alerts.find((item) => item.package === 'markdown-it');
  assert.equal(findVulnerableVersions({ packages: { 'markdown-it@14.3.3': {}, 'markdown-it@12.3.2': {} } }, [alert]).length, 1);
});

test('invalid advisory ranges fail closed instead of silently reporting clean', () => {
  assert.throws(
    () => findVulnerableVersions({ packages: {} }, [{ package: 'fixture', vulnerableRange: 'not a range' }]),
    /Invalid advisory range/
  );
});

test('affected prereleases are not silently exempted from advisory ranges', () => {
  const alert = { package: '@fixture/package', vulnerableRange: '< 2.0.0' };
  const lockfile = { packages: { '@fixture/package@1.9.0-beta.1': {}, '@fixture/package@2.0.0': {} } };
  assert.deepEqual(findVulnerableVersions(lockfile, [alert]).map(({ version }) => version), ['1.9.0-beta.1']);
});

test('invalid versions of a covered package fail closed', () => {
  assert.throws(
    () => findVulnerableVersions({ packages: { 'fixture@not-a-version': {} } }, [{ package: 'fixture', vulnerableRange: '*' }]),
    /Invalid locked version/
  );
});

test('missing or malformed package inventories fail closed', () => {
  for (const lockfile of [null, {}, { packages: null }, { packages: [] }, { packages: 'invalid' }]) {
    assert.throws(() => findVulnerableVersions(lockfile, alerts), /Invalid lockfile package inventory/);
  }
});

test('the maintained lockfile has no affected version for any supplied alert', () => {
  assert.deepEqual(findVulnerableVersions(YAML.parse(fs.readFileSync('pnpm-lock.yaml', 'utf8')), alerts), []);
});
