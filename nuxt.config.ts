// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  ssr: true,
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxtjs/supabase',
  ],
  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/auth/callback',
    },
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },
  googleFonts: {
    families: {
      'Noto Serif': [300, 400, 500, 600, 700],
      'Nunito Sans': [300, 400, 500, 600, 700],
      'JetBrains Mono': [400, 500]
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
    preload: true,
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      appUrl: process.env.APP_URL
    },
    openaiApiKey: process.env.OPENAI_API_KEY,
  }
})
