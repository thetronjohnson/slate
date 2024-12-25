<template>
  <div 
    v-if="isVisible"
    class="floating-toolbar fixed bg-white rounded-lg shadow-lg border border-slate-200/60 flex items-center gap-1 p-1 transition-all duration-200 transform"
    :style="{ top: `${y}px`, left: `${x}px` }"
  >
    <button 
      @click="addLink"
      class="p-1.5 hover:bg-slate-50 rounded-md text-slate-600 transition-colors"
      title="Add Link (⌘K)"
    >
      <Icon name="ph:link" class="w-4 h-4" />
    </button>
    <button 
      @click="addImage"
      class="p-1.5 hover:bg-slate-50 rounded-md text-slate-600 transition-colors"
      title="Add Image"
    >
      <Icon name="ph:image" class="w-4 h-4" />
    </button>
    <input 
      ref="fileInput"
      type="file" 
      accept="image/*"
      class="hidden"
      @change="handleImageUpload"
    >
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  editor: any
  isVisible: boolean
  x: number
  y: number
}>()

const emit = defineEmits(['addLink', 'addImage'])
const fileInput = ref<HTMLInputElement>()

function addLink() {
  emit('addLink')
}

function addImage() {
  fileInput.value?.click()
}

function handleImageUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    emit('addImage', file)
  }
}
</script> 