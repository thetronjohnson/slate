/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        manrope: ['Manrope', 'system-ui', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            fontFamily: 'Merriweather, Georgia, serif',
            h1: {
              fontFamily: 'Merriweather, Georgia, serif',
              fontWeight: 700,
            },
            h2: {
              fontFamily: 'Merriweather, Georgia, serif',
              fontWeight: 700,
            },
            h3: {
              fontFamily: 'Merriweather, Georgia, serif',
              fontWeight: 700,
            },
            p: {
              fontFamily: 'Merriweather, Georgia, serif',
              lineHeight: 1.8,
            },
            strong: {
              fontFamily: 'Merriweather, Georgia, serif',
              fontWeight: 700,
            },
            em: {
              fontFamily: 'Merriweather, Georgia, serif',
              fontStyle: 'italic',
            },
            'strong em, em strong': {
              fontFamily: 'Merriweather, Georgia, serif',
              fontWeight: 700,
              fontStyle: 'italic',
            }
          }
        }
      }
    },
  },
  plugins: [],
} 