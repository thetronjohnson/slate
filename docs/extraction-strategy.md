# Extraction Strategy: Standalone Editor & Renderer

## Objective

Extract the Slate editor and renderer as a standalone library that can be:
1. Used as a VSCode extension for editing markdown files
2. Embedded in other applications
3. Distributed as an NPM package

## Extraction Approach

### Option 1: Monorepo Structure (Recommended)

Create a monorepo with three packages:

```
slate/
├── packages/
│   ├── editor/              # Standalone editor package
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Editor.vue
│   │   │   │   ├── Renderer.vue
│   │   │   │   ├── Toolbar.vue
│   │   │   │   └── index.ts
│   │   │   ├── composables/
│   │   │   │   ├── useEditor.ts
│   │   │   │   └── useStorage.ts (interface)
│   │   │   ├── styles/
│   │   │   │   └── editor.css
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── vscode-extension/    # VSCode plugin
│   │   ├── src/
│   │   │   ├── extension.ts
│   │   │   ├── webview/
│   │   │   │   ├── editor.ts
│   │   │   │   └── index.html
│   │   │   └── storage/
│   │   │       └── vscodeStorage.ts
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── web-app/             # Original Nuxt app
│       ├── components/
│       ├── pages/
│       └── ...
│
└── package.json             # Root workspace config
```

**Benefits:**
- ✅ Clean separation of concerns
- ✅ Shared code between web app and VSCode extension
- ✅ Independent versioning
- ✅ Easy to maintain both versions

### Option 2: Separate Repository

Create a new repo for the standalone editor:

```
slate-editor/
├── src/
│   ├── components/
│   ├── composables/
│   └── index.ts
├── examples/
│   ├── vscode/              # VSCode extension example
│   ├── react/               # React integration example
│   └── vanilla/             # Vanilla JS example
└── package.json
```

**Benefits:**
- ✅ Cleaner for distribution
- ✅ Focused repository
- ⚠️ Need to sync changes manually

**Recommendation:** Start with Option 1 (monorepo) for easier development, then publish editor package separately.

## Component Extraction Plan

### Core Components to Extract

#### 1. Editor Component

**Current:** `components/MarkdownEditor.vue` (535 lines)

**Extracted version:**
```
packages/editor/src/components/Editor.vue
```

**Changes needed:**
- ✅ Keep: TipTap editor setup
- ✅ Keep: Extension configuration
- ❌ Remove: Nuxt-specific imports
- ❌ Remove: CommandPalette (AI features)
- ❌ Remove: FloatingToolbar (make optional)
- 🔄 Replace: `useStorage()` with interface
- 🔄 Replace: `@iconify/vue` with inline SVGs or props
- 🔄 Replace: `@vueuse/core` with native APIs

**New interface:**
```vue
<template>
  <SlateEditor
    v-model="content"
    :storage="storageAdapter"
    :placeholder="'Start writing...'"
    :extensions="customExtensions"
    @save="handleSave"
  />
</template>

<script setup>
import { SlateEditor } from '@slate-editor/core'
import { createVSCodeStorage } from './vscodeStorage'

const storageAdapter = createVSCodeStorage()
const content = ref('')
</script>
```

#### 2. Renderer Component

**Current:** `pages/[id].vue` (rendering logic)

**Extracted version:**
```
packages/editor/src/components/Renderer.vue
```

**New component:**
```vue
<template>
  <div class="slate-renderer">
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup>
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'

const props = defineProps({
  content: {
    type: String,
    required: true
  },
  extensions: {
    type: Array,
    default: () => []
  }
})

const editor = useEditor({
  extensions: [StarterKit, ...props.extensions],
  content: props.content,
  editable: false
})

watch(() => props.content, (newContent) => {
  if (editor.value && newContent !== editor.value.getHTML()) {
    editor.value.commands.setContent(newContent)
  }
})
</script>
```

**Benefits:**
- Simple, reusable read-only renderer
- Can be used for preview panes
- Lightweight (no editing overhead)

#### 3. Toolbar Component (Optional)

**Current:** `components/FloatingToolbar.vue`

**Extracted version:**
```
packages/editor/src/components/Toolbar.vue
```

