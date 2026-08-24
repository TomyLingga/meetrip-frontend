/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
    },
    extend: {
      colors: {
        /*
         * Permukaan berlapis — nilainya dari CSS variable di globals.css
         * sehingga otomatis ikut light/dark tanpa perlu varian dark:.
         */
        surface: {
          DEFAULT: 'var(--surface-page)',
          card: 'var(--surface-card)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
        },
        aurora: {
          green: '#5dfdcb',
          blue: '#14b8a6',
          purple: '#a855f7',
          pink: '#ec4899',
        },
        slate: {
          150: '#eaeff5',
          205: '#e1e7ef',
          250: '#d7dfe9',
          350: '#b0bccd',
          355: '#adbaca',
          405: '#92a1b6',
          450: '#7c8ca2',
          455: '#7a899f',
          505: '#637289',
          550: '#56657a',
          555: '#546378',
          650: '#3d4b5f',
          705: '#324054',
          750: '#293548',
          805: '#1d283a',
          850: '#172033',
          855: '#161f32',
          955: '#010415',
        },
        amber: {
          250: '#fddd6c',
          450: '#f8af18',
        },
        blue: {
          250: '#a9d0fe',
        },
        emerald: {
          250: '#8bedc4',
          450: '#22c68d',
          650: '#058760',
        },
        indigo: {
          755: '#3c34b5',
        },
        purple: {
          250: '#e1c5ff',
        },
        red: {
          55: '#fef0f0',
          250: '#fdb8b8',
          655: '#c92121',
        },
        rose: {
          305: '#fda1ad',
          450: '#f85872',
          455: '#f75670',
        },
        teal: {
          55: '#ecfdf9',
          250: '#7fe0d3',
          450: '#21c6b3',
          555: '#10a496',
          605: '#0d9387',
          650: '#0e857b',
          655: '#0e847a',
          750: '#106a64',
          850: '#125652',
        },
      },
      /*
       * Token kedalaman (neumorphism). Pakai `shadow-neu` untuk elemen terangkat,
       * `shadow-neu-in` untuk elemen cekung (field/tab aktif), `shadow-neu-top`
       * dan `shadow-neu-side` untuk topbar/sidebar.
       */
      boxShadow: {
        'neu-sm': 'var(--neu-raised-sm)',
        neu: 'var(--neu-raised)',
        'neu-lg': 'var(--neu-raised-lg)',
        'neu-in-sm': 'var(--neu-inset-sm)',
        'neu-in': 'var(--neu-inset)',
        'neu-in-accent': 'var(--neu-inset-accent)',
        'neu-top': 'var(--neu-top)',
        'neu-side': 'var(--neu-side)',
        'neu-pop': 'var(--neu-pop)',
        'neu-modal': 'var(--neu-modal)',
        'neu-accent': 'var(--neu-accent-glow)',
      },
      animation: {
        'aurora-slow': 'aurora 20s infinite alternate',
        'aurora-fast': 'aurora 10s infinite alternate',
        'toast-progress': 'toast-progress 4s linear forwards',
        'fade-up': 'fade-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'zoom-out': 'zoomOutAnim 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
      keyframes: {
        aurora: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'toast-progress': {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        zoomOutAnim: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
