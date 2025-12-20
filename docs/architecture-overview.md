# Slate Editor - Architecture Overview

## Executive Summary

Slate is a modern markdown editor built on **Nuxt 4 (Vue 3)** with **TipTap/ProseMirror** as the core editing engine. The application features a local-first architecture with optional cloud publishing capabilities.

## Technology Stack

### Frontend Framework
- **Nuxt 4** (Vue 3 with Composition API)
- **Tailwind CSS** for styling
- **@vueuse/core** for composition utilities

### Editor Engine
- **TipTap 2.11.5** - Vue 3 wrapper for ProseMirror
- **ProseMirror** - Underlying editor framework (included via @tiptap/pm)
- **11+ TipTap Extensions** for rich text features

### Key Libraries
- **localforage** - IndexedDB wrapper for local storage
- **Iconify Vue** - Icon system
- **turndown** - HTML to Markdown conversion
- **html2pdf.js + jspdf** - PDF export
- **OpenAI** - AI content generation
- **PostHog** - Analytics

### Backend
- **Nuxt Server API Routes** (TypeScript)
- **Supabase** (PostgreSQL + Auth)

## Core Components

### 1. MarkdownEditor.vue (535 lines)
**Purpose:** Main editing component with rich text capabilities

**Features:**
- TipTap/ProseMirror based WYSIWYG editor
- Text formatting (Bold, Italic, Strike, Code)
- Lists (Bullet, Ordered, Task lists with nesting)
- Headings (H1, H2, H3)
- Blockquotes and Code blocks
- Images and Links
- AI Integration via CommandPalette (Cmd+K)
- Auto-save with 1.5s debounce
- IndexedDB persistence
- Keyboard shortcuts (Cmd+K, Cmd+S, Cmd+A)

**Key Dependencies:**
```javascript
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Icon } from '@iconify/vue';
import { useStorage } from '../composables/useStorage';
import { useEventListener } from '@vueuse/core';
```

**Child Components:**
- `FloatingToolbar` - Context-aware formatting toolbar
- `CommandPalette` - AI assistant UI

**Data Flow:**
```
User Input → TipTap Editor
    ↓
editor.getHTML() → HTML string
    ↓
emit('update:modelValue', html)
    ↓
Auto-save (1.5s debounce)
    ↓
IndexedDB via useStorage()
```

### 2. pages/[id].vue (108 lines)
**Purpose:** Read-only public page renderer

**Features:**
- TipTap in `editable: false` mode
- Fetches content from Supabase via API
- SEO meta tags (OpenGraph, Twitter Cards)
- Page view tracking (PostHog)
- Responsive typography styling

**Key Dependencies:**
```javascript
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Icon } from '@iconify/vue'
import posthog from 'posthog-js'
```

**Data Flow:**
```
User visits /[pageId]
    ↓
Call /api/pages/[id]
    ↓
Fetch from Supabase
    ↓
editor.commands.setContent(html)
    ↓
Render read-only view
    ↓
Track analytics
```

### 3. FloatingToolbar.vue (137 lines)
**Purpose:** Context-aware formatting menu

**Features:**
- Appears on text selection
- Format, List, and Insert menu categories
- Active state indicators
- Positioned above selected text

### 4. CommandPalette.vue (300 lines)
**Purpose:** AI-powered editing assistant

**Features:**
- Modal UI for AI commands
- Predefined actions (Fix grammar, LinkedIn post, etc.)
- Custom prompts
- Selection-based or full-content editing
- Rate limiting for free users

## Storage Architecture

### Local Storage (IndexedDB via localforage)

**Three stores:**
1. `documents` - Page HTML content
2. `files` - File metadata (names, created/updated dates)
3. `settings` - User preferences

**Key Operations:**
```javascript
// Save document
storage.saveDocument(fileId, htmlContent)

// Load document
const content = await storage.getDocument(fileId)

// List files
const files = await storage.getItem('files')
```

### Cloud Storage (Supabase)

**pages table schema:**
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY,
  name TEXT,
  content TEXT,
  user_id UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## Markdown Processing Pipeline

### Input Formats
1. **Direct typing** in TipTap editor
2. **Paste HTML/Markdown** (auto-converted)
3. **AI generation** (returns formatted HTML)

### Internal Format: HTML
TipTap stores content as HTML with ProseMirror schema:
```html
<h1>Title</h1>
<p>Paragraph with <strong>bold</strong> and <em>italic</em></p>
<ul><li>Bullet</li></ul>
<pre><code>Code block</code></pre>
```

