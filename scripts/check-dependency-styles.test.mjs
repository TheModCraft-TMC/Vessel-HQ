import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';

const vendor = 'web-src/shared/assets/vendor/bootstrap-3';
const hashes = {
  'bootstrap.css': '2934ed9b2c64501de4c7c552ed59f6262875952699cba90408b097989d7d97bc',
  'fonts/glyphicons-halflings-regular.eot': '13634da87d9e23f8c3ed9108ce1724d183a39ad072e73e1b3d8cbf646d2d0407',
  'fonts/glyphicons-halflings-regular.svg': '42f60659d265c1a3c30f9fa42abcbb56bd4a53af4d83d316d6dd7a36903c43e5',
  'fonts/glyphicons-halflings-regular.ttf': 'e395044093757d82afcb138957d06a1ea9361bdcf0b442d06a18a8051af57456',
  'fonts/glyphicons-halflings-regular.woff': 'a26394f7ede100ca118eff2eda08596275a9839b959c226e15439557a5a80742',
  'fonts/glyphicons-halflings-regular.woff2': 'fe185d11a49676890d47bb783312a0cda5a44c4039214094e7957b4c040ef11c',
};

test('Bootstrap retention contains only reviewed CSS/fonts/license, never its vulnerable JS', () => {
  const files = fs.readdirSync(vendor, { recursive: true }).filter((file) => fs.statSync(path.join(vendor, file)).isFile());
  assert.deepEqual(files.sort(), [...Object.keys(hashes), 'LICENSE', 'README.md'].sort());
  for (const [file, hash] of Object.entries(hashes)) {
    assert.equal(
      crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(vendor, file)))
        .digest('hex'),
      hash,
      file
    );
  }
  assert.match(fs.readFileSync(`${vendor}/LICENSE`, 'utf8'), /Copyright \(c\) 2011-2019 Twitter, Inc\./);
  const css = fs.readFileSync(`${vendor}/bootstrap.css`, 'utf8');
  assert.doesNotMatch(css, /expression\s*\(|-moz-binding|behavior\s*:|@import/i);
  const font = fs.readFileSync(`${vendor}/fonts/glyphicons-halflings-regular.svg`, 'utf8');
  assert.doesNotMatch(font, /<script|onload\s*=|(?:xlink:)?href\s*=/i);
  for (const [, url] of css.matchAll(/url\("([^"#?]+)[^"\)]*"\)/g)) {
    assert.ok(fs.existsSync(path.join(vendor, url)), url);
  }
});

test('Tailwind does not reintroduce preflight or put utilities below Bootstrap in the cascade', async () => {
  const file = path.resolve('web-src/shared/assets/css/tailwind.css');
  const result = await postcss([tailwind()]).process(fs.readFileSync(file, 'utf8'), { from: file });
  let utility;
  result.root.walkRules('.p-4', (rule) => {
    utility = rule;
  });
  assert.ok(utility, 'scanner must discover current frontend classes');
  assert.equal(utility.parent.type, 'root', 'utilities must remain unlayered, like v3');
  assert.doesNotMatch(result.css, /button,\s*input,\s*optgroup/);
  assert.doesNotMatch(result.css, /h1,\s*h2,\s*h3/);
  assert.match(result.css, /--spacing: 0\.25rem/);
  assert.match(result.css, /--radius-sm: 0\.25rem/);
  assert.match(result.css, /\[theme=["']dark["']\]/);
  assert.match(result.css, /\[theme=["']highcontrast["']\]/);
});

test('collapse controls preserve translucent hover colors across editions and dark theme', async () => {
  // v4 silently ignores bg-opacity-10; compiling successfully is not
  // sufficient unless the replacement color utilities actually retain alpha.
  const file = path.resolve('web-src/shared/assets/css/tailwind.css');
  const result = await postcss([tailwind()]).process(fs.readFileSync(file, 'utf8'), { from: file });
  for (const candidate of ['group-hover\\:bg-blue-5\\/10', 'group-hover\\:be\\:bg-gray-5\\/10', 'th-dark\\:group-hover\\:bg-gray-true-7\\/10']) {
    let background;
    result.root.walkRules((rule) => {
      if (rule.selector.startsWith(`.${candidate}:`)) {
        rule.walkDecls('background-color', (declaration) => {
          background = declaration.value;
        });
      }
    });
    assert.match(background || '', /10%, transparent\)/, candidate);
  }
});

test('previously width-only borders do not acquire a new solid border style', async () => {
  for (const component of ['web-src/domains/users/RolesView/RoleEditor.tsx', 'web-src/core/console/navigation/Sidebar/Footer/UpdateNotification.tsx']) {
    assert.match(fs.readFileSync(component, 'utf8'), /\[border-width:1px\]/, component);
  }
  const file = path.resolve('web-src/shared/assets/css/tailwind.css');
  const result = await postcss([tailwind()]).process(fs.readFileSync(file, 'utf8'), { from: file });
  let declarations;
  result.root.walkRules('.\\[border-width\\:1px\\]', (rule) => {
    declarations = rule.nodes.filter((node) => node.type === 'decl').map(({ prop, value }) => [prop, value]);
  });
  assert.deepEqual(declarations, [['border-width', '1px']]);
});

test('every stylesheet using @apply still compiles with its own explicit v4 reference', async () => {
  const files = fs.globSync('web-src/**/*.css').filter((file) => fs.readFileSync(file, 'utf8').includes('@apply'));
  assert.ok(files.length >= 19);
  for (const file of files) {
    const result = await postcss([tailwind()]).process(fs.readFileSync(file, 'utf8'), { from: path.resolve(file) });
    assert.doesNotMatch(result.css, /@apply|@reference/, file);
  }
});
