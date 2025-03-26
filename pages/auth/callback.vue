<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-4"></div>
      <p class="text-slate-600">Completing login...</p>
    </div>
  </div>
</template>

<script setup>
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