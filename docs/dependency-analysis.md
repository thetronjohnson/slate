# Dependency Analysis for Standalone Editor/Renderer Extraction

## Overview

This document analyzes all dependencies required to extract the Slate editor and renderer as standalone components suitable for a VSCode extension.

## Core Dependencies (Required)

### 1. TipTap Ecosystem

**Essential packages:**
```json
{
  "@tiptap/core": "^2.11.5",           // Core editor
  "@tiptap/pm": "^2.11.5",             // ProseMirror dependencies
  "@tiptap/vue-3": "^2.11.5",          // Vue 3 integration
  "@tiptap/starter-kit": "^2.11.5"     // Basic extensions bundle
}
```

**Individual extensions (if not using StarterKit):**
```json
{
  "@tiptap/extension-document": "^2.11.5",
  "@tiptap/extension-paragraph": "^2.11.5",
  "@tiptap/extension-text": "^2.11.5",
  "@tiptap/extension-heading": "^2.11.5",
  "@tiptap/extension-bold": "^2.11.5",
  "@tiptap/extension-italic": "^2.11.5",
  "@tiptap/extension-strike": "^2.11.5",
  "@tiptap/extension-code": "^2.11.5",
  "@tiptap/extension-code-block": "^2.11.5",
  "@tiptap/extension-bullet-list": "^2.11.5",
  "@tiptap/extension-ordered-list": "^2.11.5",
  "@tiptap/extension-list-item": "^2.11.5",
  "@tiptap/extension-blockquote": "^2.11.5",
  "@tiptap/extension-horizontal-rule": "^2.11.5",
  "@tiptap/extension-hard-break": "^2.11.5",
  "@tiptap/extension-history": "^2.11.5"
}
```

**Additional used extensions:**
```json
{
  "@tiptap/extension-placeholder": "^2.11.5",  // Placeholder text
  "@tiptap/extension-image": "^2.11.5",        // Image support
  "@tiptap/extension-link": "^2.11.5",         // Link support
  "@tiptap/extension-task-list": "^2.11.5",    // Task lists
  "@tiptap/extension-task-item": "^2.11.5"     // Task items
}
```

**Bundle size estimate:** ~180-220KB minified + gzipped

### 2. Vue 3 Runtime

**Required for TipTap Vue integration:**
```json
{
  "vue": "^3.5.13"
}
```

**Note:** VSCode webviews support Vue, but we may want to consider vanilla JS version for smaller bundle.

### 3. Storage Layer

**Current:** `localforage` (IndexedDB wrapper)
```json
{
  "localforage": "^1.10.0"  // 10KB gzipped
}
```

**Alternatives for VSCode:**
- VSCode's native storage API (`vscode.workspace.fs`)
- VSCode's Memento API for key-value storage
- **Recommendation:** Use VSCode native APIs instead

## Optional Dependencies (Feature-Dependent)

### 4. Icon System

**Current:** Iconify Vue
```json
{
  "@iconify/vue": "^4.3.0"  // ~15KB + icons
}
```

**VSCode Alternative:**
- Use VSCode's Codicons
- Inline SVGs
- **Recommendation:** Switch to Codicons for consistency

### 5. Composition Utilities

**Current:** VueUse
```json
{
  "@vueuse/core": "^13.0.0"  // Only useEventListener is used
}
```

**Can be replaced with:** Native Vue 3 composition API
- `useEventListener` → `onMounted(() => window.addEventListener(...))`

### 6. Markdown Conversion

**Current:** Turndown (HTML → Markdown)
```json
{
  "turndown": "^7.2.0"  // 8KB gzipped
}
```

**Usage:** Export to markdown format
**Keep:** Yes, useful for markdown export feature

### 7. PDF Export

**Current:**
```json
{
  "html2pdf.js": "^0.10.3",  // 200KB+ (heavy)
  "jspdf": "^3.0.1"          // Included in html2pdf
}
```

**Recommendation:**
- **Remove** for initial VSCode version (heavy)
- Users can save HTML and convert externally
- Or implement as optional feature later

## Nuxt/Framework-Specific Dependencies (Remove)

### 8. Nuxt Modules (Not Needed)
```json
{
  "@nuxtjs/supabase": "^1.5.0",        // ❌ Remove
  "@nuxtjs/tailwindcss": "^6.13.2",    // ❌ Remove
  "@nuxtjs/google-fonts": "^3.2.0",    // ❌ Remove
  "nuxt": "^4.1.2",                    // ❌ Remove
  "vue-router": "^4.5.0"               // ❌ Remove
}
```

### 9. Backend Services (Not Needed)
```json
{
  "openai": "^4.89.0",       // ❌ Remove (or make optional)
  "posthog-js": "^1.233.1"   // ❌ Remove
}
```

**Note:** AI features could be re-implemented using VSCode's AI APIs or GitHub Copilot API

## Styling Dependencies

### 10. Tailwind CSS

**Current:**
```json
{
  "@tailwindcss/typography": "^0.5.16"  // Prose styles
}
```

