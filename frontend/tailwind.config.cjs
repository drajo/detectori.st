/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        explorer: {
          bg: '#0f1117',
          surface: '#1a1d27',
          border: '#2a2d3e',
          hover: '#252838',
          accent: '#6366f1',
          'accent-hover': '#4f46e5',
          gold: '#f59e0b',
          success: '#10b981',
          danger: '#ef4444',
          muted: '#6b7280',
          text: '#e2e8f0',
          'text-secondary': '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        explorer: '0 4px 24px rgba(0,0,0,0.4)',
        'explorer-sm': '0 2px 8px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
};
