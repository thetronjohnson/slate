<template>
  <div class="h-full flex flex-col markdown-editor">
    <ClientOnly>
      <!-- Editor Content -->
      <div 
        class="flex-1 overflow-y-auto px-4 scroll-smooth pt-24" 
        ref="editorContainer"
      >
        <div class="container max-w-[650px] mx-auto">
          <editor-content 
            :editor="editor" 
            class="editor-content"
          />
        </div>
      </div>

      <!-- Word Count -->
      <div 
        class="fixed bottom-4 right-4 text-sm text-slate-400 font-medium bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200/50"
      >
        {{ wordCount }} words
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { onBeforeUnmount, ref, computed } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = ref<Editor>()
const editorContainer = ref<HTMLElement>()
const wordCount = computed(() => {
  if (!editor.value) return 0
  const text = editor.value.getText()
  return text.trim().split(/\s+/).filter(Boolean).length
})

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4]
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'code-block'
          }
        }
      })
    ],
    content: props.modelValue,
    onUpdate: () => {
      emit('update:modelValue', editor.value?.getHTML() || '')
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none min-h-[300px]'
      }
    }
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
.markdown-editor {
  @apply bg-white;
}

.editor-content {
  @apply py-8;
  min-height: calc(100vh - 8rem);
}

/* Typography styles */
.editor-content :where(h1, h2, h3, h4, h5, h6) {
  @apply font-serif;
}

.editor-content :where(h1) {
  @apply text-3xl font-bold mt-8 mb-6 text-slate-900 tracking-tight;
}

.editor-content :where(h2) {
  @apply text-2xl font-semibold mt-8 mb-4 text-slate-900 tracking-tight;
}

.editor-content :where(h3) {
  @apply text-xl font-semibold mt-6 mb-4 text-slate-900;
}

.editor-content :where(h4) {
  @apply text-lg font-semibold mt-6 mb-3 text-slate-800;
}

.editor-content :where(p) {
  @apply text-lg text-slate-700 leading-relaxed mb-6 font-serif;
}

.editor-content :where(ul, ol) {
  @apply my-6 ml-6 font-serif;
}

.editor-content :where(li) {
  @apply text-lg text-slate-700 mb-2;
}

.editor-content :where(blockquote) {
  @apply border-l-2 border-slate-200 pl-6 my-8 italic text-slate-600 font-serif;
}

/* Code blocks */
.editor-content :where(code:not(pre code)) {
  @apply bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-sm font-mono;
}

.editor-content :where(pre) {
  @apply bg-slate-900 text-slate-50 p-4 rounded-lg my-6 overflow-x-auto shadow-lg;
}

.editor-content :where(pre code) {
  @apply bg-transparent text-inherit p-0 font-mono text-sm;
}

.editor-content :where(hr) {
  @apply my-8 border-t-2 border-slate-200;
}

/* Selection styles */
::selection {
  @apply bg-slate-100;
}

/* Remove outline */
.editor-content :where(*) {
  @apply focus:outline-none focus:ring-0;
}

/* Placeholder styles */
.editor-content p.is-editor-empty:first-child::before {
  @apply text-slate-300 font-serif transition-opacity duration-200;
  content: "Start writing... (Use Markdown: # for heading, ** for bold, * for italic)";
  float: left;
  pointer-events: none;
  height: 0;
  opacity: 0.8;
}

.editor-content p.is-editor-empty:first-child:hover::before {
  opacity: 0.5;
}

/* Improved blinking cursor */
.editor-content p.is-editor-empty:first-child::after {
  content: '';
  @apply inline-block w-[2px] h-[1.4em] align-middle bg-slate-400;
  margin-left: 2px;
  animation: cursor-blink 1.2s ease-in-out infinite;
  position: relative;
  top: 2px;
}

@keyframes cursor-blink {
  0%, 100% { 
    opacity: 0;
    transform: translateY(0);
  }
  50% { 
    opacity: 1;
    transform: translateY(-1px);
  }
}

/* Make cursor more visible on light backgrounds */
.editor-content p.is-editor-empty:first-child:hover::after {
  @apply bg-slate-500;
}

/* Smooth transition for cursor color */
.editor-content p.is-editor-empty:first-child::after {
  transition: background-color 0.2s ease;
}

/* Improve initial content styling */
.editor-content h1:first-of-type {
  @apply text-2xl text-slate-800 mb-6;
}

.editor-content ul:first-of-type {
  @apply bg-slate-50 rounded-lg p-6 my-6;
}

.editor-content ul:first-of-type li {
  @apply mb-3 text-slate-600;
}

.editor-content ul:first-of-type code {
  @apply bg-white border border-slate-200;
}

.editor-content hr {
  @apply my-8 border-slate-200;
}
</style> 