import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import semver from 'semver';
import YAML from 'yaml';

export function findVulnerableVersions(lockfile, alerts) {
  const packages = Object.keys(lockfile.packages || {}).map((key) => {
    const separator = key.lastIndexOf('@');
    return { name: key.slice(0, separator), version: key.slice(separator + 1) };
  });
  return alerts.flatMap((alert) => {
    // GitHub separates comparator intersections with commas; node-semver uses spaces.
    const range = alert.vulnerableRange.replaceAll(',', ' ');
    if (!semver.validRange(range)) throw new Error(`Invalid advisory range: ${alert.vulnerableRange}`);
    return packages
      .filter(({ name, version }) => name === alert.package && semver.satisfies(version, range))
      .map(({ version }) => ({ number: alert.number, ghsa: alert.ghsa, package: alert.package, version }));
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const lockfile = YAML.parse(fs.readFileSync('pnpm-lock.yaml', 'utf8'));
  const alerts = JSON.parse(fs.readFileSync('docs/security/dependency-npm-alerts.json', 'utf8'));
  const failures = findVulnerableVersions(lockfile, alerts);
  if (failures.length) {
    for (const failure of failures) console.error(failure);
    process.exitCode = 1;
  } else {
    console.log(`All ${alerts.length} recorded npm alert ranges eliminated (${Object.keys(lockfile.packages).length} package versions checked).`);
    console.log('This offline regression check supplements, not replaces, pnpm audit and fresh GitHub advisory data.');
  }
}
