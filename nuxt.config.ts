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
        },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        { name: 'msapplication-TileColor', content: '#ffffff' },
        { name: 'theme-color', content: '#ffffff' }
      ]
    }
  },
  nitro: {
    preset: 'static'
  },
  css: [
    '@/assets/styles/global.css'
  ],
  vite: {
    assetsInclude: ['**/*.ttf'],
  }
})