### AI Processing (server/utils/formats.ts)
```javascript
formatTipTapHtml(markdown) → HTML
```

**Conversion rules:**
- `# Heading` → `<h1>Heading</h1>`
- `**bold**` → `<strong>bold</strong>`
- `*italic*` → `<em>italic</em>`
- `- item` → `<ul><li>item</li></ul>`
- `` `code` `` → `<code>code</code>`
- And more...

### Export Formats

**Markdown Export:**
```
editor.getHTML() → turndown.turndown(html) → .md file
```

**PDF Export:**
```
editor.getHTML() → html2pdf.js → canvas → jsPDF → .pdf file
```

## Editor-Renderer Relationship

```
┌─────────────────────────────────────────────────────────┐
│                    EDITING MODE                         │
│  MarkdownEditor.vue (editable: true)                    │
│  - Full TipTap extensions                               │
│  - FloatingToolbar                                      │
│  - CommandPalette                                       │
│  - Auto-save to IndexedDB                               │
└─────────────────────────────────────────────────────────┘
                         │
                         │ Publish
                         ↓
                    Supabase API
                         ↓
┌─────────────────────────────────────────────────────────┐
│                   VIEWING MODE                          │
│  pages/[id].vue (editable: false)                       │
│  - TipTap StarterKit only                               │
│  - Read-only rendering                                  │
│  - SEO meta tags                                        │
│  - Analytics tracking                                   │
└─────────────────────────────────────────────────────────┘
```

## Key Architectural Patterns

### 1. Local-First Design
- All editing happens in IndexedDB
- No network required for editing
- Optional cloud publishing

### 2. Component Composition
- Editor is self-contained
- Communicates via v-model and events
- Minimal coupling to parent components

### 3. Extension-Based Architecture
- TipTap extensions for features
- Easy to add/remove capabilities
- Consistent API across extensions

### 4. Separation of Concerns
- Editor component handles editing
- Renderer component handles display
- Both share TipTap core but different configs

## Performance Characteristics

### Strengths
- **Fast local editing** - IndexedDB with debounced saves
- **Lightweight bundle** - TipTap is modular
- **Responsive UI** - Vue 3 reactivity

### Considerations
- **Initial load** - TipTap + extensions (~200KB gzipped)
- **Large documents** - ProseMirror scales well to 10,000+ nodes
- **IndexedDB limits** - Browser quota (typically 50-100MB+)

## Security Considerations

### Input Sanitization
- TipTap sanitizes HTML by default
- `formatTipTapHtml()` uses regex escaping
- No direct HTML injection allowed

### Authentication
- Supabase Auth for user verification
- JWT tokens for API access
- Row-level security policies

### Data Privacy
- Local-first keeps data client-side
- Published pages are public by default
- User controls what gets published

## Extensibility Points

### Adding New TipTap Extensions
```javascript
editor = useEditor({
  extensions: [
    StarterKit,
    CustomExtension.configure({ /* config */ })
  ]
})
```

### Custom Keyboard Shortcuts
```javascript
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
    // Custom action
  }
})
```

### Custom Styling
- Tailwind classes on `.ProseMirror`
- Custom CSS for extensions
- Theme support via CSS variables

## File Structure Summary

```
components/
├── MarkdownEditor.vue      # Main editor (535 lines)
├── FloatingToolbar.vue     # Context toolbar (137 lines)
├── CommandPalette.vue      # AI assistant (300 lines)
└── ...

pages/
├── index.vue               # Workspace UI (797 lines)
├── [id].vue                # Public renderer (108 lines)
└── ...

composables/
└── useStorage.ts           # IndexedDB wrapper

server/
├── api/
│   ├── ai.post.ts          # AI endpoint
│   └── pages/
│       ├── [id].ts         # Fetch page
│       ├── publish.ts      # Publish page
│       └── delete.ts       # Delete page
└── utils/
    └── formats.ts          # Markdown processing

package.json                # Dependencies
nuxt.config.ts              # Nuxt configuration
tailwind.config.js          # Tailwind setup
```

## Next Steps

See the following documents for extraction strategy:
- `dependency-analysis.md` - Detailed dependency breakdown
- `extraction-strategy.md` - How to extract as standalone
- `vscode-plugin-design.md` - VSCode integration design
- `implementation-roadmap.md` - Step-by-step plan
