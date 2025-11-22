/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#00ffff',
        'secondary': '#00ff88',
        'dark': '#1a1a2e',
        'darker': '#16213e',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 255, 255, 0.5)',
        'neon-hover': '0 0 15px #00ffff',
        'neon-soft': '0 0 30px rgba(0, 255, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
