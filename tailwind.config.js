module.exports = {
  purge: [
      './dist/js/bundle.js',
      'index.html',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      height: {
        144: '36rem',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
