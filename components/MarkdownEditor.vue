<template>
  <div class="markdown-editor h-full">
    <FloatingToolbar
      v-if="editor"
      :editor="editor"
      :format-menu-items="formatMenuItems"
      :list-menu-items="listMenuItems"
      :insert-menu-items="insertMenuItems"
    />
    <CommandPalette
      :is-open="showCommandPalette"
      :selected-content="getSelectedText()"
      :full-content="editor?.getHTML()"
      @close="showCommandPalette = false"
      @update-content="updateSelectedText"
    />
    
    <!-- Save Status -->
    <div class="fixed bottom-4 right-4 flex items-center gap-2">
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div 
          v-if="saveStatus" 
          class="text-xs px-3 py-1.5 rounded-md bg-white shadow-sm border border-slate-200/50 text-slate-500 flex items-center gap-2"
        >
          <Icon 
            icon="lucide:check"
            class="w-3.5 h-3.5"
          />
          Saved
        </div>
      </transition>
      
      <button
        @click="saveContent"
        class="p-2 rounded-md bg-white shadow-sm border border-slate-200/50 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all duration-200 active:scale-95"
        title="Save (⌘S)"
      >
        <Icon icon="lucide:save" class="w-4 h-4" />
      </button>
    </div>
    
    <!-- Editor Content -->
    <div class="bg-white h-full">
      <editor-content 
        v-if="editor" 
        :editor="editor" 
        class="prose prose-slate prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none px-8 py-12" 
      />
      <div v-else class="flex justify-center items-center h-64">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
          <p class="text-gray-400">Loading editor...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Icon } from '@iconify/vue';
import CommandPalette from './CommandPalette.vue';
import { useStorage } from '../composables/useStorage';
import FloatingToolbar from './FloatingToolbar.vue';
import { useEventListener } from '@vueuse/core';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  fileId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);
const saveStatus = ref('');
let saveTimeout = null;

// Track if initial content is loaded
const isInitialContentLoaded = ref(false);

// Create the editor
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    Document,
    Paragraph,
    Text,
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    Placeholder.configure({
      placeholder: 'Type "⌘ + K" for Slate AI, or just start writing...'
    }),
    Image,
    Link,
    TaskList,
    TaskItem.configure({
      nested: true
    })
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
    // Trigger auto-save
    if (saveTimeout) clearTimeout(saveTimeout);
    // Clear any existing "Saved" message
    saveStatus.value = '';
    saveTimeout = setTimeout(() => {
      saveContent();
    }, 1500);
  }
});

// Define menu items by category
const formatMenuItems = [
  {
    name: 'Bold',
    icon: 'lucide:bold',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleBold().run();
    },
    isActive: () => editor.value?.isActive('bold')
  },
  {
    name: 'Italic',
    icon: 'lucide:italic',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleItalic().run();
    },
    isActive: () => editor.value?.isActive('italic')
  },
  {
    name: 'Strike',
    icon: 'lucide:strikethrough',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleStrike().run();
    },
    isActive: () => editor.value?.isActive('strike')
  },
  {
    name: 'Code',
    icon: 'lucide:code',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleCode().run();
    },
    isActive: () => editor.value?.isActive('code')
  }
];

const listMenuItems = [
  {
    name: 'Bullet List',
    icon: 'lucide:list',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleBulletList().run();
    },
    isActive: () => editor.value?.isActive('bulletList')
  },
  {
    name: 'Ordered List',
    icon: 'lucide:list-ordered',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleOrderedList().run();
    },
    isActive: () => editor.value?.isActive('orderedList')
  },
  {
    name: 'Task List',
    icon: 'lucide:check-square',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleTaskList().run();
    },
    isActive: () => editor.value?.isActive('taskList')
  }
];

