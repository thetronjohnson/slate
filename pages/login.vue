<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-200">
      <div>
        <h1 class="text-4xl font-extrabold text-center text-slate-900 mb-2">Slate</h1>
        <h2 class="mt-6 text-3xl font-bold text-center text-slate-800">Sign in</h2>
        <p class="mt-2 text-sm text-center text-slate-600">
          Sign in with your Google account for easy access.
        </p>
      </div>
      <div class="mt-8">
        <button
          @click="signInWithGoogle"
          :class="[
            'group relative w-full flex justify-center py-3 px-4 border border-transparent',
            'text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2',
            'focus:ring-offset-2 transition-colors bg-slate-900 hover:bg-slate-800',
            'focus:ring-slate-500'
          ]"
        >
          <span v-if="!isLoading" class="flex items-center justify-center">
            <Icon icon="logos:google-icon" class="w-5 h-5 mr-2" />
            Sign in with Google
          </span>
          <span v-else class="flex items-center justify-center">
            <Icon icon="lucide:loader-2" class="w-5 h-5 mr-2 animate-spin" />
            Signing in...
          </span>
        </button>
        <p v-if="errorMessage" class="mt-2 text-sm text-center text-red-600">
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'

const isLoading = ref(false)
const errorMessage = ref('')
const router = useRouter()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

onMounted(async () => {
  if (user.value) {
    await router.push('/dashboard')
  }
})

const signInWithGoogle = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `http://localhost:3000/auth/callback`,
        scopes: 'email profile'
      }
    })

    if (error) {
      errorMessage.value = error.message
    }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script> 