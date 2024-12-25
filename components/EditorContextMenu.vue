<template>
  <div 
    v-if="isVisible"
    class="fixed bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[160px] z-50"
    :style="{ top: `${y}px`, left: `${x}px` }"
  >
    <!-- Edit Operations -->
    <button 
      @click="handleCut"
      class="w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
    >
      <Icon name="ph:scissors" class="w-4 h-4 text-slate-500" />
      Cut
      <span class="ml-auto text-xs text-slate-400">⌘X</span>
    </button>
    
    <button 
      @click="handleCopy"
      class="w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
    >
      <Icon name="ph:copy" class="w-4 h-4 text-slate-500" />
      Copy
      <span class="ml-auto text-xs text-slate-400">⌘C</span>
    </button>
    
    <button 
      @click="handlePaste"
      class="w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
    >
      <Icon name="ph:clipboard-text" class="w-4 h-4 text-slate-500" />
      Paste
      <span class="ml-auto text-xs text-slate-400">⌘V</span>
    </button>
    
    <div class="h-px bg-slate-200 my-1"></div>
    
    <!-- Insert Operations -->
    <button 
      @click="addLink"
      class="w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
    >
      <Icon name="ph:link" class="w-4 h-4 text-slate-500" />
      Add Link
      <span class="ml-auto text-xs text-slate-400">⌘K</span>
    </button>
    
    <!-- Image from URL -->
    <button 
      @click="addImageUrl"
      class="w-full px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
    >
      <Icon name="ph:image" class="w-4 h-4 text-slate-500" />
      Image from URL
    </button>
    
    <button
      @click="$emit('add-workspace-image')"
      class="w-full text-left px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded flex items-center gap-2"
    >
      <Icon name="ph:folder-open" class="w-4 h-4" />
      Add Image from Workspace
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isVisible: boolean
  x: number
  y: number
  editor: any
}>()

const emit = defineEmits(['addLink', 'addImage', 'close', 'cut', 'copy', 'paste'])

function addLink() {
  emit('addLink')
  emit('close')
}

function addImageUrl() {
  emit('addImage', { type: 'url' })
  emit('close')
}

function handleCut() {
  if (props.editor) {
    // Store selected text in clipboard
    const selectedText = props.editor.state.doc.textBetween(
      props.editor.state.selection.from,
      props.editor.state.selection.to
    )
    navigator.clipboard.writeText(selectedText)
    
    // Delete selected text
    props.editor.chain().focus().deleteSelection().run()
  }
  emit('close')
}

function handleCopy() {
  if (props.editor) {
    const selectedText = props.editor.state.doc.textBetween(
      props.editor.state.selection.from,
      props.editor.state.selection.to
    )
    navigator.clipboard.writeText(selectedText)
  }
  emit('close')
}

function handlePaste() {
  if (props.editor) {
    navigator.clipboard.readText().then(text => {
      props.editor.chain().focus().insertContent(text).run()
    })
  }
  emit('close')
}

// Close menu when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (!event.target?.closest('.editor-context-menu')) {
      emit('close')
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  onBeforeUnmount(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script> 