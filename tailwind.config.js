const colors = require('tailwindcss/colors');

module.exports = {
  purge: [
      './built/js/bundle.js',
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
      display: ['group-hover'],
      textColor: ['active'],
      backgroundColor: ['active', 'group-focus'],
      ringWidth: ['hover'],
      ringColor: ['hover', 'active'],
      ringOpacity: ['hover', 'active'],
      borderRadius: ['first', 'last'],
      borderColor: ['active', 'group-focus'],
      visibility: ['group-hover'],
    },
  },
  plugins: [],
}
