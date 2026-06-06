/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#fef3c7', // yellow-100
          DEFAULT: '#f59e0b', // amber-500
          dark: '#ea580c', // orange-600
        }
      }
    },
  },
  plugins: [],
}
