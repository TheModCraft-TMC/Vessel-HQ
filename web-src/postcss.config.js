const path = require('path');

module.exports = {
  plugins: {
    autoprefixer: {},
    cssnano: process.env.NODE_ENV !== 'development' ? {} : false,
    tailwindcss: { config: path.resolve(__dirname, 'tailwind.config.js') },
  },
};