**Challenge:** Tailwind requires build-time processing

**Options:**
1. **Extract compiled CSS** - Generate final CSS once, include as static file
2. **Convert to vanilla CSS** - Rewrite styles as standard CSS
3. **Use CSS-in-JS** - Inline styles in components
4. **Use VSCode webview styles** - Adapt to VSCode's theme system

**Recommendation:** Extract compiled CSS or convert to vanilla CSS that respects VSCode themes

## Size Analysis

### Minimal Editor Bundle
```
Core:
@tiptap/core              ~80KB
@tiptap/pm               ~60KB
@tiptap/vue-3            ~10KB
@tiptap/starter-kit      ~40KB
vue runtime              ~50KB
                         ------
Total:                   ~240KB gzipped

Optional:
turndown                  ~8KB
Icons (inline SVG)        ~5KB
Styles (extracted CSS)   ~20KB
                         ------
Grand Total:            ~273KB gzipped
```

### Current Full Application
```
All of above            ~240KB
Nuxt runtime            ~150KB
Supabase client         ~100KB
OpenAI client            ~50KB
html2pdf.js             ~200KB
PostHog                  ~80KB
Other deps               ~50KB
                        -------
Total:                  ~870KB+ gzipped
```

**Reduction:** ~70% smaller (273KB vs 870KB)

## Dependency Replacement Strategy

| Current Dependency | VSCode Alternative | Action |
|-------------------|-------------------|--------|
| `localforage` | `vscode.workspace.fs` + Memento | Replace |
| `@iconify/vue` | VSCode Codicons | Replace |
| `@vueuse/core` | Native Vue 3 APIs | Replace |
| `@nuxtjs/tailwindcss` | Extracted CSS | Convert |
| `openai` | VSCode AI APIs (optional) | Replace/Remove |
| `posthog-js` | VSCode telemetry API | Replace/Remove |
| `html2pdf.js` | N/A | Remove (optional later) |
| `turndown` | Keep as-is | Keep |
| TipTap packages | Keep as-is | Keep |
| `vue` | Keep as-is | Keep |

## Critical Dependencies for Standalone Version

**Absolutely Required (Must Keep):**
1. ✅ All TipTap packages (`@tiptap/*`)
2. ✅ Vue 3 runtime
3. ✅ Turndown (for markdown export)

**Nice to Have (Optional):**
4. ⚠️ PDF export (heavy, can add later)
5. ⚠️ AI integration (can use VSCode APIs)

**Must Remove/Replace:**
6. ❌ Nuxt framework
7. ❌ Supabase client
8. ❌ PostHog analytics
9. ❌ Tailwind build process (use compiled CSS)
10. ❌ VueUse (use native APIs)

## VSCode-Specific Considerations

### Webview Constraints
- **CSP (Content Security Policy):** Strict inline script/style restrictions
- **Solution:** Use nonces, external stylesheets, proper CSP directives

### Communication Patterns
- **Editor ↔ Extension:** Use `vscode.postMessage()` and `window.addEventListener('message')`
- **File watching:** Use `vscode.workspace.createFileSystemWatcher()`

### Theme Integration
- **Access VSCode theme colors:** `vscode.window.activeColorTheme`
- **CSS variables:** Use VSCode's color token system
- **Dark/light mode:** Automatically sync with VSCode theme

### Storage Options
1. **Workspace storage:** `context.storageUri` (workspace-specific)
2. **Global storage:** `context.globalStorageUri` (user-wide)
3. **Memento API:** `context.workspaceState` / `context.globalState`
4. **File system:** Direct markdown file editing

**Recommendation:** Direct file system editing with optional metadata in Memento

## Build Configuration Changes

### Current (Nuxt)
```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase'],
  // ...
})
```

### Standalone (Vite + Vue)
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: './src/editor.js',
      name: 'SlateEditor',
      fileName: 'slate-editor'
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' }
      }
    }
  }
})
```

### VSCode Extension (esbuild/webpack)
```javascript
// webpack.config.js (for extension)
module.exports = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  }
}

// webpack.config.webview.js (for editor UI)
module.exports = {
  target: 'web',
  entry: './src/webview/editor.js',
  output: {
    filename: 'editor.js',
    path: path.resolve(__dirname, 'dist/webview')
  }
}
```

## Recommended Minimal Package.json

```json
{
  "name": "slate-editor-standalone",
  "version": "1.0.0",
  "type": "module",
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
    "vue": "^3.5.13",
    "turndown": "^7.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

**Total dependencies:** 11 (down from 30+)
**Estimated bundle size:** ~273KB gzipped (down from ~870KB)

## Next Steps

1. Create proof-of-concept with minimal dependencies
2. Test TipTap in VSCode webview environment
3. Implement VSCode storage adapter
4. Convert/extract Tailwind styles to vanilla CSS
5. Create VSCode extension scaffold

See `extraction-strategy.md` for detailed implementation approach.
