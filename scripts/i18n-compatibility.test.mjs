import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { transformSync } from '@babel/core';
import i18next from 'i18next';
import extract from 'babel-plugin-i18next-extract';

test('patched runtime preserves English plurals and interpolation', async () => {
  const instance = i18next.createInstance();
  await instance.init({
    lng: 'en',
    fallbackLng: 'en',
    initAsync: false,
    resources: { en: { translation: { greeting: 'Hello {{name}}', item_one: '{{count}} item', item_other: '{{count}} items' } } },
    interpolation: { escapeValue: false },
  });
  assert.equal(instance.t('greeting', { name: 'Vessel' }), 'Hello Vessel');
  assert.equal(instance.t('item', { count: 1 }), '1 item');
  assert.equal(instance.t('item', { count: 2 }), '2 items');
});

test('translation extractor works with the patched runtime and modern plural keys', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'vessel-i18n-compat-'));
  try {
    transformSync("import i18next from 'i18next'; i18next.t('item', { count: 2, defaultValue: '{{count}} items' });", {
      filename: 'fixture.js',
      configFile: false,
      babelrc: false,
      plugins: [
        [
          extract,
          {
            locales: ['en'],
            compatibilityJSON: 'v4',
            useI18nextDefaultValue: true,
            useI18nextDefaultValueForDerivedKeys: true,
            outputPath: path.join(temporary, '{{locale}}', '{{ns}}.json'),
          },
        ],
      ],
    });
    const catalog = JSON.parse(await readFile(path.join(temporary, 'en', 'translation.json'), 'utf8'));
    assert.equal(catalog.item_one, '{{count}} items');
    assert.equal(catalog.item_other, '{{count}} items');
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
