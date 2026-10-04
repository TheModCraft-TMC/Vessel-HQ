module.exports = {
  plugins: ['lodash'],
  presets: [
    '@babel/preset-typescript',
    [
      '@babel/preset-react',
      {
        runtime: 'automatic',
      },
    ],
    [
      '@babel/preset-env',
      {
        useBuiltIns: 'usage',
        corejs: '3',
        targets: { node: 'current' },
        modules: 'auto',
      },
    ],
  ],
};
