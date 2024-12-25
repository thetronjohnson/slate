<template>
  <div class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-lg border border-slate-200/60 p-6 max-w-sm w-full mx-4">
      <div class="flex items-center gap-3 mb-4">
        <Icon name="ph:image" class="w-4 h-4 text-blue-500" />
        <h3 class="text-base font-medium text-slate-800">Edit Image</h3>
      </div>
      
      <!-- Alt Text -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">
          Alt Text
        </label>
        <input 
          v-model="altText"
          type="text"
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Image description"
        />
      </div>
      
      <!-- Image URL -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-slate-700 mb-1">
          Image URL
        </label>
        <input 
          v-model="url"
          type="text"
          class="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="https://example.com/image.jpg"
        />
      </div>
      
      <!-- Actions -->
      <div class="flex justify-end gap-2">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-md transition-all duration-200"
        >
          Cancel
        </button>
        <button 
          @click="handleSubmit"
          class="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-all duration-200"
        >
          Update
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWorkspace } from '~/composables/useWorkspace'

const props = defineProps<{
  initialAlt: string
  initialUrl: string
}>()

const emit = defineEmits<{
  close: []
  submit: [{ altText: string, url: string }]
}>()

const workspace = useWorkspace()

const altText = ref(props.initialAlt)
const url = ref(props.initialUrl.startsWith('file://')
  ? props.initialUrl.replace(`file://${workspace.value}`, '')
  : props.initialUrl.startsWith('http')
    ? props.initialUrl
    : props.initialUrl.startsWith('/')
      ? props.initialUrl
      : `/${props.initialUrl}`
)

function handleSubmit() {
  emit('submit', {
    altText: altText.value,
    url: url.value
  })
  emit('close')
}
</script> 