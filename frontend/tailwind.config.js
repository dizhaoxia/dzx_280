/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#18a058',
        'primary-hover': '#36ad6a',
        'primary-pressed': '#0c7a43'
      }
    }
  },
  plugins: [],
  corePlugins: {
    preflight: false
  }
}
