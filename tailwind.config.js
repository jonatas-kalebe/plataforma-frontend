/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    screens: {
      'xs': '320px',
      'sm': '480px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
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
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.8rem + 2.25vw, 3rem)',
        'fluid-5xl': 'clamp(2.5rem, 2rem + 2.5vw, 3.75rem)',
        'fluid-6xl': 'clamp(3rem, 2.4rem + 3vw, 4.5rem)',
        'fluid-7xl': 'clamp(3.75rem, 3rem + 3.75vw, 5.625rem)',
        'fluid-8xl': 'clamp(4.5rem, 3.6rem + 4.5vw, 6.75rem)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        'screen-small': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'slide-up': 'slide-up 0.6s ease-out forwards',
        'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
