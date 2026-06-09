/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        earth: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Note: 'brand-amber' avoids clobbering Tailwind's built-in amber palette
        'brand-amber': {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 7s ease-in-out infinite',
        'float-delayed': 'float 9s ease-in-out infinite 2.5s',
        'float-slow': 'float 11s ease-in-out infinite 5s',
        'orbit': 'orbit 14s linear infinite',
        'count-in': 'countIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'glow-green': 'glowGreen 2.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)' },
          '50%': { transform: 'translateY(-28px) scale(1.04)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        countIn: {
          '0%': { opacity: '0', transform: 'scale(0.7) translateY(12px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        glowGreen: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(22,163,74,0.25)' },
          '50%': { boxShadow: '0 0 28px rgba(22,163,74,0.55)' },
        },
      },
    },
  },
  plugins: [],
}
