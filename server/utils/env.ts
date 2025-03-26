import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  if (!config.openaiApiKey) {
    console.warn('NUXT_OPENAI_API_KEY is not set in environment')
  }
}) 