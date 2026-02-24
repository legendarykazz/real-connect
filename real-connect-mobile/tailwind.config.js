/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0f172a',
        'brand-green': '#10b981',
        'brand-light-blue': '#bae6fd',
        'brand-light': '#f8fafc',
      },
    },
  },
  plugins: [],
}
