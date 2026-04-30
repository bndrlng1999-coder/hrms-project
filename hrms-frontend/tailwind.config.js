export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#b7d8ff',
          300: '#83bbff',
          400: '#4b95f5',
          500: '#256fdb',
          600: '#174fb8',
          700: '#153f94',
          800: '#173977',
          900: '#0f274f',
        },
        accent: {
          50: '#ecfdf8',
          100: '#d1faef',
          500: '#10b981',
          600: '#059669',
        },
        surface: '#f6f8fb',
      }
    },
  },
  plugins: [],
}
