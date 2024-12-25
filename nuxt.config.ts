// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-icon', '@nuxtjs/google-fonts'],
  tailwindcss: {
    config: {
      content: [],
      theme: {
        extend: {
          fontFamily: {
            serif: ['Merriweather', 'Georgia', 'serif'],
            sans: ['Albert Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
          },
        },
      },
      plugins: [require('@tailwindcss/typography')],
    }
  },
  googleFonts: {
    families: {
      Merriweather: [400, 700],
      'Albert+Sans': [400, 500, 600],
    },
    display: 'swap',
  },
  ssr: false,
  app: {
    baseURL: process.env.NODE_ENV === 'production' ? './' : '/',
    buildAssetsDir: 'assets',
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap'
        }
      ]
    }
  },
  nitro: {
    preset: 'static'
  },
  css: [
    '@/assets/styles/global.css'
  ]
})
