import { defineConfig, mergeConfig } from 'vitest/config';

import frontendConfig from './vitest.config.mts';

const config = mergeConfig(frontendConfig, {});
export default defineConfig({
  ...config,
  test: {
    ...config.test,
    include: ['examples/native-extensions/*/ui/*.test.ts', 'examples/native-extensions/*/ui/*.test.tsx'],
  },
});
