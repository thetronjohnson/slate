<template>
  <div class="h-full flex flex-col markdown-editor">
    <ClientOnly>
      <!-- Scrollable Editor Content -->
      <div 
        class="flex-1 overflow-y-auto overscroll-contain px-6 scroll-smooth border-t border-slate-50"
        ref="editorContainer"
      >
        <div class="container max-w-[720px] mx-auto py-8">
          <div class="mt-2">
            <editor-content 
              :editor="editor" 
              class="editor-content"
            />
          </div>
        </div>
      </div>

      <!-- Word Count - Floating -->
      <div 
        class="fixed bottom-6 right-6 text-xs text-slate-500 font-medium bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm border border-slate-200/50 transition-all duration-200 hover:bg-white/90 select-none"
      >
        {{ wordCount }} words
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { onBeforeUnmount, ref, computed, watch, nextTick } from 'vue'
import yaml from 'js-yaml'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = ref<Editor>()
const editorContainer = ref<HTMLElement>()

function parseFrontmatter(content: string) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)
  
  if (match) {
    try {
      const frontmatter = yaml.load(match[1])
      const markdown = match[2]
      return { frontmatter, markdown }
    } catch (e) {
      console.error('Error parsing frontmatter:', e)
      return { frontmatter: null, markdown: content }
    }
  }
  
  return { frontmatter: null, markdown: content }
}

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        },
        codeBlock: {
          languageClassPrefix: 'language-',
          HTMLAttributes: {
            class: 'code-block'
          }
        }
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'cursor-pointer'
        },
        validate: href => /^https?:\/\//.test(href)
      }),
      Image.configure({
        inline: false,
        HTMLAttributes: {
          class: 'rounded-lg'
        }
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
        linkValidator: url => /^https?:\/\//.test(url),
        transformLink: url => {
          return url.replace(/\\[\[\]()]/g, match => match.charAt(1))
        },
        transformPaste: true,
        preserveCursor: true,
        keepMarks: true,
        hardBreak: false,
        transformSerialize: (markdown) => {
          const { frontmatter, markdown: content } = parseFrontmatter(markdown)
          if (frontmatter) {
            return `---\n${yaml.dump(frontmatter)}---\n\n${content}`
          }
          return markdown
        },
        transformParseRules: [
          {
            find: /^---\n([\s\S]*?)\n---\n/,
            handler: ({ content, match }) => {
              return content.slice(match[0].length)
            }
          }
        ]
      })
    ],
    content: props.modelValue,
    onUpdate: ({ editor }) => {
      try {
        let markdown = editor.storage.markdown.getMarkdown()
        
        const originalFrontmatter = parseFrontmatter(props.modelValue).frontmatter
        if (originalFrontmatter) {
          markdown = `---\n${yaml.dump(originalFrontmatter)}---\n\n${markdown}`
        }
        
        emit('update:modelValue', markdown)
      } catch (error) {
        console.error('Error in editor update:', error)
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none min-h-[300px]'
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain')
        if (text && /^\[.*\]\(.*\)$/.test(text.trim())) {
          view.dispatch(view.state.tr.insertText(text))
          return true
        }
        return false
      }
    }
  })
})

// Watch for external content changes
watch(() => props.modelValue, (newContent) => {
  if (editor.value && editor.value.storage.markdown.getMarkdown() !== newContent) {
    try {
      const selection = editor.value.state.selection
      const { from, to } = selection
      
      const { markdown } = parseFrontmatter(newContent)
      editor.value.commands.setContent(markdown)
      
      if (from !== undefined && to !== undefined && from <= editor.value.state.doc.content.size) {
        nextTick(() => {
          editor.value?.commands.setTextSelection({
            from: Math.min(from, editor.value.state.doc.content.size),
            to: Math.min(to, editor.value.state.doc.content.size)
          })
        })
      }
    } catch (error) {
      console.error('Error updating editor content:', error)
    }
  }
}, { deep: true })