const insertMenuItems = [
  {
    name: 'Heading 1',
    icon: 'lucide:heading-1',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleHeading({ level: 1 }).run();
    },
    isActive: () => editor.value?.isActive('heading', { level: 1 })
  },
  {
    name: 'Heading 2',
    icon: 'lucide:heading-2',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleHeading({ level: 2 }).run();
    },
    isActive: () => editor.value?.isActive('heading', { level: 2 })
  },
  {
    name: 'Heading 3',
    icon: 'lucide:heading-3',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleHeading({ level: 3 }).run();
    },
    isActive: () => editor.value?.isActive('heading', { level: 3 })
  },
  {
    name: 'Blockquote',
    icon: 'lucide:quote',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleBlockquote().run();
    },
    isActive: () => editor.value?.isActive('blockquote')
  },
  {
    name: 'Code Block',
    icon: 'lucide:file-code',
    action: () => {
      if (editor.value) editor.value.chain().focus().toggleCodeBlock().run();
    },
    isActive: () => editor.value?.isActive('codeBlock')
  }
];

// Combine all menu items for use in other functions
const menuItems = computed(() => [
  ...formatMenuItems,
  ...listMenuItems,
  ...insertMenuItems
]);

// Watch for changes in the modelValue prop
watch(() => props.modelValue, (newValue) => {
  // Only update if the editor exists and the content is different
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue);
  }
}, { immediate: true });

// Clean up the editor on component unmount
onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy();
  }
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
});

// Expose the editor and menu items to the parent component
defineExpose({
  editor,
  formatMenuItems,
  listMenuItems,
  insertMenuItems
});

const showCommandPalette = ref(false);

// Setup keyboard shortcut
onMounted(async () => {
  window.addEventListener('keydown', handleKeydown);
  try {
    const savedContent = await storage.getDocument(props.fileId);
    if (savedContent && editor.value && !isInitialContentLoaded.value) {
      editor.value.commands.setContent(savedContent);
      isInitialContentLoaded.value = true;
    }
  } catch (error) {
    console.error('Error loading content:', error);
  }
  // Add keyboard shortcut for saving
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      saveContent();
    }
  });

  // Add keyboard shortcut listener
  useEventListener(document, 'keydown', selectAllContent);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});

function handleKeydown(e) {
  // Open command palette on Cmd/Ctrl + K
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    showCommandPalette.value = true;
  }
}

function updateContent(newContent) {
  if (editor.value) {
    editor.value.commands.setContent(newContent);
  }
}

function getSelectedText() {
  if (!editor.value) return null;
  const { from, to } = editor.value.state.selection;
  if (from === to) {
    return editor.value.getHTML();
  }
  return editor.value.state.doc.textBetween(from, to);
}

function updateSelectedText(newContent) {
  if (!editor.value) return;
  const { from, to } = editor.value.state.selection;
  if (from === to) {
    editor.value.commands.setContent(newContent);
    return;
  }
  editor.value.chain()
    .focus()
    .deleteRange({ from, to })
    .insertContent(newContent)
    .run();
}

function handleCommandPalette() {
  showCommandPalette.value = true;
}

// Watch for fileId changes to load content
watch(() => props.fileId, async (newId, oldId) => {
  // Only load content if it's a different file
  if (newId && newId !== oldId) {
    try {
      const content = await storage.getDocument(newId);
      if (content && editor.value) {
        editor.value.commands.setContent(content);
      }
    } catch (error) {
      console.error('Error loading content for new file:', error);
    }
  }
}, { immediate: true });

// Save content to IndexedDB
async function saveContent() {
  if (!editor.value || !props.fileId) return;
  
  try {
    const content = editor.value.getHTML();
    await storage.saveDocument(props.fileId, content);
    saveStatus.value = 'saved';
    
    // Hide the "Saved" indicator after 2 seconds
    setTimeout(() => {
      if (saveStatus.value === 'saved') {
        saveStatus.value = '';
      }
    }, 2000);
  } catch (error) {
    console.error('Error saving content:', error);
    saveStatus.value = 'error';
  }
}