**Make configurable:**
```vue
<Toolbar
  :editor="editor"
  :items="customToolbarItems"
  :position="'floating' | 'fixed' | 'inline'"
/>
```

### Composables to Extract

#### useEditor Composable

**New file:** `packages/editor/src/composables/useEditor.ts`

```typescript
export interface EditorOptions {
  content?: string
  placeholder?: string
  extensions?: Extension[]
  onUpdate?: (content: string) => void
  onSave?: (content: string) => void
  autosave?: boolean
  autosaveDelay?: number
}

export function useSlateEditor(options: EditorOptions) {
  const editor = useEditor({
    content: options.content,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Placeholder.configure({
        placeholder: options.placeholder
      }),
      Image,
      Link,
      TaskList,
      TaskItem.configure({ nested: true }),
      ...(options.extensions || [])
    ],
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      options.onUpdate?.(html)

      if (options.autosave) {
        // Trigger autosave with debounce
        triggerAutosave(html)
      }
    }
  })

  // Auto-save logic
  let saveTimeout: NodeJS.Timeout | null = null
  const triggerAutosave = (content: string) => {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      options.onSave?.(content)
    }, options.autosaveDelay || 1500)
  }

  // Keyboard shortcuts
  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
    if (saveTimeout) clearTimeout(saveTimeout)
    editor.value?.destroy()
  })

  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      options.onSave?.(editor.value?.getHTML() || '')
    }
  }

  return {
    editor,
    getHTML: () => editor.value?.getHTML(),
    setContent: (content: string) => editor.value?.commands.setContent(content),
    focus: () => editor.value?.commands.focus(),
    clear: () => editor.value?.commands.clearContent()
  }
}
```

#### Storage Interface

**New file:** `packages/editor/src/composables/useStorage.ts`

```typescript
export interface StorageAdapter {
  save(key: string, content: string): Promise<void>
  load(key: string): Promise<string | null>
  delete(key: string): Promise<void>
  list(): Promise<Array<{ key: string; name: string }>>
}

export function createLocalForageAdapter(): StorageAdapter {
  // IndexedDB implementation (for web)
  return {
    async save(key, content) {
      await localforage.setItem(key, content)
    },
    async load(key) {
      return await localforage.getItem(key)
    },
    async delete(key) {
      await localforage.removeItem(key)
    },
    async list() {
      const keys = await localforage.keys()
      return keys.map(key => ({ key, name: key }))
    }
  }
}

export function createMemoryAdapter(): StorageAdapter {
  // In-memory implementation (for testing)
  const storage = new Map<string, string>()

  return {
    async save(key, content) {
      storage.set(key, content)
    },
    async load(key) {
      return storage.get(key) || null
    },
    async delete(key) {
      storage.delete(key)
    },
    async list() {
      return Array.from(storage.keys()).map(key => ({ key, name: key }))
    }
  }
}
```

### Styles Extraction

#### Current Styling Approach

**Problem:** Tailwind CSS requires build-time processing

**Solution Options:**

##### Option A: Extract Compiled CSS (Simplest)

1. Build current Nuxt app
2. Extract all `.ProseMirror` styles from compiled CSS
3. Save as `packages/editor/src/styles/editor.css`
4. Include as static file

**Command:**
```bash
npm run build
# Extract ProseMirror styles from .nuxt/dist/
# Save to packages/editor/src/styles/editor.css
```

##### Option B: Convert to Vanilla CSS (Best for Themes)

**New file:** `packages/editor/src/styles/editor.css`

