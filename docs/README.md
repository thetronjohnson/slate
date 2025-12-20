# Slate Editor - Technical Documentation

This folder contains comprehensive documentation for extracting the Slate editor and renderer as a standalone VSCode extension.

## Overview

The Slate editor is currently built as a Nuxt 4 web application using TipTap/ProseMirror for rich text editing. This documentation outlines the strategy to extract the core editor components and create a VSCode extension for WYSIWYG markdown editing.

## Documentation Index

### 1. [Architecture Overview](./architecture-overview.md)
**Purpose:** Understand the current system architecture

**Contents:**
- Technology stack (Nuxt 4, Vue 3, TipTap)
- Core components breakdown (MarkdownEditor, Renderer, etc.)
- Storage architecture (IndexedDB, Supabase)
- Markdown processing pipeline
- Data flow diagrams

**Read this first** to understand how the current system works.

---

### 2. [Dependency Analysis](./dependency-analysis.md)
**Purpose:** Identify what dependencies are needed for standalone extraction

**Contents:**
- Core dependencies breakdown (TipTap, Vue, etc.)
- Size analysis (~273KB for standalone vs ~870KB current)
- Dependency replacement strategy
- Minimal package.json
- VSCode-specific considerations

**Use this** to understand what needs to be kept, removed, or replaced.

---

### 3. [Extraction Strategy](./extraction-strategy.md)
**Purpose:** How to extract editor/renderer as standalone components

**Contents:**
- Monorepo vs separate repo approach
- Component extraction plan
- Storage adapter interface design
- Styles extraction (Tailwind → vanilla CSS)
- Package structure
- Migration path (5 phases)

**Follow this** for the technical approach to extracting components.

---

### 4. [VSCode Extension Quick Reference](./vscode-extension-quick-reference.md)
**Purpose:** Quick reference guide for VSCode extension development

**Contents:**
- Custom Editor API overview
- File structure for extensions
- Core implementation examples
- Communication patterns (extension ↔ webview)
- Storage options in VSCode
- Theme integration
- Build & bundle configuration
- Testing & publishing
- Best practices & common pitfalls

**Reference this** when working with VSCode APIs.

---

### 5. [VSCode Plugin Design](./vscode-plugin-design.md)
**Purpose:** Detailed design for the Slate VSCode extension

**Contents:**
- Goals (primary & secondary)
- Architecture diagrams
- Component design (Provider, Webview, Storage)
- Data flow (load, edit, save, external changes)
- Content format strategy (Markdown ↔ HTML)
- Theme integration
- Configuration & commands
- Performance optimizations
- Error handling
- Roadmap (Phase 1-3)

**Use this** for design decisions and architecture.

---

### 6. [Implementation Roadmap](./implementation-roadmap.md)
**Purpose:** Step-by-step implementation guide

**Contents:**
- Phase 1: Setup & Preparation (Week 1)
- Phase 2: Extract Core Editor (Week 2)
- Phase 3: Create VSCode Extension (Week 3-4)
- Phase 4: Polish & Features (Week 5)
- Phase 5: Testing & Documentation (Week 6)
- Phase 6: Publishing (Week 6)
- Detailed tasks with code examples
- Deliverables for each phase
- Success metrics
- Risk mitigation

**Follow this** as the execution plan.

---

## Quick Start

### For Understanding the Current System
1. Read [Architecture Overview](./architecture-overview.md)
2. Review [Dependency Analysis](./dependency-analysis.md)

### For Implementation
1. Review [Extraction Strategy](./extraction-strategy.md)
2. Reference [VSCode Extension Quick Reference](./vscode-extension-quick-reference.md)
3. Follow [Implementation Roadmap](./implementation-roadmap.md)

### For Design Decisions
1. Read [VSCode Plugin Design](./vscode-plugin-design.md)
2. Cross-reference with [Extraction Strategy](./extraction-strategy.md)

## Key Findings

### Current System
- **Framework:** Nuxt 4 (Vue 3) with TipTap 2.11.5
- **Editor:** 535-line MarkdownEditor.vue component
- **Renderer:** 108-line read-only viewer
- **Storage:** IndexedDB (local) + Supabase (cloud)
- **Bundle Size:** ~870KB gzipped

### Standalone System
- **Components:** Extracted editor + renderer
- **Dependencies:** Minimal (TipTap + Vue + turndown)
- **Bundle Size:** ~273KB gzipped (68% reduction)
- **VSCode Integration:** CustomTextEditorProvider API

### VSCode Extension
- **Type:** CustomTextEditorProvider (text-based)
- **File Format:** Markdown (bidirectional conversion)
- **Theme:** Respects VSCode light/dark themes
- **Features:** WYSIWYG editing, toolbar, auto-save, export

## Architecture Summary

