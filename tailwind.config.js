const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')
const siteConfig = require('./config/site.config')

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.zinc,
      red: colors.rose,
      yellow: colors.amber,
      green: colors.green,
      blue: colors.sky,
      indigo: colors.indigo,
      purple: colors.purple,
      pink: colors.pink,
      teal: colors.teal,
      cyan: colors.cyan,
      orange: colors.orange,
    },
    extend: {
      fontFamily: {
        sans: [`"${siteConfig.googleFontSans}"`, '"Noto Sans SC"', ...defaultTheme.fontFamily.sans],
        mono: [`"${siteConfig.googleFontMono}"`, ...defaultTheme.fontFamily.mono],
      },
      colors: {
        gray: {
          850: '#222226',
        },
        primary: 'rgb(86,189,248)',
        'normal-text': '#333',
        'dark-text': '#b4b4b4',
      },
      animation: {
        'spin-slow': 'spin 5s linear infinite',
      },
      padding: {
        2.75: '0.6875rem',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
