import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const require = createRequire(import.meta.url);
const eslintRequire = createRequire(require.resolve('@eslint/eslintrc'));
const matcher = eslintRequire('minimatch');

test('maintained minimatch supports legacy callable and modern named/ESM APIs', async () => {
  assert.equal(typeof matcher, 'function');
  assert.equal(matcher.minimatch, matcher);
  assert.equal(matcher('src/a.ts', '**/*.{ts,tsx}'), true);
  assert.equal(matcher('src/a.js', '**/*.{ts,tsx}'), false);
  assert.equal(matcher('.hidden', '*'), false);
  assert.equal(matcher.defaults({ dot: true })('.hidden', '*'), true);
  assert.deepEqual(matcher.match(['a.ts', 'b.js'], '*.ts'), ['a.ts']);
  assert.equal(new matcher.Minimatch('**/*.ts').match('src/a.ts'), true);
  const commonjs = eslintRequire.resolve('minimatch');
  const esm = await import(pathToFileURL(commonjs.replace('/commonjs/', '/esm/')).href);
  assert.equal(esm.minimatch('a.ts', '*.ts'), true);
});

test('legacy glob callback/sync and modern async glob traverse the same fixtures', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vessel-glob-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, 'nested'));
  for (const file of ['a.ts', 'b.js', '.hidden.ts', 'nested/c.ts']) fs.writeFileSync(path.join(directory, file), '');
  const coverageRequire = createRequire(require.resolve('c8'));
  const excludeRequire = createRequire(coverageRequire.resolve('test-exclude'));
  const legacyGlob = excludeRequire('glob');
  // Storybook's plugin is ESM-only; locate its package through pnpm's linked
  // transitive inventory without evaluating the plugin itself.
  const docgenRequire = createRequire(fs.realpathSync(path.join('node_modules/.pnpm/node_modules/@joshwooding/vite-plugin-react-docgen-typescript/package.json')));
  const modernGlob = docgenRequire('glob');
  const expected = ['a.ts', 'nested/c.ts'];
  assert.deepEqual(legacyGlob.sync('**/*.ts', { cwd: directory }).sort(), expected);
  assert.deepEqual(
    (await new Promise((resolve, reject) => legacyGlob('**/*.ts', { cwd: directory }, (error, files) => (error ? reject(error) : resolve(files))))).sort(),
    expected
  );
  assert.deepEqual((await modernGlob.glob('**/*.ts', { cwd: directory })).sort(), expected);
  const signal = AbortSignal.abort();
  await assert.rejects(modernGlob.glob('**/*', { cwd: directory, signal }), { name: 'AbortError' });
});
