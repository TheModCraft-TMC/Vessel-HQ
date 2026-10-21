// Runs the CSS Module class guard against small fixture trees. Vitest returns
// a proxy for CSS Modules, so the guard's own behavior is tested here.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function check(source, css = '.root {}', extraFiles = {}) {
  const root = mkdtempSync(join(tmpdir(), 'vessel-css-guard-'));
  try {
    mkdirSync(join(root, 'scripts'));
    mkdirSync(join(root, 'web-src/core/console'), { recursive: true });
    symlinkSync(join(repoRoot, 'node_modules'), join(root, 'node_modules'), 'junction');
    copyFileSync(join(repoRoot, 'scripts/check-css-module-classes.mjs'), join(root, 'scripts/check-css-module-classes.mjs'));
    copyFileSync(join(repoRoot, 'web-src/tsconfig.json'), join(root, 'web-src/tsconfig.json'));
    writeFileSync(join(root, 'web-src/Test.tsx'), source);
    writeFileSync(join(root, 'web-src/core/console/Test.module.css'), css);
    for (const [path, content] of Object.entries(extraFiles)) {
      const file = join(root, 'web-src', path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content);
    }
    return spawnSync(process.execPath, [join(root, 'scripts/check-css-module-classes.mjs')], { encoding: 'utf8' });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('resolves relative, root, console and app aliases from tsconfig', () => {
  for (const specifier of ['./core/console/Test.module.css', '@/core/console/Test.module.css', '@console/Test.module.css', '@app/Test.module.css']) {
    const result = check(`import styles from '${specifier}'; console.log(styles.root);`, '.root {}', { 'app/Test.module.css': '.root {}' });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /1 imports checked/);
  }
});

test('checks dot, bracket, and template-literal reads including optional chains', () => {
  for (const access of ['styles.missing', "styles['missing']", 'styles[`missing`]', 'styles?.missing', "styles?.['missing']"]) {
    const result = check(`import styles from '@console/Test.module.css'; console.log(${access});`);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Test.tsx:1 reads styles.missing/);
  }
});

test('checks namespace imports', () => {
  const result = check("import * as styles from '@console/Test.module.css'; console.log(styles.missing);");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Test.tsx:1 reads styles.missing/);
});

test('reports imports that do not resolve instead of crashing', () => {
  for (const specifier of ['./Missing.module.css', '@console/Missing.module.css']) {
    const result = check(`import styles from '${specifier}'; console.log(styles.root);`);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /does not resolve to a file/);
  }
});

test('does not mistake shadowed local variables for the imported CSS object', () => {
  const result = check("import styles from '@console/Test.module.css'; function read(styles) { return styles.other; } console.log(styles.root);");
  assert.equal(result.status, 0, result.stderr);
});

test('does not count comments, global selectors, strings or declaration values as local classes', () => {
  const result = check(
    "import styles from '@console/Test.module.css'; console.log(styles.missing);",
    '/* .missing */ .root :global(.missing) { --example: .missing; content: ".missing"; }'
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /has no .missing class/);
});

test('ignores generated Next.js output', () => {
  const result = check("import styles from '@console/Test.module.css'; console.log(styles.root);", '.root {}', {
    '.next/bundle.js': "import styles from './nonexistent.module.css'; console.log(styles.missing);",
  });
  assert.equal(result.status, 0, result.stderr);
});
