/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        onyx: { DEFAULT: '#0D0E10', 900: '#0D0E10', 850: '#121417', 800: '#16181C', 750: '#1B1E23', 700: '#22262C', 600: '#2E333A' },
        graphite: { DEFAULT: '#4A4D52', 400: '#6E737B', 300: '#9A9EA5', 200: '#C4C6CA' },
        ivory: { DEFAULT: '#F2EFE8', 50: '#FAF8F4', 100: '#F2EFE8', 200: '#E6E1D6', 300: '#D4CDBE' },
        crimson: { DEFAULT: '#C1121F', 400: '#E0303C', 500: '#C1121F', 600: '#9E0E19', 700: '#7A0A13' },
        midnight: { DEFAULT: '#1B2540', 400: '#33456E', 500: '#1B2540', 600: '#131A2E' },
        signal: { green: '#2FB36E', amber: '#E3A72F', blue: '#4C8DF6' },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'system-ui', 'sans-serif'],
        brand: ['"Exo 2"', 'system-ui', 'sans-serif'],
        sans: ['Barlow', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        plate: 'inset 0 1px 0 rgba(255,255,255,.06), 0 1px 0 rgba(0,0,0,.6), 0 12px 30px -12px rgba(0,0,0,.7)',
        glow: '0 0 0 1px rgba(193,18,31,.5), 0 10px 40px -10px rgba(193,18,31,.55)',
      },
      keyframes: {
        dash: { to: { strokeDashoffset: '-40' } },
        sweep: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: .35 } },
      },
      animation: { dash: 'dash 1.2s linear infinite', sweep: 'sweep 2.4s ease-in-out infinite', pulseDot: 'pulseDot 1.6s ease-in-out infinite' },
    },
  },
  plugins: [],
}
