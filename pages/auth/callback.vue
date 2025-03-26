<template>
  <div class="min-h-screen bg-white flex items-center justify-center">
    <div class="max-w-md w-full space-y-6 text-center">
      <div>
        <h1 class="text-4xl font-extrabold text-slate-900 mb-2">Slate</h1>
        <h2 class="text-xl font-medium text-slate-600">Completing login</h2>
      </div>
      <div class="flex flex-col items-center gap-4">
        <div class="relative">
          <div class="w-12 h-12 rounded-full border-[3px] border-slate-200 border-t-slate-900 animate-spin"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <Icon 
              icon="lucide:file-text" 
              class="w-5 h-5 text-slate-400" 
            />
          </div>
        </div>
        <p class="text-sm text-slate-500">
          Setting up your workspace...
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
const client = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()

// Handle the OAuth callback
onMounted(async () => {
  try {
    const { error } = await client.auth.getSession()
    if (error) throw error
    
    // Redirect to the main page after successful login
    await router.push('/')
  } catch (error) {
    console.error('Error in auth callback:', error)
    await router.push('/login')
  }
})
</script>