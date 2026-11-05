/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        marine: {
          950: '#060B18',
          900: '#0B132B',
          850: '#111C3D',
          800: '#1C2541',
          700: '#2A365C',
          600: '#3A4B7C',
        },
        emergency: {
          crimson: '#EF4444',
          glow: '#DC2626',
        },
        radar: {
          green: '#10B981',
          lime: '#34D399',
        },
        warning: {
          amber: '#F59E0B',
          orange: '#F97316',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
