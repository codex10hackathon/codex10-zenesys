/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#dbe5f0',
          200: '#b7cbe0',
          300: '#8babc9',
          400: '#5c86ac',
          500: '#3d6690',
          600: '#2c4f74',
          700: '#233f5d',
          800: '#1c3249',
          900: '#13212f',
          950: '#0b141d',
        },
        status: {
          healthy: '#1f8a4c',
          watch: '#b8860b',
          risk: '#c9670c',
          critical: '#c02929',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.04), 0 1px 3px 0 rgba(16, 24, 40, 0.06)',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
      },
    },
  },
  plugins: [],
}