```css
/* Base Editor Styles */
.slate-editor {
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
  color: var(--slate-text, #374151);
  background: var(--slate-bg, #ffffff);
}

.ProseMirror {
  min-height: 100%;
  outline: none;
  padding: 2rem;
}

/* Placeholder */
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--slate-placeholder, #adb5bd);
  pointer-events: none;
  height: 0;
}

/* Headings */
.ProseMirror h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--slate-heading, #111827);
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--slate-heading, #1f2937);
}

.ProseMirror h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--slate-heading, #1f2937);
}

/* Paragraphs */
.ProseMirror p {
  margin-bottom: 1rem;
  line-height: 1.7;
  color: var(--slate-text, #374151);
  font-size: 1.05rem;
}

/* Lists */
.ProseMirror ul {
  list-style-type: disc;
  padding-left: 1.25rem;
  margin-bottom: 1rem;
  color: var(--slate-text, #374151);
}

.ProseMirror ol {
  list-style-type: decimal;
  padding-left: 1.25rem;
  margin-bottom: 1rem;
  color: var(--slate-text, #374151);
}

/* Task Lists */
.ProseMirror ul[data-type="taskList"] {
  list-style: none;
  padding: 0;
  margin-bottom: 1rem;
}

.ProseMirror ul[data-type="taskList"] li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.ProseMirror ul[data-type="taskList"] input[type="checkbox"] {
  height: 18px;
  width: 18px;
  margin-top: 3px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid var(--slate-border, #d1d5db);
}

/* Code */
.ProseMirror code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
  background: var(--slate-code-bg, rgba(241, 245, 249, 0.7));
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: var(--slate-code-text, #334155);
  border: 1px solid var(--slate-code-border, rgba(226, 232, 240, 0.5));
}

.ProseMirror pre {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  background: var(--slate-code-block-bg, #f8fafc);
  padding: 1rem;
  border-radius: 0 0.375rem 0.375rem 0;
  margin: 1rem 0;
  font-size: 13px;
  color: var(--slate-code-block-text, #334155);
  border-left: 4px solid var(--slate-code-block-border, #e2e8f0);
  overflow-x: auto;
}

/* Blockquotes */
.ProseMirror blockquote {
  border-left: 4px solid var(--slate-quote-border, #fde68a);
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  color: var(--slate-quote-text, #92400e);
  background: var(--slate-quote-bg, rgba(254, 243, 199, 0.5));
  border-radius: 0 0.375rem 0.375rem 0;
}

/* Images */
.ProseMirror img {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
  border-radius: 0.375rem;
}

/* Links */
.ProseMirror a {
  color: var(--slate-link, #2563eb);
  text-decoration: underline;
  cursor: pointer;
}

.ProseMirror a:hover {
  color: var(--slate-link-hover, #1d4ed8);
}

/* HR */
.ProseMirror hr {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid var(--slate-divider, #e5e7eb);
}
```

**CSS Variables for Theming:**
```css
/* Light Theme (default) */
:root {
  --slate-bg: #ffffff;
  --slate-text: #374151;
  --slate-heading: #111827;
  --slate-placeholder: #9ca3af;
  --slate-border: #d1d5db;
  --slate-code-bg: rgba(241, 245, 249, 0.7);
  --slate-code-text: #334155;
  --slate-code-border: rgba(226, 232, 240, 0.5);
  --slate-code-block-bg: #f8fafc;
  --slate-code-block-text: #334155;
  --slate-code-block-border: #e2e8f0;
  --slate-quote-bg: rgba(254, 243, 199, 0.5);
  --slate-quote-text: #92400e;
  --slate-quote-border: #fde68a;
  --slate-link: #2563eb;
  --slate-link-hover: #1d4ed8;
  --slate-divider: #e5e7eb;
}

/* Dark Theme */
[data-theme="dark"] {
  --slate-bg: #1e1e1e;
  --slate-text: #e5e7eb;
  --slate-heading: #f9fafb;
  --slate-placeholder: #6b7280;
  --slate-border: #374151;
  --slate-code-bg: rgba(55, 65, 81, 0.5);
  --slate-code-text: #e5e7eb;
  --slate-code-border: rgba(75, 85, 99, 0.5);
  --slate-code-block-bg: #374151;
  --slate-code-block-text: #e5e7eb;
  --slate-code-block-border: #4b5563;
  --slate-quote-bg: rgba(59, 130, 246, 0.1);
  --slate-quote-text: #93c5fd;
  --slate-quote-border: #3b82f6;
  --slate-link: #60a5fa;
  --slate-link-hover: #93c5fd;
  --slate-divider: #374151;
}
```

**Benefits of CSS Variables:**
- ✅ Easy theme switching
- ✅ VSCode theme integration
- ✅ No runtime overhead
- ✅ Standard CSS

### Markdown Utilities Extraction

**New file:** `packages/editor/src/utils/markdown.ts`

