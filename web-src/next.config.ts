import path from 'node:path';

import type { NextConfig } from 'next';

const apiOrigin = process.env.PORTAINER_API_ORIGIN || 'http://localhost:9000';

const nextConfig = {
  output: 'standalone',
  env: {
    DEV_AUTO_LOGIN: process.env.DEV_AUTO_LOGIN || '',
  },
  poweredByHeader: false,
  reactCompiler: true,
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(process.cwd()),
    resolveAlias: {
      'yaml-schema': 'codemirror-json-schema/yaml',
    },
    rules: {
      '*.svg': [
        {
          condition: { query: /c/ },
          loaders: [{ loader: '@svgr/webpack', options: { icon: true } }],
          as: '*.js',
        },
        {
          condition: { not: { query: /c/ } },
          type: 'asset',
        },
      ],
    },
  },
  webpack(nextWebpackConfig) {
    const config = nextWebpackConfig;
    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: { test?: (value: string) => boolean } }) =>
        rule.test?.test?.('.svg')
    );

    if (fileLoaderRule) {
      config.module.rules.push(
        {
          ...fileLoaderRule,
          test: /\.svg$/i,
          resourceQuery: { not: [/c/] },
        },
        {
          test: /\.svg$/i,
          resourceQuery: /c/,
          use: [{ loader: '@svgr/webpack', options: { icon: true } }],
        }
      );
      fileLoaderRule.exclude = /\.svg$/i;
    }

    config.resolve.alias['yaml-schema'] = path.resolve(
      process.cwd(),
      'node_modules/codemirror-json-schema/dist/yaml'
    );
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/legacy/:path*',
        destination: `${apiOrigin}/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
} satisfies NextConfig;

export default nextConfig;
