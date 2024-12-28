<template>
  <div class="h-full flex flex-col markdown-editor">
    <ClientOnly>
      <!-- Image Dialog -->
      <ImageDialog
        v-if="showImageDialog"
        @close="showImageDialog = false"
        @submit="handleImageSubmit"
      />
      
      <!-- Link Dialog -->
      <LinkDialog
        v-if="showLinkDialog"
        :initial-text="selectedText"
        @close="showLinkDialog = false"
        @submit="handleLinkSubmit"
      />
      
      <!-- Floating Toolbar -->
      <EditorContextMenu
        v-if="showContextMenu"
        :x="menuX"
        :y="menuY"
        :is-visible="showContextMenu"
        :editor="editor"
        @add-link="handleAddLink"
        @add-image="handleAddImage"
        @add-workspace-image="handleWorkspaceImage"
        @close="showContextMenu = false"
      />
      <!-- Scrollable Editor Content -->
      <div 
        class="flex-1 overflow-y-auto overscroll-contain px-6 scroll-smooth border-t border-slate-50 editor-scrollbar"
        ref="editorContainer"
        @contextmenu="handleContextMenu"
      >
        <div class="container max-w-[720px] mx-auto py-8">
          <div class="mt-2">
            <editor-content 
              :editor="editor" 
              class="prose prose-slate max-w-none px-8 py-6 font-editor"
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

      <!-- Image URL Dialog -->
      <ImageUrlDialog
        v-if="showImageUrlDialog"
        @close="showImageUrlDialog = false"
        @submit="handleImageUrlSubmit"
      />

      <!-- Image Edit Dialog -->
      <ImageEditDialog
        v-if="showImageEditDialog"
        :initial-alt="selectedImage.alt"
        :initial-url="selectedImage.url"
        @close="showImageEditDialog = false"
        @submit="handleImageEdit"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { onBeforeUnmount, ref, computed, watch, nextTick, shallowRef } from 'vue'
import yaml from 'js-yaml'
import { useFloating } from '@floating-ui/vue'
import { computePosition, flip, shift } from '@floating-ui/dom'
import EditorContextMenu from './EditorContextMenu.vue'
import LinkDialog from './LinkDialog.vue'
import ImageDialog from './ImageDialog.vue'
import ImageUrlDialog from './ImageUrlDialog.vue'
import ImageEditDialog from './ImageEditDialog.vue'
import { useEditor } from '~/composables/useEditor'
import { useWorkspace } from '~/composables/useWorkspace'
import path from 'path'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { editor } = useEditor()
const workspace = useWorkspace()

const editorContainer = ref<HTMLElement>()

const showToolbar = ref(false)
const toolbarX = ref(0)
const toolbarY = ref(0)
const selection = ref({ from: 0, to: 0 })

const showContextMenu = ref(false)
const menuX = ref(0)
const menuY = ref(0)

const showLinkDialog = ref(false)
const selectedText = ref('')

const showImageDialog = ref(false)
const showImageUrlDialog = ref(false)
const showImageEditDialog = ref(false)
const selectedImage = ref({ alt: '', url: '', node: null })

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

// Track selection changes
function updateToolbarPosition() {
  if (!editor.value || !editor.value.view) return
  
  const { from, to } = editor.value.state.selection
  if (from === to) {
    showToolbar.value = false
    return
  }
  
  const view = editor.value.view
  const { top, left } = view.coordsAtPos(from)
  
  toolbarY.value = top - 40 // Position above selection
  toolbarX.value = left
  showToolbar.value = true
  selection.value = { from, to }
}

// Handle link addition
async function handleAddLink() {
  showLinkDialog.value = true
  selectedText.value = editor.value?.state.selection.empty 
    ? '' 
    : editor.value?.state.doc.textBetween(
        editor.value.state.selection.from,
        editor.value.state.selection.to
      )
  showContextMenu.value = false
}

// Handle image addition
async function handleAddImage({ type, file }: { type: 'url' | 'file', file?: File }) {
  showImageUrlDialog.value = true
  showContextMenu.value = false
}

// Add context menu handler
function handleContextMenu(event: MouseEvent) {
  event.preventDefault()
  
  if (!editor.value || !editor.value.view) return
  
  const view = editor.value.view
  const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
  
  if (pos) {
    menuX.value = event.clientX
    menuY.value = event.clientY
    showContextMenu.value = true
    
    // Set selection at click position
    view.dispatch(view.state.tr.setSelection(
      view.state.selection.empty 
        ? view.state.selection 
        : view.state.selection.constructor.near(view.state.doc.resolve(pos))
    ))
    
    view.focus()
  }
}

// Hide toolbar when clicking outside
function hideToolbar(event: MouseEvent) {
  const toolbar = document.querySelector('.floating-toolbar')
  if (toolbar && !toolbar.contains(event.target as Node)) {
    showToolbar.value = false
  }
}

