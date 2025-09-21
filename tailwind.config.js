/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'athenity-blue-deep': '#0A192F',
        'athenity-blue-card': '#112240',
        'athenity-gold': '#FFD700',
        'athenity-green-circuit': '#64FFDA',
        'athenity-text-title': '#CCD6F6',
        'athenity-text-body': '#8892B0',
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
