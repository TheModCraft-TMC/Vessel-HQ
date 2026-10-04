import path from 'node:path';

import { defineConfig } from 'vitest/config';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'web-src/legacy'),
      '@@': path.resolve(
        import.meta.dirname,
        'web-src/legacy/react/components'
      ),
      '@api': path.resolve(
        import.meta.dirname,
        'web-src/legacy/react/portainer/generated-api/portainer'
      ),
      '@console': path.resolve(import.meta.dirname, 'web-src/components'),
      'yaml-schema': path.resolve(
        import.meta.dirname,
        'node_modules/codemirror-json-schema/dist/yaml'
      ),
    },
  },
  build: {
    // force tests to import svg as url
    // TODO consider removing when moving from webpack
    assetsInlineLimit: 0,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './web-src/legacy/setup-tests/setup.ts',
      './web-src/legacy/setup-tests/setup-websocket.ts',
      './web-src/legacy/setup-tests/setup-rtl.ts',
      './web-src/legacy/setup-tests/setup-msw.ts',
      './web-src/legacy/setup-tests/stub-modules.ts',
      './web-src/legacy/setup-tests/setup-codemirror.ts',
      './web-src/legacy/setup-tests/setup-fail-on-console.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'web-src/legacy/setup-tests/global-setup.js'],
    },
    // The default includes package.json, which made `--changed` run the whole suite for
    // any edit to it. Dependency changes move pnpm-lock.yaml, so key off that instead.
    forceRerunTriggers: ['**/pnpm-lock.yaml', '**/{vitest,vite}.config.*'],
    bail: 2,
    include: ['./web-src/**/*.test.ts', './web-src/**/*.test.tsx', './web-src/**/*.test.js'],
    env: {
      PORTAINER_EDITION: 'CE',
    },
    server: {
      deps: {
        inline: [/@radix-ui/, /codemirror-json-schema/], // https://github.com/radix-ui/primitives/issues/2974#issuecomment-2186808459
      },
    },
    onConsoleLog(log) {
      return !/Can't perform a React state update on an unmounted component/.test(log);
    },
  },
  plugins: [svgr({ include: /\?c$/ })],
});