```typescript
import TurndownService from 'turndown'

export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  })

  return turndown.turndown(html)
}

export function markdownToHtml(markdown: string): string {
  // Use the existing formatTipTapHtml logic from server/utils/formats.ts
  // Or use a lightweight markdown parser like marked.js
  return formatTipTapHtml(markdown)
}

export function exportAsMarkdown(content: string, filename: string) {
  const markdown = htmlToMarkdown(content)
  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

## Package Structure

### packages/editor/package.json

```json
{
  "name": "@slate-editor/core",
  "version": "1.0.0",
  "description": "Standalone markdown editor based on TipTap",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./styles": "./dist/editor.css"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "dev": "vite",
    "build": "vite build && tsc --emitDeclarationOnly",
    "preview": "vite preview"
  },
  "peerDependencies": {
    "vue": "^3.5.0"
  },
  "dependencies": {
    "@tiptap/core": "^2.11.5",
    "@tiptap/pm": "^2.11.5",
    "@tiptap/vue-3": "^2.11.5",
    "@tiptap/starter-kit": "^2.11.5",
    "@tiptap/extension-placeholder": "^2.11.5",
    "@tiptap/extension-image": "^2.11.5",
    "@tiptap/extension-link": "^2.11.5",
    "@tiptap/extension-task-list": "^2.11.5",
    "@tiptap/extension-task-item": "^2.11.5",
    "turndown": "^7.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "keywords": [
    "markdown",
    "editor",
    "tiptap",
    "wysiwyg",
    "vue"
  ]
}
```

### packages/editor/src/index.ts

```typescript
// Components
export { default as SlateEditor } from './components/Editor.vue'
export { default as SlateRenderer } from './components/Renderer.vue'
export { default as SlateToolbar } from './components/Toolbar.vue'

// Composables
export { useSlateEditor } from './composables/useEditor'
export type { EditorOptions } from './composables/useEditor'

// Storage adapters
export {
  createLocalForageAdapter,
  createMemoryAdapter
} from './composables/useStorage'
export type { StorageAdapter } from './composables/useStorage'

// Utilities
export {
  htmlToMarkdown,
  markdownToHtml,
  exportAsMarkdown
} from './utils/markdown'

// Re-export TipTap types for convenience
export type { Editor } from '@tiptap/core'
export { useEditor, EditorContent } from '@tiptap/vue-3'
```

## Migration Path

### Phase 1: Create Monorepo Structure
1. ✅ Create `packages/` directory
2. ✅ Move current app to `packages/web-app/`
3. ✅ Create `packages/editor/` skeleton
4. ✅ Setup workspace (pnpm workspaces or npm workspaces)

### Phase 2: Extract Core Editor
1. ✅ Copy `MarkdownEditor.vue` to `packages/editor/src/components/Editor.vue`
2. ✅ Remove Nuxt-specific code
3. ✅ Replace dependencies with interfaces
4. ✅ Extract styles to CSS file
5. ✅ Create composables
6. ✅ Test in isolation

### Phase 3: Extract Renderer
1. ✅ Create `Renderer.vue` component
2. ✅ Test with sample content
3. ✅ Ensure read-only mode works

### Phase 4: Create VSCode Extension
1. ✅ Scaffold extension with `yo code`
2. ✅ Integrate editor package
3. ✅ Implement VSCode storage adapter
4. ✅ Test with markdown files

### Phase 5: Polish & Publish
1. ✅ Add documentation
2. ✅ Create examples
3. ✅ Publish to npm
4. ✅ Update web app to use package

## Testing Strategy

### Unit Tests
```typescript
describe('SlateEditor', () => {
  it('renders with initial content', () => {
    // Test mounting with content
  })

  it('emits update on content change', () => {
    // Test v-model binding
  })

  it('saves on Cmd+S', () => {
    // Test keyboard shortcut
  })
})
```

### Integration Tests
```typescript
describe('Storage Integration', () => {
  it('saves and loads content', async () => {
    const storage = createMemoryAdapter()
    // Test save/load cycle
  })
})
```

### E2E Tests (VSCode Extension)
```typescript
describe('VSCode Extension', () => {
  it('opens markdown file in editor', () => {
    // Test file opening
  })

  it('saves changes to file system', () => {
    // Test file saving
  })
})
```

## Next Steps

See:
- `vscode-plugin-design.md` for VSCode-specific implementation
- `implementation-roadmap.md` for step-by-step execution plan
