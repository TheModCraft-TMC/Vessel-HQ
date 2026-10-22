import path from 'node:path';
import type { StorybookConfig } from '@storybook/nextjs-vite';
import svgr from 'vite-plugin-svgr';

const config: StorybookConfig = {
  stories: ['../web-src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {
      nextConfigPath: path.resolve(
        import.meta.dirname,
        '../web-src/next.config.ts'
      ),
      // SVG imports are URLs or explicit ?c React components, not next/image DTOs.
      image: { excludeFiles: ['**/*.svg'] },
    },
  },
  staticDirs: ['./public', '../web-src/public'],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      tsconfigPath: path.resolve(
        import.meta.dirname,
        '../web-src/tsconfig.json'
      ),
    },
  },
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      plugins: [svgr({ include: /\?c$/ })],
      resolve: {
        alias: {
          '@': path.resolve(import.meta.dirname, '../web-src'),
          '@console': path.resolve(
            import.meta.dirname,
            '../web-src/core/console'
          ),
          '@app': path.resolve(import.meta.dirname, '../web-src/app'),
          '@api': path.resolve(
            import.meta.dirname,
            '../web-src/core/generated-api/portainer'
          ),
          'yaml-schema': path.resolve(
            import.meta.dirname,
            '../node_modules/codemirror-json-schema/dist/yaml'
          ),
        },
      },
      css: {
        postcss: path.resolve(import.meta.dirname, '../web-src'),
        modules: { localsConvention: 'camelCaseOnly' },
      },
      define: { 'process.env.PORTAINER_EDITION': JSON.stringify('CE') },
    });
  },
};

export default config;
