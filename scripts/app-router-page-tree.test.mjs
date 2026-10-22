import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { renderPageTree } from './app-router-page-tree.mjs';

test('renders sorted pages and ancestors, pruning empty routes and symlinks', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vessel-page-tree-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const name of ['page.tsx', '(console)/[id]/page.tsx', '(console)/settings/page.tsx', 'empty/layout.tsx', 'api/route.ts']) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, '');
  }
  fs.symlinkSync(root, path.join(root, 'cycle'), 'dir');
  fs.symlinkSync(path.join(root, 'page.tsx'), path.join(root, 'api/page.tsx'));
  assert.equal(
    renderPageTree(root),
    ['web-src/app', '├── (console)', '│   ├── [id]', '│   │   └── page.tsx', '│   └── settings', '│       └── page.tsx', '└── page.tsx'].join('\n')
  );
});

test('renders an empty app without an external tree utility', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vessel-page-tree-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(renderPageTree(root, 'app'), 'app');
});
