<template>
  <div 
    class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-xl shadow-lg border border-slate-200/60 p-6 max-w-sm w-full mx-4">
      <div class="flex items-center gap-3 mb-4">
        <Icon name="ph:link" class="w-4 h-4 text-blue-500" />
        <h3 class="text-base font-medium text-slate-800">Add Link</h3>
      </div>
      <div class="space-y-4">
        <div>
          <label class="text-sm text-slate-600 mb-1 block">Text</label>
          <input 
            v-model="text"
            type="text"
            class="w-full px-2 py-1.5 bg-white border border-slate-200/70 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Link text"
            ref="textInput"
          />
        </div>
        <div>
          <label class="text-sm text-slate-600 mb-1 block">URL</label>
          <input 
            v-model="url"
            type="url"
            class="w-full px-2 py-1.5 bg-white border border-slate-200/70 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="https://"
            @keyup.enter="handleSubmit"
          />
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button 
          @click="$emit('close')"
          class="px-3 py-1.5 text-slate-600 hover:bg-slate-50 rounded"
        >
          Cancel
        </button>
        <button 
          @click="handleSubmit"
          class="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          :disabled="!isValid"
        >
          Add Link
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialText?: string
}>()

const emit = defineEmits(['close', 'submit'])
const text = ref(props.initialText || '')
const url = ref('')
const textInput = ref<HTMLInputElement>()

const isValid = computed(() => url.value.startsWith('http'))

function handleSubmit() {
  if (isValid.value) {
    emit('submit', { text: text.value, url: url.value })
    emit('close')
  }
}

onMounted(() => {
  // Focus text input if no initial text, otherwise focus URL input
  nextTick(() => {
    if (!props.initialText) {
      textInput.value?.focus()
    } else {
      textInput.value?.nextElementSibling?.querySelector('input')?.focus()
    }
  })
})
</script> 