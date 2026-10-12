import path from 'node:path';
import { createRequire } from 'node:module';

import { defineConfig } from 'vitest/config';
import svgr from 'vite-plugin-svgr';

const require = createRequire(import.meta.url);
const { transformSync } = require('@babel/core');

export default defineConfig({
  resolve: {
    alias: {
      'file-saver': path.resolve(
        import.meta.dirname,
        'web-src/core/test-support/setup/mock-file-saver.ts'
      ),
      toastr: path.resolve(
        import.meta.dirname,
        'web-src/core/test-support/setup/mock-toastr.ts'
      ),
      '@uiw/react-codemirror': path.resolve(
        import.meta.dirname,
        'web-src/core/test-support/setup/mock-codemirror.tsx'
      ),
      'next/navigation': path.resolve(
        import.meta.dirname,
        'web-src/core/test-support/next-navigation.ts'
      ),
      '@': path.resolve(import.meta.dirname, 'web-src'),
      '@api': path.resolve(
        import.meta.dirname,
        'web-src/core/generated-api/portainer'
      ),
      '@console': path.resolve(import.meta.dirname, 'web-src/core/console'),
      '@app': path.resolve(import.meta.dirname, 'web-src/app'),
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
      './web-src/core/test-support/setup/setup.ts',
      './web-src/core/test-support/setup/setup-websocket.ts',
      './web-src/core/test-support/setup/setup-rtl.ts',
      './web-src/core/test-support/setup/setup-msw.ts',
      './web-src/core/test-support/setup/stub-modules.ts',
      './web-src/core/test-support/setup/setup-codemirror.ts',
      './web-src/core/test-support/setup/setup-fail-on-console.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'web-src/core/test-support/setup/global-setup.js'],
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
  plugins: [
    svgr({ include: /\?c$/ }),
    {
      name: 'compile-table-components',
      enforce: 'pre',
      transform(code, id) {
        // Match production's compiler for the mutable TanStack Table boundary.
        if (!id.includes('/ui/components/data-table/') || !id.endsWith('.tsx') || id.includes('.test.')) {
          return null;
        }
        return transformSync(code, {
          filename: id,
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ['typescript', 'jsx'] },
          plugins: ['babel-plugin-react-compiler'],
          sourceMaps: true,
        });
      },
    },
  ],
});
