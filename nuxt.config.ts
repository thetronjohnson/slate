// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'
import path from 'path'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-icon'],
  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: false,
    asyncContext: true
  },
  tailwindcss: {
    config: {
      content: [],
      safelist: [],
      theme: {
        extend: {
          fontFamily: {
            sans: ['-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Helvetica Neue', 'sans-serif'],
            editor: ['Merriweather', 'Georgia', 'serif']
          },
        },
      },
      plugins: [require('@tailwindcss/typography')],
    }
  },
  ssr: false,
  app: {
    baseURL: process.env.NODE_ENV === 'production' ? './' : '/',
    buildAssetsDir: 'assets',
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'manifest', href: '/site.webmanifest' }
      ],
      meta: [
        { name: 'msapplication-TileColor', content: '#ffffff' },
        { name: 'theme-color', content: '#ffffff' }
      ]
    }
  },
  nitro: {
    output: {
      dir: path.join(__dirname, 'dist'),
      publicDir: path.join(__dirname, 'dist')
    },
    preset: 'static',
    minify: true,
    compressPublicAssets: true,
    prerender: {
      crawlLinks: false,
      routes: ['/']
    }
  },
  vite: {
    assetsInclude: ['**/*.ttf']
  },
  css: [
    '@/assets/styles/global.css'
  ]
})