```
┌──────────────────────────────────────────┐
│         Current Web App                  │
│  ┌────────────────────────────────────┐  │
│  │  Nuxt 4 Application                │  │
│  │  - MarkdownEditor.vue (editor)     │  │
│  │  - [id].vue (renderer)             │  │
│  │  - IndexedDB storage               │  │
│  │  - Supabase backend                │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
                    ↓
            EXTRACTION
                    ↓
┌──────────────────────────────────────────┐
│       Standalone Editor Package          │
│  ┌────────────────────────────────────┐  │
│  │  @slate-editor/core                │  │
│  │  - Editor.vue (extracted)          │  │
│  │  - Renderer.vue (extracted)        │  │
│  │  - Storage interface               │  │
│  │  - Markdown utils                  │  │
│  │  - Vanilla CSS styles              │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
                    ↓
            INTEGRATION
                    ↓
┌──────────────────────────────────────────┐
│        VSCode Extension                  │
│  ┌────────────────────────────────────┐  │
│  │  Extension Host                    │  │
│  │  - SlateEditorProvider             │  │
│  │  - VSCodeStorageAdapter            │  │
│  │  - Commands & configuration        │  │
│  └────────────────────────────────────┘  │
│                  ↕                       │
│  ┌────────────────────────────────────┐  │
│  │  Webview (Vue App)                 │  │
│  │  - Uses @slate-editor/core         │  │
│  │  - Markdown ↔ HTML conversion      │  │
│  │  - Theme integration               │  │
│  └────────────────────────────────────┘  │
│                  ↕                       │
│  ┌────────────────────────────────────┐  │
│  │  TextDocument (.md file)           │  │
│  │  - Direct file system access       │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## Timeline

**Total Duration:** 6 weeks (for MVP)

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | Week 1 | Setup monorepo, create package structure |
| Phase 2 | Week 2 | Extract editor components, styles, utilities |
| Phase 3 | Week 3-4 | Build VSCode extension, integrate editor |
| Phase 4 | Week 5 | Add features (toolbar, images, export) |
| Phase 5 | Week 6 | Testing, documentation, polish |
| Phase 6 | Week 6 | Package and publish to marketplace |

## Success Criteria

### Technical
- ✅ Editor works standalone without Nuxt
- ✅ VSCode extension installs without errors
- ✅ Markdown files can be edited and saved
- ✅ No data loss during conversion
- ✅ <100ms typing latency
- ✅ Bundle size <10MB

### User Experience
- ✅ WYSIWYG editing feels natural
- ✅ Theme matches VSCode
- ✅ Keyboard shortcuts work
- ✅ Can switch back to text editor
- ✅ Works on Mac, Windows, Linux

### Business
- ✅ Published to VSCode marketplace
- ✅ 100+ installs in week 1
- ✅ 1,000+ installs in month 1
- ✅ >4.0 star rating
- ✅ <5 critical bugs

## Technology Stack

### Current Stack
```
Frontend:    Nuxt 4, Vue 3, TipTap 2.11.5
Styling:     Tailwind CSS
Storage:     IndexedDB (localforage), Supabase
AI:          OpenAI GPT-4o-mini
Analytics:   PostHog
Export:      turndown, html2pdf.js
```

### Standalone Stack
```
Core:        Vue 3, TipTap 2.11.5
Styling:     Vanilla CSS with variables
Storage:     Interface-based (adapters)
Conversion:  turndown, custom markdown parser
Bundle:      Vite
```

### VSCode Extension Stack
```
Extension:   TypeScript, VSCode API
Webview:     Vue 3, @slate-editor/core
Build:       webpack/esbuild
Storage:     TextDocument + Memento API
Theme:       VSCode CSS variables
```

## Key Design Decisions

### 1. Content Format
**Decision:** Use bidirectional Markdown ↔ HTML conversion
- Files stored as markdown (readable)
- Editor uses HTML (TipTap native)
- Convert on load/save using turndown + custom parser

### 2. Storage Approach
**Decision:** Direct file system editing via TextDocument
- No intermediate storage layer
- VSCode handles save/undo/backup
- Metadata in workspace state if needed

### 3. Theme Integration
**Decision:** Use CSS variables mapped to VSCode theme
- Automatic light/dark mode
- Respects user's theme choice
- No runtime overhead

### 4. Bundle Strategy
**Decision:** Separate bundles for extension and webview
- Extension bundle: Node.js target, commonjs
- Webview bundle: Browser target, IIFE
- Shared code via monorepo

### 5. Monorepo Structure
**Decision:** Three packages in workspace
- `packages/editor` - Standalone editor
- `packages/vscode-extension` - VSCode plugin
- `packages/web-app` - Original Nuxt app

## Dependencies

### Critical (Must Keep)
- All TipTap packages (~220KB)
- Vue 3 runtime (~50KB)
- turndown (~8KB)

### Replace for VSCode
- `localforage` → VSCode storage APIs
- `@iconify/vue` → Inline SVGs or Codicons
- `@vueuse/core` → Native Vue APIs
- Tailwind → Vanilla CSS

### Remove for Standalone
- Nuxt framework
- Supabase client
- OpenAI client
- PostHog
- html2pdf.js (optional later)

## Resources

### Official Documentation
- [VSCode Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [VSCode Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [TipTap Documentation](https://tiptap.dev/)
- [Vue 3 Documentation](https://vuejs.org/)

### Tools
- [Yeoman VSCode Generator](https://code.visualstudio.com/api/get-started/your-first-extension)
- [vsce - Publishing Tool](https://github.com/microsoft/vscode-vsce)
- [Vite](https://vitejs.dev/)

### Examples
- [vscode-markdown-editor](https://github.com/zaaack/vscode-markdown-editor) - Example WYSIWYG markdown editor

## Contributing

See individual documents for detailed technical information. This is a living documentation set that should be updated as implementation progresses.

### Document Owners
- **Architecture Overview:** System architecture team
- **Dependency Analysis:** DevOps team
- **Extraction Strategy:** Core development team
- **VSCode Quick Reference:** VSCode team
- **Plugin Design:** Design team
- **Implementation Roadmap:** Project manager

## Questions?

For questions about:
- **Current architecture** → See [Architecture Overview](./architecture-overview.md)
- **What to extract** → See [Dependency Analysis](./dependency-analysis.md)
- **How to extract** → See [Extraction Strategy](./extraction-strategy.md)
- **VSCode APIs** → See [VSCode Quick Reference](./vscode-extension-quick-reference.md)
- **Design decisions** → See [VSCode Plugin Design](./vscode-plugin-design.md)
- **Implementation steps** → See [Implementation Roadmap](./implementation-roadmap.md)

---

**Last Updated:** 2025-01-20
**Version:** 1.0
**Status:** Ready for implementation
