<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="close" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto pt-[20vh]">
        <div class="flex min-h-full items-start justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-xl transform overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">
              <!-- Selection Preview -->
              <div v-if="props.selectedContent !== props.fullContent" class="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                <div class="flex items-center gap-2">
                  <Icon icon="lucide:text-select" class="w-3.5 h-3.5 text-slate-400" />
                  <p class="text-xs text-slate-500 truncate">
                    {{ truncateText(stripHtml(props.selectedContent), 100) }}
                  </p>
                </div>
              </div>

              <div class="relative">
                <input
                  v-model="prompt"
                  type="text"
                  class="w-full border-0 bg-transparent p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-base"
                  :placeholder="props.selectedContent === props.fullContent 
                    ? 'Ask AI to help with the entire document...' 
                    : 'Ask AI to help with the selected text...'"
                  @keyup.enter="handleSubmit"
                  ref="inputRef"
                />
                
                <div v-if="isLoading" class="absolute right-4 top-4">
                  <Icon icon="lucide:loader-2" class="w-5 h-5 text-slate-400 animate-spin" />
                </div>
              </div>
              
              <!-- Helper Prompts -->
              <div class="px-4 py-3 bg-slate-50 border-t border-slate-100">
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
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue';
import { Icon } from '@iconify/vue';

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
    await nextTick();
    inputRef.value?.focus();
  }
});

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
    
    if (!response.ok) throw new Error('Failed to get AI response');
    
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
  emit('close');
}
</script> 