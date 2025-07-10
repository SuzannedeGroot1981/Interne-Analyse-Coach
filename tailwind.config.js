/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: "#005b4f", // Hogeschool Leiden groen
      },
      fontFamily: {
        'gantari': ['Gantari', 'sans-serif'],
        'sans': ['Gantari', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'intro': ['1.125rem', { lineHeight: '1.7', fontWeight: '500' }],
        'subtitle': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        'section': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}