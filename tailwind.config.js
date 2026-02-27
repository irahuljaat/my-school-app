/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', 
    './pages/**/*.{js,ts,jsx,tsx,mdx}', 
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Keep your functional overrides for Marksheet/PDF compatibility
    colors: {
      inherit: colors.inherit,
      current: colors.current,
      transparent: colors.transparent,
      black: '#000000',
      white: '#ffffff',
      gray: colors.zinc, 
      red: colors.red,
      green: colors.green,
      blue: colors.blue,
      yellow: colors.yellow,
    },
    extend: {
      colors: {
        pallikoodam: {
          pink: '#FF4F7B',   // Primary Theme Color
          yellow: '#FFAE00', // Secondary
          blue: '#1ABAD6',   // Information
          green: '#82C232',  // Success
          darkBlue: '#123367', // Footer/Headings
          bgLight: '#F7F1EB', // Cream background
        }
      },
      borderRadius: {
        'kids': '40px', // Large soft corners
      },
      animation: {
        'slow-bounce': 'bounce 3s infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}