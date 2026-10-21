import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./check-app-router-compliance.mjs', import.meta.url));

function inspect(t, layout, pages = ['page.tsx']) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vessel-compliance-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const app = path.join(root, 'web-src/app');
  fs.mkdirSync(app, { recursive: true });
  fs.writeFileSync(path.join(app, 'layout.tsx'), layout);
  for (const page of pages) {
    fs.mkdirSync(path.dirname(path.join(app, page)), { recursive: true });
    fs.writeFileSync(path.join(app, page), 'export default function Page() { return null; }');
  }
  const result = spawnSync(process.execPath, [script], { cwd: root, encoding: 'utf8', timeout: 10000 });
  assert.ifError(result.error);
  const report = JSON.parse(fs.readFileSync(path.join(root, 'reports/sonar/app-router-compliance.json'), 'utf8'));
  assert.equal(result.status, report.issues.length ? 1 : 0, result.stderr);
  return report.issues;
}

for (const name of ['PageHeader', 'EnvironmentHeader']) {
  test(`flags a single-page ${name} layout`, (t) => {
    const issues = inspect(t, `export default function Layout() { return <${name} />; }`);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].ruleId, 'APPROUTER003');
  });
}

test('allows a shared header layout with multiple descendant pages', (t) => {
  assert.deepEqual(inspect(t, 'export default function Layout() { return <PageHeader />; }', ['page.tsx', 'nested/page.tsx']), []);
});

test('does not treat comments, strings, or unrelated identifiers as headers', (t) => {
  assert.deepEqual(inspect(t, `// PageHeader\nconst label = 'EnvironmentHeader';\nexport default function Layout() { return <Header title={label} />; }`), []);
});

test('handles a long non-header identifier without regex backtracking', (t) => {
  assert.deepEqual(inspect(t, `const ${'a'.repeat(100000)} = 1;\nexport default function Layout() { return null; }`), []);
});
