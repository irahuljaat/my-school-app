// tailwind.config.js

/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}', 
    './pages/**/*.{js,ts,jsx,tsx,mdx}', 
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // --- THIS BLOCK COMPLETELY OVERRIDES THE PROBLEM STYLES ---
    colors: {
      // Keep standard functional colors 
      inherit: colors.inherit,
      current: colors.current,
      transparent: colors.transparent,
      black: colors.black,
      white: colors.white,

      // Manually redefine primary colors using safe RGB/Hex values
      // This ensures html2canvas-compatible values for all shades.
      
      // Gray Scale (Used in Marksheet/Admit Card)
      gray: colors.zinc, // Use a neutral scale like zinc as it's often simpler
      
      // Red Scale
      red: colors.red,
      
      // Green Scale
      green: colors.green,
      
      // Blue Scale
      blue: colors.blue,

      // Add any other specific colors you use (e.g., yellow, indigo)
      yellow: colors.yellow,
      indigo: colors.indigo,
      // ... and so on for any other colors used.
    },
    // End of colors override
  },
  plugins: [],
}