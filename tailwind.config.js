const colors = require('tailwindcss/colors');

module.exports = {
  purge: [
      './dist/js/bundle.js',
      'index.html',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        fuchsia: colors.fuchsia,
      },
      height: {
        144: '36rem',
      }
    },
  },
  variants: {
    extend: {
      textColor: ['active'],
      backgroundColor: ['active', 'group-focus'],
      ringWidth: ['hover'],
      ringColor: ['hover', 'active'],
      ringOpacity: ['hover', 'active'],
      borderColor: ['active', 'group-focus'],
    },
  },
  plugins: [],
}
