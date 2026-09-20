const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common.js');

module.exports = merge(commonConfig, {
  mode: 'production',
  devtool: false,
  // Keep the existing dashboard payload from growing while route-level lazy
  // loading is rolled out. These limits apply to uncompressed assets.
  performance: {
    maxAssetSize: 3 * 1024 * 1024,
    maxEntrypointSize: 6 * 1024 * 1024,
  },
  module: {
    rules: [
      {
        test: /\.(woff|woff2|eot|ttf|ico)$/,
        type: 'asset/inline',
      },
    ],
  },
});
