<template>
  <div 
    class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-xl shadow-lg border border-slate-200/60 p-6 max-w-sm w-full mx-4">
      <div class="flex items-center gap-3 mb-4">
        <Icon name="ph:image" class="w-4 h-4 text-blue-500" />
        <h3 class="text-base font-medium text-slate-800">Add Image from URL</h3>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="text-sm text-slate-600 mb-1 block">Image URL</label>
          <input 
            v-model="url"
            type="url"
            class="w-full px-2 py-1.5 bg-white border border-slate-200/70 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="https://"
            ref="urlInput"
            @keyup.enter="handleSubmit"
          />
        </div>
        
        <div>
          <label class="text-sm text-slate-600 mb-1 block">Alt Text</label>
          <input 
            v-model="altText"
            type="text"
            class="w-full px-2 py-1.5 bg-white border border-slate-200/70 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Describe the image"
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
          Add Image
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits(['close', 'submit'])
const url = ref('')
const altText = ref('')
const urlInput = ref<HTMLInputElement>()

const isValid = computed(() => url.value.startsWith('http'))

function handleSubmit() {
  if (isValid.value) {
    emit('submit', { url: url.value, altText: altText.value })
  }
}

onMounted(() => {
  nextTick(() => {
    urlInput.value?.focus()
  })
})
</script> 