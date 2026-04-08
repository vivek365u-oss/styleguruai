/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],              // Phase 1-2: Primary font (headings, buttons)
        accent: ['Plus Jakarta Sans', 'sans-serif'], // Phase 2-3: Secondary font (body text)
      },
    },
  },
  plugins: [],
}