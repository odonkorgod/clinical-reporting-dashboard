/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'clinical-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a5f',
          950: '#0f2035',
        },
        'clinical-dark': '#0a1628',
        'clinical-panel': '#0f2035',
        'clinical-border': '#1e3a5f',
        'clinical-text': '#c8d8ea',
        'clinical-muted': '#6b87a5',
      },
      keyframes: {
        'flash-border': {
          '0%, 100%': { borderColor: '#ef4444', boxShadow: '0 0 0 1px #ef4444' },
          '50%': { borderColor: '#7f1d1d', boxShadow: '0 0 0 1px #7f1d1d' },
        },
        'pulse-alert': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'slide-in': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'flash-border': 'flash-border 0.8s ease-in-out infinite',
        'pulse-alert': 'pulse-alert 0.8s ease-in-out infinite',
        'slide-in': 'slide-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
