// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts'
  ],
  googleFonts: {
    families: {
      'Nunito Sans': [300, 400, 500, 600, 700],
      'JetBrains Mono': [400, 500]
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
    preload: true,
  },
  css: ['~/assets/css/main.css']
})