const { storage } = useStorage();

// Add method to select all editor content
function selectAllContent(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
    e.preventDefault(); // Prevent default browser select all
    if (editor.value) {
      editor.value.commands.selectAll();
    }
  }
}
</script>

<style>
.ProseMirror {
  min-height: calc(100vh - 48px); /* 48px is the height of the top bar */
  outline: none;
  padding: 0;
  @apply font-editor;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

/* Improve the appearance of the editor content - Notion style */
.ProseMirror h1 {
  @apply text-3xl font-bold mb-4 text-gray-900 pb-1;
  letter-spacing: -0.01em;
  @apply font-editor;
}

.ProseMirror h2 {
  @apply text-2xl font-bold mb-3 text-gray-800 mt-6;
  letter-spacing: -0.01em;
  @apply font-editor;
}

.ProseMirror h3 {
  @apply text-xl font-bold mb-2 text-gray-800 mt-5;
  letter-spacing: -0.01em;
  @apply font-editor;
}

.ProseMirror p {
  @apply mb-4 leading-relaxed text-gray-700;
  @apply font-editor;
  font-size: 1.05rem;
  line-height: 1.7;
}

.ProseMirror ul {
  @apply list-disc pl-5 mb-4 text-gray-700 space-y-1;
  @apply font-editor;
}

.ProseMirror ol {
  @apply list-decimal pl-5 mb-4 text-gray-700 space-y-1;
  @apply font-editor;
}

/* Fix list item alignment */
.ProseMirror ul li,
.ProseMirror ol li {
  @apply relative;
}

.ProseMirror ul li::marker,
.ProseMirror ol li::marker {
  @apply text-gray-400;
}

/* Ensure proper alignment for multi-line list items */
.ProseMirror ul li p,
.ProseMirror ol li p {
  @apply m-0 inline align-top;
}

/* Task List Styling */
.ProseMirror ul[data-type="taskList"] {
  @apply list-none p-0 mb-4 space-y-2;
}

.ProseMirror ul[data-type="taskList"] li {
  @apply flex items-center gap-2;
  @apply font-editor;
}

.ProseMirror ul[data-type="taskList"] li > label {
  @apply flex-shrink-0 flex items-center justify-center;
}

.ProseMirror ul[data-type="taskList"] li > div {
  @apply flex-grow pt-[1px];
}

.ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
  @apply h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 cursor-pointer;
  margin: 0;
}

.ProseMirror ul[data-type="taskList"] li > div p {
  @apply m-0 leading-normal;
}

.ProseMirror blockquote {
  @apply border-l-4 border-amber-200 pl-4 my-4 py-2 bg-amber-50/50 text-amber-800 rounded-r not-italic;
  @apply font-editor;
}

.ProseMirror blockquote p {
  @apply tracking-tight text-amber-800/90 m-0 leading-relaxed not-italic;
  font-size: 1rem;
}

.ProseMirror pre {
  @apply bg-slate-50/70 p-4 my-4 overflow-x-auto text-sm text-slate-800 border-l-4 border-l-slate-200 border-y border-r border-slate-200/50 rounded-r;
  font-family: 'JetBrains Mono', monospace;
}

.ProseMirror code {
  @apply bg-slate-50/70 px-1.5 py-0.5 rounded text-[13px] text-slate-700 border border-slate-200/50;
  font-family: 'JetBrains Mono', monospace;
}

.ProseMirror pre code {
  @apply bg-transparent border-none p-0 text-slate-700;
  font-size: 13px;
  line-height: 1.6;
}

.ProseMirror pre::before {
  content: 'Code';
  @apply block text-xs font-medium text-slate-400 mb-2 font-sans;
}

.ProseMirror img {
  @apply max-w-full h-auto my-4 rounded-md;
}

.ProseMirror a {
  @apply text-blue-600 hover:underline;
}

.ProseMirror hr {
  @apply my-6 border-t border-gray-100;
}
</style> 