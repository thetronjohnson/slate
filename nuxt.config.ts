// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'url'
import path from 'path'

export default defineNuxtConfig({
  ssr: false,
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
  app: {
    baseURL: './',
    buildAssetsDir: '_nuxt',
    cdnURL: './',
  },
  nitro: {
    preset: 'static',
    output: {
      dir: path.join(__dirname, 'dist'),
      publicDir: path.join(__dirname, 'dist')
    },
    prerender: {
      crawlLinks: true,
      routes: ['/']
    },
    serveStatic: true,
    minify: true
  },
  vite: {
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: '_nuxt',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          format: 'es',
          entryFileNames: '_nuxt/[name].js',
          chunkFileNames: '_nuxt/[name].js',
          assetFileNames: '_nuxt/[name][extname]'
        }
      }
    }
  },
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => ['webview'].includes(tag)
    }
  },
  build: {
    transpile: ['@tiptap/vue-3', '@tiptap/core', '@tiptap/starter-kit', '@tiptap/extension-link']
  }
})