const wordCount = computed(() => {
  if (!editor.value) return 0
  const text = editor.value.getText()
  return text.trim().split(/\s+/).filter(Boolean).length
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style>
/* Base editor styles */
.markdown-editor {
  @apply bg-white;
  font-family: 'Poppins', sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.editor-content {
  min-height: calc(100vh - 8rem);
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

/* Typography improvements */
.editor-content :where(h1, h2, h3, h4, h5, h6) {
  @apply font-medium text-slate-900;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  line-height: 1.3;
}

.editor-content :where(h1) { @apply text-4xl font-bold; }
.editor-content :where(h2) { @apply text-3xl font-bold; }
.editor-content :where(h3) { @apply text-2xl font-bold; }
.editor-content :where(h4) { @apply text-xl font-bold; }
.editor-content :where(h5, h6) { @apply text-lg font-bold; }

.editor-content :where(p) {
  @apply text-base leading-relaxed text-slate-700;
  margin-bottom: 1.25em;
}

/* List improvements */
.editor-content :where(ul, ol) {
  @apply my-4 ml-6 text-sm text-slate-700;
  line-height: 1.7;
}

.editor-content :where(li) {
  @apply mb-1;
}

.editor-content :where(li p) {
  @apply my-1;
}

/* Better code blocks */
.editor-content :where(code:not(pre code)) {
  @apply bg-slate-100/80 text-slate-700 px-1.5 py-0.5 rounded text-[13px];
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-feature-settings: "calt" 1, "ss02" 1;
}

.editor-content :where(pre) {
  @apply bg-slate-900 text-slate-50 p-4 rounded-lg my-4 overflow-x-auto shadow-sm;
  font-feature-settings: "calt" 1, "ss02" 1;
}

.editor-content :where(pre code) {
  @apply text-[13px];
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.6;
  tab-size: 2;
}

/* Better blockquotes */
.editor-content :where(blockquote) {
  @apply border-l-2 border-slate-200 pl-4 my-6 italic text-slate-600;
  margin-left: 0;
  margin-right: 0;
}

/* Link improvements */
.editor-content a {
  @apply text-blue-600 hover:text-blue-700 underline decoration-blue-400/30 hover:decoration-blue-400 transition-all duration-150 ease-in-out;
}

/* Image enhancements */
.editor-content img {
  @apply max-w-full rounded-lg shadow-sm my-6 border border-slate-200/50;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

/* Better selection */
.editor-content ::selection {
  @apply bg-blue-100/70;
}

/* Empty state improvements */
.editor-content p.is-editor-empty:first-child::before {
  @apply text-slate-400/90;
  content: "Start writing...";
  float: left;
  pointer-events: none;
  height: 0;
}

/* Table improvements */
.editor-content table {
  @apply w-full my-6 text-sm;
  border-collapse: separate;
  border-spacing: 0;
}

.editor-content th,
.editor-content td {
  @apply border border-slate-200 px-4 py-2;
}

.editor-content th {
  @apply bg-slate-50/80 font-medium text-slate-700;
}

/* Task list improvements */
.editor-content ul[data-type="taskList"] {
  @apply list-none pl-0;
}

.editor-content ul[data-type="taskList"] li {
  @apply flex items-start gap-2;
}

.editor-content ul[data-type="taskList"] input[type="checkbox"] {
  @apply mt-1.5 transition-all duration-150 ease-in-out;
  appearance: none;
  width: 14px;
  height: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  cursor: pointer;
}

.editor-content ul[data-type="taskList"] input[type="checkbox"]:checked {
  @apply bg-blue-500 border-blue-500;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='white'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E");
}

/* Better spacing between elements */
.editor-content > * + * {
  margin-top: 1em;
}

/* Improved cursor */
.editor-content .ProseMirror {
  outline: none;
  caret-color: #3b82f6;
}

/* Improved focus ring */
.editor-content .ProseMirror-focused {
  outline: none;
  box-shadow: none;
}

/* Better scrolling */
.overflow-y-auto {
  scrollbar-gutter: stable;
}

/* Improved scroll behavior */
.overscroll-contain {
  overscroll-behavior: contain;
}

/* Smoother scrolling */
.scroll-smooth {
  scroll-behavior: smooth;
}

/* First element spacing */
.editor-content > *:first-child {
  margin-top: 0;
}

/* Word count hover */
.word-count {
  @apply hover:bg-slate-50 transition-all duration-150 ease-in-out;
}

/* Horizontal rule improvements */
.editor-content :where(hr) {
  @apply my-8 border-0 h-px bg-slate-200;
}

/* Add styles for frontmatter section */
.editor-content .frontmatter {
  @apply bg-slate-50/50 p-4 rounded-lg mb-6 font-mono text-sm text-slate-600;
  white-space: pre-wrap;
}
</style> 