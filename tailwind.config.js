/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Hogeschool Leiden officiële kleuren
        'hl-donkergroen': '#004D46',    // HL Donkergroen - primaire kleur
        'hl-lichtgroen': '#C9F0E6',     // HL Lichtgroen - accenten
        'hl-wit': '#FFFFFF',            // HL Wit
        'hl-donkerpaars': '#280F4B',    // HL Donkerpaars - accenten
        'hl-zand': '#DEDCCE',           // HL Zand - neutrale achtergrond
        'hl-geel': '#FFEB73',           // HL Geel - highlights
        
        // Aliassen voor backwards compatibility
        primary: '#004D46',             // HL Donkergroen als primaire kleur
        secondary: '#C9F0E6',           // HL Lichtgroen als secundaire kleur
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
      backgroundImage: {
        'hl-gradient': 'linear-gradient(135deg, #004D46 0%, #C9F0E6 100%)',
        'hl-gradient-dark': 'linear-gradient(135deg, #004D46 0%, #280F4B 100%)',
      },
    },
  },
  plugins: [],
}