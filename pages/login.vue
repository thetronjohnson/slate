<template>
  <div class="min-h-screen bg-white flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <h1 class="text-4xl font-extrabold text-slate-900 mb-2">Slate</h1>
        <h2 class="text-xl font-medium text-slate-600 mb-2">Welcome back</h2>
        <p class="text-sm text-slate-500">
          Continue with Google to access your workspace
        </p>
      </div>
      <div class="flex flex-col items-center gap-6">
        <button
          @click="signInWithGoogle"
          class="flex items-center gap-3 px-6 py-3 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 text-sm font-medium active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          <span v-if="!isLoading" class="flex items-center justify-center gap-2">
            <Icon icon="logos:google-icon" class="w-5 h-5" />
            Sign in with Google
          </span>
          <span v-else class="flex items-center justify-center">
            <Icon icon="lucide:loader-2" class="w-5 h-5 mr-2 animate-spin" />
            Signing in...
          </span>
        </button>
        <div class="text-xs text-slate-400">
          By continuing, you agree to our
          <a href="#" class="text-slate-600 hover:text-slate-900 hover:underline">Terms of Service</a>
          and
          <a href="#" class="text-slate-600 hover:text-slate-900 hover:underline">Privacy Policy</a>
        </div>
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
    await router.push('/')
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