// Add event listeners
onMounted(() => {
  document.addEventListener('click', hideToolbar)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', hideToolbar)
})

onMounted(() => {
  // Defer editor initialization
  nextTick(() => {
    const newEditor = new Editor({
      // Add performance options
      enableInputRules: false,
      enablePasteRules: false,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4, 5, 6]
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'cursor-pointer'
          },
          validate: href => /^https?:\/\//.test(href),
          autolink: false
        }),
        Image.configure({
          inline: false,
          HTMLAttributes: {
            class: 'rounded-lg'
          },
          renderHTML(props) {
            const { src, alt } = props
            let imageSrc
            if (src.startsWith('http')) {
              imageSrc = src
            } else if (src.startsWith('workspace://')) {
              imageSrc = src
              // Get absolute path for permission check
              const cleanPath = src.replace('workspace://', '')
              const absolutePath = path.join(workspace.value, cleanPath)
              
              ipcRenderer.invoke('check-image-access', absolutePath)
                .then(result => {
                  if (!result.readable) {
                    console.error(`Image access error: ${result.error}`)
                    const img = document.querySelector(`img[src="${imageSrc}"]`)
                    if (img) {
                      img.classList.add('image-error')
                      img.title = `Error loading image: ${result.error}`
                    }
                  }
                })
            } else {
              // For any other path, convert to workspace:// protocol
              const cleanPath = src.replace(/^\//, '')
              imageSrc = `workspace://${cleanPath}`
            }
            
            return ['img', { 
              ...props, 
              src: imageSrc || src,
              draggable: false,
              onError: "this.classList.add('image-error'); this.title='Failed to load image'",
              loading: 'lazy',
              crossorigin: 'anonymous'
            }]
          },
          parseHTML() {
            return [
              {
                tag: 'img',
                getAttrs: dom => {
                  const element = dom as HTMLImageElement
                  return {
                    src: element.getAttribute('src'),
                    alt: element.getAttribute('alt'),
                    title: element.getAttribute('title')
                  }
                }
              }
            ]
          }
        }),
        Markdown.configure({
          html: true,
          tightLists: true,
          tightListClass: 'tight',
          bulletListMarker: '-',
          linkify: false,
          breaks: false,
          transformPastedText: true,
          transformCopiedText: true,
          linkValidator: url => /^https?:\/\//.test(url),
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
      onSelectionUpdate: updateToolbarPosition,
      content: props.modelValue,
      onUpdate: ({ editor }) => {
        try {
          let markdown = editor.storage.markdown.getMarkdown()
          
          markdown = markdown.replace(/\\(\[|\]|\(|\))/g, '$1')
          
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
          if (!text) return false

          // Handle pasted URLs
          if (text.match(/^https?:\/\/\S+$/)) {
            const url = text
            const title = url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
            view.dispatch(
              view.state.tr.insertText(`[${title}](${url})`)
            )
            return true
          }

          // Handle pasted markdown links
          if (/^\[.*\]\(.*\)$/.test(text.trim())) {
            view.dispatch(view.state.tr.insertText(text))
            return true
          }

          // Extract image URL from clipboard
          const imageUrl = extractImageUrl(event);
          
          if (imageUrl) {
            // Generate local filename
            const filename = generateUniqueFilename(imageUrl);
            
            // Save image to assets/images/
            const localPath = `assets/images/${filename}`;
            
            // Use relative path in markdown
            const markdownImage = `![](/${localPath})`;
            
            // Insert at cursor position
            view.dispatch(
              view.state.tr.insertText(markdownImage)
            );
            
            event.preventDefault();
          }

          return false
        },
        handleDOMEvents: {
          dblclick: (view, event) => {
            const target = event.target as HTMLElement
            if (target.tagName === 'IMG') {
              const node = view.state.doc.nodeAt(view.posAtDOM(target, 0))
              if (node) {
                selectedImage.value = {
                  alt: node.attrs.alt || '',
                  url: node.attrs.src || '',
                  node
                }
                showImageEditDialog.value = true
                return true
              }
            }
            return false
          }
        }
      }
    })
    editor.value = newEditor
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

function handleLinkSubmit({ text, url }: { text: string, url: string }) {
  if (editor.value) {
    if (selectedText.value) {
      // If text was selected, convert it to a link
      editor.value.chain()
        .focus()
        .setLink({ href: url })
        .run()
    } else {
      // If no text was selected, insert new link
      editor.value.chain()
        .focus()
        .insertContent(`[${text}](${url})`)
        .run()
    }
  }
  showLinkDialog.value = false
}

async function handleImageSubmit({ type, url, file, altText }: { 
  type: 'url' | 'file'
  url?: string
  file?: File
  altText: string 
}) {
  try {
    if (type === 'url' && url) {
      editor.value?.chain()
        .focus()
        .setImage({ 
          src: url,
          alt: altText,
          title: altText
        })
        .run()
    } else if (type === 'file' && file) {
      const { ipcRenderer } = window.require('electron')
      // Convert File to buffer for electron
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const imagePath = await ipcRenderer.invoke('save-image', {
        name: file.name,
        buffer: buffer,
        type: file.type
      })
      
      editor.value?.chain()
        .focus()
        .setImage({ 
          src: imagePath,
          alt: altText,
          title: altText
        })
        .run()
    }
  } catch (error) {
    console.error('Error adding image:', error)
    // Show error to user
    alert('Failed to add image. Please try again.')
  }
  showImageDialog.value = false
}

// Handle image URL submission
function handleImageUrlSubmit({ url, altText }: { url: string, altText: string }) {
  let finalUrl = url
  if (!url.startsWith('http')) {
    const cleanPath = url.startsWith('/') ? url.slice(1) : url
    finalUrl = `workspace://${cleanPath}`
  }
  
  editor.value?.chain()
    .focus()
    .insertContent(`![${altText}](${finalUrl})`)
    .run()
  showImageUrlDialog.value = false
}

// Handle image edit submission
function handleImageEdit({ altText, url }: { altText: string, url: string }) {
  if (!editor.value) return
  
  let finalUrl = url
  if (!url.startsWith('http')) {
    const cleanPath = url.startsWith('/') ? url.slice(1) : url
    finalUrl = `workspace://${cleanPath}`
  }
  
  const { state, dispatch } = editor.value.view
  const { tr } = state
  
  state.doc.descendants((node, pos) => {
    if (node === selectedImage.value.node) {
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        alt: altText,
        src: finalUrl
      })
      dispatch(tr)
      return false
    }
    return true
  })
}

// Initial template content with proper line breaks
const initialContent = `# Welcome to Your New Document

This is a quick guide to Markdown formatting:

## Basic Syntax

### Headers

Use # for different levels:

# Heading 1

## Heading 2

### Heading 3

### Emphasis

*This text is italic*


**This text is bold**


***This text is bold and italic***

### Lists

Unordered list:

- Item 1
- Item 2
  - Nested item
  - Another nested item

Numbered list:

1. First item
2. Second item
3. Third item

### Links and Images

[Link text](URL)

![Image alt text](Image URL)

### Code

For inline code, use single backticks: \`like this\`

Code block:

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### Quotes

> This is a blockquote
> You can have multiple lines

### Horizontal Rule

## Use three dashes:

Start writing below this guide. You can delete it anytime.`

async function handleWorkspaceImage() {
  const { ipcRenderer } = window.require('electron')
  
  // Get current workspace
  const currentWorkspace = await ipcRenderer.invoke('get-workspace')
  console.log('Current workspace:', currentWorkspace)
  
  if (!currentWorkspace) {
    alert('Please select a workspace first')
    showContextMenu.value = false
    return
  }
  
  try {
    const result = await ipcRenderer.invoke('show-open-dialog', {
      title: 'Select Image from Workspace',
      defaultPath: currentWorkspace,
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ],
      properties: ['openFile']
    })
    
    if (!result.canceled && result.filePaths.length > 0) {
      const imagePath = result.filePaths[0]
      // Get relative path by removing workspace path
      const relativePath = imagePath
        .replace(currentWorkspace, '')  // Remove workspace path
        .replace(/^\//, '')             // Remove leading slash
        .replace(/\\/g, '/')            // Convert Windows backslashes to forward slashes
      
      editor.value?.chain()
        .focus()
        .insertContent(`![](workspace://${relativePath})`)
        .run()
    }
  } catch (error) {
    console.error('Error selecting workspace image:', error)
    alert('Failed to add image from workspace. Please ensure you have a valid workspace selected.')
  }
  
  showContextMenu.value = false
}
</script>

<style>
/* Base editor styles */
.markdown-editor {
  @apply bg-white font-manrope;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

.editor-content {
  @apply font-manrope;
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
  @apply bg-slate-100/80 text-slate-700 rounded text-[13px] font-mono;
  padding: 0.2em 0.4em;
  font-feature-settings: "calt" 1, "ss02" 1;
  &::before, &::after {
    content: none !important;
  }
}

.editor-content :where(pre) {
  @apply bg-slate-900 text-slate-50 p-4 rounded-lg my-4 overflow-x-auto shadow-sm;
  font-feature-settings: "calt" 1, "ss02" 1;
  &::before, &::after {
    content: none !important;
  }
}

.editor-content :where(pre code) {
  @apply text-[13px] block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  line-height: 1.6;
  tab-size: 2;
  &::before, &::after {
    content: none !important;
  }
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
  max-height: 500px;
  object-fit: contain;
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

/* Image error state */
.editor-content img.image-error {
  @apply border-red-200 bg-red-50;
  min-height: 100px;
  position: relative;
}

.editor-content img.image-error::after {
  content: '⚠️ Image load error';
  @apply absolute inset-0 flex items-center justify-center text-sm text-red-500;
}
</style> 