<template>
  <div class="min-h-screen bg-white">
    <div class="h-screen flex flex-col">
      <!-- Title Bar for Electron -->
      <TitleBar :title="title" />

      <!-- Minimal Header with Fade -->
      <header class="fixed w-full top-7 left-0 z-10 transition-opacity duration-200" 
        :class="{ 'opacity-0': isScrolled && !isHeaderHovered }"
        @mouseenter="isHeaderHovered = true"
        @mouseleave="isHeaderHovered = false"
      >
        <div class="container max-w-screen-xl mx-auto px-4">
          <div class="h-16 flex items-center justify-between">
            <input 
              type="text" 
              v-model="title" 
              placeholder="Untitled" 
              class="bg-transparent font-serif text-lg text-slate-700 focus:outline-none placeholder:text-slate-300 w-96 transition-colors focus:bg-white/50 rounded px-2 -ml-2"
            >
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-400" v-if="lastSaved">
                Saved {{ lastSaved }}
              </span>
              <button 
                class="px-4 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors relative group"
                @click="saveContent"
              >
                Save
                <span class="absolute inset-0 bg-slate-100 opacity-0 group-hover:opacity-100 rounded transition-opacity -z-10"></span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Editor -->
      <div class="flex-1 overflow-hidden" @scroll="handleScroll">
        <MarkdownEditor 
          v-model="content" 
          class="h-full"
          @update:modelValue="handleContentUpdate"
        />
      </div>

      <!-- Status Messages -->
      <Transition
        enter-active-class="transform transition duration-300"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transform transition duration-200"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div 
          v-if="statusMessage" 
          class="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm shadow-lg"
        >
          {{ statusMessage }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const title = ref('')
const content = ref(`<h1>Welcome to Your Markdown Editor</h1>

<p>This is a minimalist editor that supports Markdown formatting. Here's how to format your text:</p>

<ul>
<li>Use <code>#</code> for main heading</li>
<li>Use <code>##</code> for subheading</li>
<li>Use <code>**text**</code> for <strong>bold text</strong></li>
<li>Use <code>*text*</code> for <em>italic text</em></li>
<li>Use <code>\`code\`</code> for <code>inline code</code></li>
<li>Use <code>></code> for blockquotes</li>
<li>Use <code>-</code> or <code>*</code> for bullet points</li>
</ul>

<p>Start writing below this guide. The guide will disappear once you delete it.</p>

<hr>

`)
const isScrolled = ref(false)
const isHeaderHovered = ref(false)
const lastSaved = ref('')
const statusMessage = ref('')

// Auto-save functionality
const debouncedSave = useDebounceFn(() => {
  saveContent()
}, 2000)

function handleContentUpdate() {
  debouncedSave()
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  isScrolled.value = target.scrollTop > 50
}

async function saveContent() {
  if (window.require) {
    const { ipcRenderer } = window.require('electron')
    
    try {
      const saved = await ipcRenderer.invoke('save-file', {
        content: content.value,
        title: title.value
      })
      
      if (saved) {
        const now = new Date()
        lastSaved.value = now.toLocaleTimeString()
        showStatus('File saved')
      }
    } catch (error) {
      showStatus('Error saving file')
    }
  } else {
    // Fallback for web version
    const now = new Date()
    lastSaved.value = now.toLocaleTimeString()
    showStatus('Changes saved')
  }
}

function showStatus(message: string) {
  statusMessage.value = message
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

// Handle keyboard shortcuts
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      saveContent()
    }
  })
})
</script>

<style>
/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Better focus styles */
:focus-visible {
  @apply outline-none ring-2 ring-blue-500 ring-offset-2;
}

/* Selection color */
::selection {
  @apply bg-blue-100;
}
</style> 