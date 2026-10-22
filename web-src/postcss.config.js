module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    cssnano: process.env.NODE_ENV !== 'development' ? {} : false,
  },
};
