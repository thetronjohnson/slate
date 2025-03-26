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
              <div class="relative">
                <input
                  v-model="prompt"
                  type="text"
                  class="w-full border-0 bg-transparent p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 text-base"
                  placeholder="Ask AI to help with your writing..."
                  @keyup.enter="handleSubmit"
                  ref="inputRef"
                />
                
                <div v-if="isLoading" class="absolute right-4 top-4">
                  <Icon icon="lucide:loader-2" class="w-5 h-5 text-slate-400 animate-spin" />
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
  selectedContent: String
});

const emit = defineEmits(['close', 'update-content']);

const prompt = ref('');
const error = ref('');
const isLoading = ref(false);
const inputRef = ref(null);

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