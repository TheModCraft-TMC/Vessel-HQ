import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { validateOpenApi } from './validate-openapi.mjs';

test('validator supports OpenAPI YAML and local references used by API generation', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vessel-openapi-'));
  try {
    fs.writeFileSync(path.join(directory, 'schema.yaml'), 'type: object\nproperties:\n  id:\n    type: integer\n');
    const file = path.join(directory, 'api.yaml');
    fs.writeFileSync(file, `openapi: 3.0.3\ninfo:\n  title: Fixture\n  version: 1.0.0\npaths: {}\ncomponents:\n  schemas:\n    Item:\n      $ref: ./schema.yaml\n`);
    const document = await validateOpenApi(file);
    assert.equal(document.components.schemas.Item.properties.id.type, 'integer');
    const command = spawnSync(process.execPath, ['scripts/validate-openapi.mjs', 'validate', file], { encoding: 'utf8' });
    assert.equal(command.status, 0, command.stderr);
    assert.match(command.stdout, /is valid/);
    fs.writeFileSync(file, 'openapi: 3.0.3\npaths: {}\n');
    const invalid = spawnSync(process.execPath, ['scripts/validate-openapi.mjs', 'validate', file], { encoding: 'utf8' });
    assert.equal(invalid.status, 1);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('validator refuses unsupported commands rather than silently skipping validation', () => {
  const command = spawnSync(process.execPath, ['scripts/validate-openapi.mjs', 'bundle', 'unused'], { encoding: 'utf8' });
  assert.equal(command.status, 1);
  assert.match(command.stderr, /Usage:/);
});
