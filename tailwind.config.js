/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF5FB',
          100: '#D9E8F5',
          200: '#B3D1EA',
          300: '#85B5DE',
          400: '#4A8DC6',
          500: '#1F6BA8',
          600: '#0F4C81',
          700: '#0C3E69',
          800: '#093252',
          900: '#07263D',
          950: '#041A2B',
          DEFAULT: '#0F4C81',
        },
        secondary: {
          50: '#EAF6FE',
          100: '#D0EBFD',
          200: '#A1D7FB',
          300: '#6CC0F6',
          400: '#3EADF1',
          500: '#1D9BF0',
          600: '#0D7DC6',
          700: '#0B639D',
          800: '#0A4E7D',
          900: '#093E63',
          DEFAULT: '#1D9BF0',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        surface: {
          light: '#F8FAFC',
          dark: '#0B1220',
        },
        ink: {
          light: '#0F172A',
          dark: '#F1F5F9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Public Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        'card-hover': '0 10px 24px -6px rgb(15 76 129 / 0.18), 0 4px 10px -4px rgb(15 23 42 / 0.08)',
        glow: '0 0 0 3px rgb(29 155 240 / 0.35)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
