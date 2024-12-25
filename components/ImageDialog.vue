<template>
  <div 
    class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-xl shadow-lg border border-slate-200/60 p-6 max-w-md w-full mx-4">
      <div class="flex items-center gap-3 mb-4">
        <Icon name="ph:image" class="w-4 h-4 text-blue-500" />
        <h3 class="text-base font-medium text-slate-800">Add Image</h3>
      </div>

      <!-- Tab Selection -->
      <div class="flex gap-4 mb-6 border-b border-slate-200">
        <button 
          @click="activeTab = 'url'"
          class="px-4 py-2 text-sm transition-colors relative"
          :class="activeTab === 'url' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'"
        >
          URL
          <div v-if="activeTab === 'url'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
        </button>
        <button 
          @click="activeTab = 'upload'"
          class="px-4 py-2 text-sm transition-colors relative"
          :class="activeTab === 'upload' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'"
        >
          Upload
          <div v-if="activeTab === 'upload'" class="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500"></div>
        </button>
      </div>

      <!-- URL Input -->
      <div v-if="activeTab === 'url'" class="space-y-4">
        <div>
          <label class="text-sm text-slate-600 mb-1 block">Image URL</label>
          <input 
            v-model="url"
            type="url"
            class="w-full px-2 py-1.5 bg-white border border-slate-200/70 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="https://"
            ref="urlInput"
          />
        </div>
        
        <!-- Preview -->
        <div v-if="url" class="relative rounded-lg border border-slate-200 overflow-hidden">
          <img 
            :src="url" 
            class="w-full h-48 object-contain bg-slate-50"
            @error="handleImageError"
            @load="imageValid = true"
          />
          <div 
            v-if="!imageValid" 
            class="absolute inset-0 flex items-center justify-center bg-slate-50 text-slate-400 text-sm"
          >
            Invalid image URL
          </div>
        </div>
      </div>

      <!-- File Upload -->
      <div v-else class="space-y-4">
        <div 
          class="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          :class="{ 'border-blue-400 bg-blue-50/50': isDragging }"
        >
          <div class="mb-2">
            <Icon name="ph:upload-simple" class="w-6 h-6 text-slate-400 mx-auto" />
          </div>
          <p class="text-sm text-slate-600 mb-2">
            Drag and drop an image or
            <button 
              @click="triggerFileInput"
              class="text-blue-500 hover:text-blue-600"
            >
              browse
            </button>
          </p>
          <p class="text-xs text-slate-400">
            Supports: PNG, JPG, GIF, WebP
          </p>
          <input 
            ref="fileInput"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
        </div>

        <!-- Preview -->
        <div v-if="selectedFile" class="relative rounded-lg border border-slate-200 overflow-hidden">
          <img 
            :src="filePreview"
            class="w-full h-48 object-contain bg-slate-50"
          />
          <button 
            @click="clearFile"
            class="absolute top-2 right-2 p-1 bg-white/90 rounded-full shadow-sm hover:bg-white"
          >
            <Icon name="ph:x" class="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      <!-- Alt Text -->
      <div class="mt-4">
        <label class="text-sm text-slate-600 mb-1 block">Alt Text</label>
        <input 
          v-model="altText"
          type="text"
          class="w-full px-2 py-1.5 bg-white border border-slate-200/70 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Describe the image"
        />
      </div>

      <!-- Actions -->
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
const props = defineProps<{
  initialAltText?: string
}>()

const emit = defineEmits(['close', 'submit'])

const activeTab = ref('url')
const url = ref('')
const altText = ref(props.initialAltText || '')
const imageValid = ref(false)
const isDragging = ref(false)
const selectedFile = ref<File | null>(null)
const filePreview = ref('')
const urlInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()

const isValid = computed(() => {
  if (activeTab.value === 'url') {
    return url.value && imageValid.value && altText.value
  }
  return selectedFile.value && altText.value
})

function handleImageError() {
  imageValid.value = false
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    selectedFile.value = file
    // Create a safe URL for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      filePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files[0]
  if (file?.type.startsWith('image/')) {
    selectedFile.value = file
    // Create a safe URL for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      filePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function clearFile() {
  selectedFile.value = null
  filePreview.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleSubmit() {
  if (activeTab.value === 'url' && url.value && imageValid.value) {
    emit('submit', {
      type: 'url',
      url: url.value,
      altText: altText.value
    })
  } else if (selectedFile.value) {
    emit('submit', {
      type: 'file',
      file: selectedFile.value,
      altText: altText.value
    })
  }
}

onMounted(() => {
  // Focus URL input on mount
  nextTick(() => {
    if (activeTab.value === 'url') {
      urlInput.value?.focus()
    }
  })
})
</script> 