import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { validateSources } from './source-policy.mjs';

async function check(t, source, extra = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'vessel-client-policy-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const files = { 'ui/index.tsx': source, ...extra };
  for (const [name, content] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), content);
  }
  return validateSources(root, Object.fromEntries(Object.keys(files).map((name) => [name, { type: 'file' }])));
}

test('allows native client components and confined helper/CSS imports', async (t) => {
  await check(
    t,
    "import { useState } from 'react'; import { Check } from 'lucide-react'; import { Button } from '@/ui/Button'; import './style.css'; export { label } from './helper'; export default function Example() { return <Button><Check /></Button>; }",
    { 'ui/helper.ts': "export const label = 'ok';", 'ui/style.css': '.example { color: blue; }' }
  );
});

for (const [name, source] of Object.entries({
  'top-level server directive': "'use server'; export async function action() {}",
  'escaped server directive': "'use\\u0020server'; export async function action() {}",
  'nested server directive': "export default function Example() { async function action() { 'use server'; } return null; }",
  'nested escaped server directive': "export default async function action() { 'use\\x20server'; }",
  'server-only import': "import 'server-only';",
  'Next headers import': "import { cookies } from 'next/headers';",
  'Node builtin import': "import fs from 'node:fs';",
  'bare Node builtin': "import fs from 'fs';",
  'unknown dependency': "import axios from 'axios';",
  'relative breakout': "import '../../../../app/permissions/page';",
  'dynamic relative breakout': "import('../outside');",
  'variable dynamic import': 'const moduleName = "./helper"; import(moduleName);',
  'template dynamic import': 'import(`./helper`);',
  'CommonJS import': 'import fs = require("fs");',
  'require alias': 'const load = require; load("fs");',
  'eval alias': 'const execute = eval; execute("code");',
  'Function constructor': 'new Function("return process")();',
  'global eval property': 'globalThis.eval("code");',
  'global Function lookup': 'globalThis["Function"]("code")();',
  'server re-export': 'export { headers } from "next/headers";',
  'Node import type': 'type Node = import("node:fs");',
  'import metadata': 'const metadata = import.meta;',
})) {
  test(`rejects ${name}`, async (t) => {
    await assert.rejects(check(t, source));
  });
}

test('checks helper modules rather than only the entrypoint', async (t) => {
  await assert.rejects(check(t, 'export { default } from "./helper";', { 'ui/helper.ts': "'use server'; export default async function action() {}" }), /Server directives/);
});
