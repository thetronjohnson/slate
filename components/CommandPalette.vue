<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div v-if="isOpen" class="fixed inset-x-0 bottom-0 z-50">
      <div class="mx-auto max-w-2xl w-full px-4 pb-4">
        <div class="bg-white rounded-lg shadow-xl border border-slate-200/50 overflow-hidden">
          <!-- Login Prompt for Unauthenticated Users -->
          <div v-if="!user" class="p-4">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Icon icon="lucide:sparkles" class="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 class="font-medium text-slate-900">Login to use Slate AI</h3>
                <p class="text-sm text-slate-500">Get instant help with your writing</p>
              </div>
            </div>
            <button
              @click="handleLogin"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-all duration-200 active:scale-95"
            >
              <Icon icon="lucide:log-in" class="w-4 h-4" />
              Sign in to continue
            </button>
          </div>

          <!-- Selection Preview (Only show when authenticated) -->
          <div v-if="user && props.selectedContent !== props.fullContent" class="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
            <div class="flex items-center gap-2">
              <Icon icon="lucide:text-select" class="w-3.5 h-3.5 text-slate-400" />
              <p class="text-xs text-slate-500 truncate">
                {{ truncateText(stripHtml(props.selectedContent), 100) }}
              </p>
            </div>
          </div>

          <!-- Input and Prompts (Only show when authenticated) -->
          <div v-if="user" class="relative">
            <input
              v-model="prompt"
              type="text"
              class="w-full border-0 bg-transparent p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-base"
              :placeholder="props.selectedContent === props.fullContent 
                ? 'Ask Slate AI to help with the entire document...' 
                : 'Ask Slate AI to help with the selected text...'"
              @keyup.enter="handleSubmit"
              ref="inputRef"
            />
            
            <div v-if="isLoading" class="absolute right-4 top-4">
              <Icon icon="lucide:loader-2" class="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          </div>
          
          <!-- Helper Prompts (Only show when authenticated) -->
          <div v-if="user" class="px-4 py-3 bg-slate-50 border-t border-slate-100">
            <div class="flex flex-col gap-2">
              <p class="text-xs font-medium text-slate-500">Quick prompts:</p>
              <div class="flex flex-wrap gap-2">
                <template v-if="props.selectedContent !== props.fullContent">
                  <!-- Selected text prompts -->
                  <button
                    v-for="suggestion in selectedTextPrompts"
                    :key="suggestion"
                    @click="usePrompt(suggestion)"
                    class="text-xs px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
                  >
                    {{ suggestion }}
                  </button>
                </template>
                <template v-else>
                  <!-- Full document prompts -->
                  <button
                    v-for="suggestion in fullDocumentPrompts"
                    :key="suggestion"
                    @click="usePrompt(suggestion)"
                    class="text-xs px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all duration-200"
                  >
                    {{ suggestion }}
                  </button>
                </template>
              </div>
            </div>
          </div>
          
          <div v-if="error" class="px-4 py-3 bg-red-50 border-t border-red-100">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>
        </div>
        <!-- Close button -->
        <button 
          @click="close"
          class="mt-2 mx-auto block p-2 rounded-full bg-white/80 backdrop-blur border border-slate-200/50 text-slate-400 hover:text-slate-600 transition-all duration-200"
        >
          <Icon icon="lucide:x" class="w-5 h-5" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { Icon } from '@iconify/vue';
import { useRouter } from 'vue-router';
import { useSupabaseUser } from '#imports';
import { useSupabaseClient } from '#imports';

const props = defineProps({
  isOpen: Boolean,
  selectedContent: String,
  fullContent: String
});

const emit = defineEmits(['close', 'update-content']);

const prompt = ref('');
const error = ref('');
const isLoading = ref(false);
const inputRef = ref(null);
let savedSelection = null;
const user = useSupabaseUser();
const router = useRouter();
const supabase = useSupabaseClient();

const selectedTextPrompts = [
  'Fix grammar',
  'Make it LinkedIn-friendly',
  'Convert to bullet points'
];

const fullDocumentPrompts = [
  'Create a travel checklist',
  'Create a marketing plan for my mobile app',
  'Create a survey'
];

async function handleSubmit() {
  if (!prompt.value.trim() || isLoading.value) return;
  
  try {
    isLoading.value = true;
    error.value = '';
    
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.value,
        content: props.selectedContent
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }
    
    const data = await response.json();
    emit('update-content', data.content);
    close();
  } catch (e) {
    error.value = e.message;
  } finally {
    isLoading.value = false;
  }
}

function close() {
  if (savedSelection) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedSelection);
  }
  emit('close');
}

async function handleLogin() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    if (error) throw error;
    emit('close');
  } catch (error) {
    console.error('Error signing in with Google:', error);
  }
}

function usePrompt(suggestion) {
  prompt.value = suggestion;
  handleSubmit();
}

function stripHtml(html) {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function truncateText(text, wordLimit) {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordLimit) return text;
  return words.slice(0, wordLimit).join(' ') + '...';
}

onMounted(() => {
  // Setup keyboard shortcut
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function handleKeydown(e) {
  // Close on escape
  if (e.key === 'Escape' && props.isOpen) {
    close();
  }
}

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    prompt.value = '';
    error.value = '';
    if (user.value) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        savedSelection = selection.getRangeAt(0);
      }
    }
    await nextTick();
    if (user.value) {
      inputRef.value?.focus();
    }
  }
});
</script>

<style scoped>
/* Add your styles here */
</style> 