# Implementation Roadmap - VSCode Slate Editor

## Overview

This roadmap outlines the step-by-step process to extract the Slate editor/renderer and create a VSCode extension. Estimated timeline: 4-6 weeks for MVP.

## Prerequisites

### Required Skills
- ✅ TypeScript
- ✅ Vue 3
- ✅ TipTap/ProseMirror
- ✅ VSCode Extension API
- ✅ Git

### Development Tools
```bash
# Node.js & npm
node --version  # v18+
npm --version   # v9+

# VSCode
code --version  # v1.85+

# Extension generator
npm install -g yo generator-code

# Extension packager
npm install -g @vscode/vsce
```

## Phase 1: Setup & Preparation (Week 1)

### 1.1 Create Monorepo Structure

```bash
cd /home/user/slate

# Create packages directory
mkdir -p packages

# Move existing app
git mv components pages server packages/web-app/
git mv app.vue nuxt.config.ts tailwind.config.js packages/web-app/

# Create workspace package.json
cat > package.json <<EOF
{
  "name": "slate-workspace",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev:web": "npm run dev -w packages/web-app",
    "dev:editor": "npm run dev -w packages/editor",
    "dev:vscode": "npm run dev -w packages/vscode-extension",
    "build:all": "npm run build --workspaces"
  }
}
EOF

# Initialize workspaces
npm install
```

**Deliverables:**
- ✅ Monorepo structure created
- ✅ Existing app moved to `packages/web-app/`
- ✅ Workspace configuration working

### 1.2 Create Editor Package Skeleton

```bash
cd packages
mkdir -p editor/src/{components,composables,styles,utils}

# Create package.json
cat > editor/package.json <<EOF
{
  "name": "@slate-editor/core",
  "version": "0.1.0",
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
  "scripts": {
    "dev": "vite",
    "build": "vite build && tsc --emitDeclarationOnly"
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
  }
}
EOF

npm install
```

**Deliverables:**
- ✅ Editor package structure
- ✅ Dependencies installed
- ✅ Build configuration

### 1.3 Setup Development Environment

```bash
# Install recommended VSCode extensions
code --install-extension Vue.volar
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode

# Create workspace settings
mkdir -p .vscode
cat > .vscode/settings.json <<EOF
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
EOF
```

**Deliverables:**
- ✅ VSCode configured
- ✅ Extensions installed
- ✅ Linting setup

## Phase 2: Extract Core Editor (Week 2)

### 2.1 Extract Styles

```bash
cd packages/editor/src/styles

# Create editor.css
touch editor.css
```

**Task:** Copy all `.ProseMirror` styles from `packages/web-app/components/MarkdownEditor.vue`

**Convert Tailwind to vanilla CSS:**
```css
/* Before (Tailwind) */
.ProseMirror h1 {
  @apply text-3xl font-bold mb-4 text-gray-900;
}

/* After (Vanilla CSS with variables) */
.ProseMirror h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--slate-heading, #111827);
}
```

**Create theme variables:**
```css
/* Light theme */
:root {
  --slate-bg: #ffffff;
  --slate-text: #374151;
  /* ... */
}

/* Dark theme */
[data-theme="dark"] {
  --slate-bg: #1e1e1e;
  --slate-text: #e5e7eb;
  /* ... */
}
```

**Deliverables:**
- ✅ `editor.css` with all styles
- ✅ CSS variables for theming
- ✅ No Tailwind dependencies

### 2.2 Create Storage Interface

```bash
# Create storage interface
touch packages/editor/src/composables/useStorage.ts
```

**Implement:**
```typescript
export interface StorageAdapter {
  save(key: string, content: string): Promise<void>;
  load(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  list(): Promise<Array<{ key: string; name: string }>>;
}

export function createLocalForageAdapter(): StorageAdapter {
  // Implementation using localforage
}

export function createMemoryAdapter(): StorageAdapter {
  // In-memory implementation for testing
}
```

**Deliverables:**
- ✅ StorageAdapter interface
- ✅ LocalForage adapter
- ✅ Memory adapter for tests

### 2.3 Extract Editor Component

```bash
touch packages/editor/src/components/Editor.vue
```

**Steps:**
1. Copy `packages/web-app/components/MarkdownEditor.vue`
2. Remove Nuxt-specific imports:
   - Remove `@iconify/vue` (use inline SVGs or slots)
   - Remove `@vueuse/core` (use native Vue APIs)
   - Remove `CommandPalette` (AI features - optional)
   - Remove `FloatingToolbar` (extract separately)
3. Replace `useStorage()` with interface prop:
   ```vue
   <script setup>
   const props = defineProps({
     storage: {
       type: Object as PropType<StorageAdapter>,
       required: true
     }
   })
   </script>
   ```
4. Make toolbar optional via slots:
   ```vue
   <template>
     <div class="slate-editor">
       <slot name="toolbar" :editor="editor"></slot>
       <EditorContent :editor="editor" />
     </div>
   </template>
   ```

**Deliverables:**
- ✅ Standalone `Editor.vue`
- ✅ No Nuxt dependencies
- ✅ Props-based configuration
- ✅ Works with storage interface

### 2.4 Extract Renderer Component

```bash
touch packages/editor/src/components/Renderer.vue
```

**Implementation:**
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

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style src="../styles/editor.css"></style>
```

**Deliverables:**
- ✅ Standalone `Renderer.vue`
- ✅ Read-only mode
- ✅ Reusable component

### 2.5 Create Markdown Utilities

```bash
touch packages/editor/src/utils/markdown.ts
```

**Implementation:**
```typescript
import TurndownService from 'turndown'

export function htmlToMarkdown(html: string): string {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  })
  return turndown.turndown(html)
}

// Copy from server/utils/formats.ts
export function markdownToHtml(markdown: string): string {
  // Implementation
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

**Deliverables:**
- ✅ `htmlToMarkdown()`
- ✅ `markdownToHtml()`
- ✅ `exportAsMarkdown()`

### 2.6 Create Package Entry Point

```bash
touch packages/editor/src/index.ts
```

**Implementation:**
```typescript
// Components
export { default as SlateEditor } from './components/Editor.vue'
export { default as SlateRenderer } from './components/Renderer.vue'

// Storage
export {
  createLocalForageAdapter,
  createMemoryAdapter
} from './composables/useStorage'
export type { StorageAdapter } from './composables/useStorage'

// Utils
export {
  htmlToMarkdown,
  markdownToHtml,
  exportAsMarkdown
} from './utils/markdown'

// Re-exports
export type { Editor } from '@tiptap/core'
export { useEditor, EditorContent } from '@tiptap/vue-3'
```

**Deliverables:**
- ✅ Clean public API
- ✅ Type exports
- ✅ Documentation

### 2.7 Test Editor Package

```bash
# Create test app
mkdir packages/editor-test
cd packages/editor-test

# Create simple HTML page that imports editor
```

**Test checklist:**
- ✅ Editor renders
- ✅ Can type and format text
- ✅ Markdown conversion works
- ✅ Styles apply correctly
- ✅ No console errors

**Deliverables:**
- ✅ Working editor package
- ✅ All tests passing

## Phase 3: Create VSCode Extension (Week 3-4)

### 3.1 Generate Extension Scaffold

```bash
cd packages

# Generate extension using Yeoman
yo code

# Choose:
# - New Extension (TypeScript)
# - Name: vscode-slate-editor
# - Identifier: slate-markdown-editor
# - Description: WYSIWYG markdown editor
# - Initialize git: No (already in monorepo)
# - Package manager: npm
```

**Deliverables:**
- ✅ Extension scaffold created
- ✅ Basic structure in place

### 3.2 Configure Extension Manifest

Edit `packages/vscode-extension/package.json`:

```json
{
  "name": "slate-markdown-editor",
  "displayName": "Slate Markdown Editor",
  "description": "WYSIWYG markdown editor powered by Slate",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onCustomEditor:slate.markdownEditor"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "customEditors": [
      {
        "viewType": "slate.markdownEditor",
        "displayName": "Slate Markdown Editor",
        "selector": [
          { "filenamePattern": "*.md" }
        ],
        "priority": "option"
      }
    ],
    "commands": [
      {
        "command": "slate.openAsText",
        "title": "Open as Text",
        "category": "Slate"
      }
    ]
  }
}
```

**Deliverables:**
- ✅ Manifest configured
- ✅ Custom editor registered
- ✅ Commands defined

### 3.3 Implement Extension Entry Point

Edit `packages/vscode-extension/src/extension.ts`:

```typescript
import * as vscode from 'vscode';
import { SlateEditorProvider } from './SlateEditorProvider';

export function activate(context: vscode.ExtensionContext) {
  // Register custom editor provider
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'slate.markdownEditor',
      new SlateEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('slate.openAsText', () => {
      vscode.commands.executeCommand('vscode.openWith',
        vscode.window.activeTextEditor?.document.uri,
        'default'
      );
    })
  );
}

export function deactivate() {}
```

**Deliverables:**
- ✅ Extension activates
- ✅ Provider registered
- ✅ Commands work

### 3.4 Implement Custom Editor Provider

Create `packages/vscode-extension/src/SlateEditorProvider.ts`:

```typescript
import * as vscode from 'vscode';

export class SlateEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Setup webview
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media')
      ]
    };

    // Set HTML
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Message handling
    webviewPanel.webview.onDidReceiveMessage(e => {
      switch (e.type) {
        case 'update':
          this.updateTextDocument(document, e.content);
          break;
        case 'save':
          document.save();
          break;
      }
    });

    // Document sync
    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        webviewPanel.webview.postMessage({
          type: 'externalUpdate',
          content: document.getText()
        });
      }
    });

    // Send initial content
    webviewPanel.webview.postMessage({
      type: 'init',
      content: document.getText()
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css')
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"
            content="default-src 'none';
                     style-src ${webview.cspSource} 'unsafe-inline';
                     script-src 'nonce-${nonce}';
                     img-src ${webview.cspSource} https: data:;">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>Slate Editor</title>
    </head>
    <body>
      <div id="app"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  private updateTextDocument(document: vscode.TextDocument, content: string) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      content
    );
    return vscode.workspace.applyEdit(edit);
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

**Deliverables:**
- ✅ Provider implementation
- ✅ Message handling
- ✅ Document sync

### 3.5 Build Webview Bundle

Create `packages/vscode-extension/src/webview/editor.ts`:

```typescript
import { createApp } from 'vue';
import { SlateEditor, markdownToHtml, htmlToMarkdown } from '@slate-editor/core';

declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

const app = createApp({
  components: { SlateEditor },
  data() {
    return {
      content: '',
      isDirty: false
    };
  },
  methods: {
    handleUpdate(html: string) {
      this.content = html;
      this.isDirty = true;

      // Convert to markdown and send to extension
      const markdown = htmlToMarkdown(html);

      // Debounce
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        vscode.postMessage({
          type: 'update',
          content: markdown
        });
        this.isDirty = false;
      }, 500);
    },

    handleSave() {
      vscode.postMessage({ type: 'save' });
    }
  },
  mounted() {
    // Listen for messages
    window.addEventListener('message', event => {
      const message = event.data;

      switch (message.type) {
        case 'init':
          // Convert markdown to HTML
          const html = markdownToHtml(message.content);
          this.content = html;
          break;

        case 'externalUpdate':
          if (!this.isDirty) {
            const html = markdownToHtml(message.content);
            this.content = html;
          }
          break;
      }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        this.handleSave();
      }
    });

    // Signal ready
    vscode.postMessage({ type: 'ready' });
  }
});

app.mount('#app');
```

**Build configuration** (`packages/vscode-extension/webpack.config.js`):

```javascript
const path = require('path');

module.exports = [
  // Extension bundle
  {
    target: 'node',
    entry: './src/extension.ts',
    output: {
      path: path.resolve(__dirname, 'out'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2'
    },
    externals: { vscode: 'commonjs vscode' },
    resolve: { extensions: ['.ts', '.js'] },
    module: {
      rules: [{ test: /\.ts$/, use: 'ts-loader' }]
    }
  },
  // Webview bundle
  {
    target: 'web',
    entry: './src/webview/editor.ts',
    output: {
      path: path.resolve(__dirname, 'media'),
      filename: 'editor.js'
    },
    resolve: {
      extensions: ['.ts', '.js', '.vue'],
      alias: {
        '@slate-editor/core': path.resolve(__dirname, '../editor/src')
      }
    },
    module: {
      rules: [
        { test: /\.vue$/, use: 'vue-loader' },
        { test: /\.ts$/, use: 'ts-loader' },
        { test: /\.css$/, use: ['style-loader', 'css-loader'] }
      ]
    }
  }
];
```

**Deliverables:**
- ✅ Webview entry point
- ✅ Build configuration
- ✅ Bundles compile

### 3.6 Copy Editor Styles

```bash
cp packages/editor/src/styles/editor.css packages/vscode-extension/media/
```

**Add VSCode theme integration:**

```css
/* At top of editor.css */
:root {
  --slate-bg: var(--vscode-editor-background, #ffffff);
  --slate-text: var(--vscode-editor-foreground, #374151);
  --slate-heading: var(--vscode-editorWidget-foreground, #111827);
  /* ... map all variables to VSCode theme */
}
```

**Deliverables:**
- ✅ Styles copied
- ✅ VSCode theme variables integrated

### 3.7 Test Extension

```bash
cd packages/vscode-extension

# Compile
npm run compile

# Open in VSCode
code .

# Press F5 to launch Extension Development Host
# Create test.md file
# Right-click > "Open With..." > "Slate Markdown Editor"
```

**Test checklist:**
- ✅ Extension activates
- ✅ Custom editor opens for .md files
- ✅ Can edit markdown
- ✅ Changes save to file
- ✅ External changes sync
- ✅ Cmd+S saves
- ✅ Theme respects VSCode settings

**Deliverables:**
- ✅ Working VSCode extension
- ✅ All basic features functional

## Phase 4: Polish & Features (Week 5)

### 4.1 Add Toolbar

Create optional toolbar component:

```vue
<!-- packages/editor/src/components/Toolbar.vue -->
<template>
  <div class="slate-toolbar">
    <button @click="editor.chain().focus().toggleBold().run()"
            :class="{ active: editor.isActive('bold') }">
      <strong>B</strong>
    </button>
    <button @click="editor.chain().focus().toggleItalic().run()"
            :class="{ active: editor.isActive('italic') }">
      <em>I</em>
    </button>
    <!-- More buttons -->
  </div>
</template>
```

Use in webview:
```vue
<SlateEditor v-model="content">
  <template #toolbar="{ editor }">
    <Toolbar :editor="editor" />
  </template>
</SlateEditor>
```

**Deliverables:**
- ✅ Toolbar component
- ✅ Format buttons work
- ✅ Active states show

### 4.2 Add Image Support

```typescript
// In webview
vscode.postMessage({
  type: 'insertImage'
});

// In extension
case 'insertImage':
  const uri = await vscode.window.showOpenDialog({
    filters: { 'Images': ['png', 'jpg', 'jpeg', 'gif', 'svg'] }
  });
  if (uri && uri[0]) {
    const imageUri = webviewPanel.webview.asWebviewUri(uri[0]);
    webviewPanel.webview.postMessage({
      type: 'insertImage',
      url: imageUri.toString()
    });
  }
  break;
```

**Deliverables:**
- ✅ Image picker dialog
- ✅ Images insert correctly
- ✅ Images display in editor

### 4.3 Add Configuration Settings

```typescript
// Read configuration
const config = vscode.workspace.getConfiguration('slate');
const autosave = config.get('editor.autosave', true);
const showToolbar = config.get('editor.showToolbar', true);

// Send to webview
webviewPanel.webview.postMessage({
  type: 'config',
  autosave,
  showToolbar
});
```

**Deliverables:**
- ✅ Settings defined in package.json
- ✅ Settings read and applied
- ✅ Changes take effect

### 4.4 Add Export Commands

```typescript
vscode.commands.registerCommand('slate.exportAsHTML', async () => {
  const html = /* get from webview */;
  const uri = await vscode.window.showSaveDialog({
    filters: { 'HTML': ['html'] }
  });
  if (uri) {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(html));
  }
});
```

**Deliverables:**
- ✅ Export to HTML
- ✅ Export to Markdown (already native)
- ✅ (Optional) Export to PDF

## Phase 5: Testing & Documentation (Week 6)

### 5.1 Write Tests

```typescript
// packages/editor/tests/markdown.test.ts
import { htmlToMarkdown, markdownToHtml } from '../src/utils/markdown';

describe('Markdown Conversion', () => {
  it('converts markdown to HTML', () => {
    const md = '# Hello\n\nWorld';
    const html = markdownToHtml(md);
    expect(html).toContain('<h1>Hello</h1>');
    expect(html).toContain('<p>World</p>');
  });

  it('converts HTML to markdown', () => {
    const html = '<h1>Hello</h1><p>World</p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('# Hello');
    expect(md).toContain('World');
  });
});
```

**Test suite:**
- ✅ Unit tests for utilities
- ✅ Component tests
- ✅ Integration tests
- ✅ E2E tests in Extension Development Host

**Deliverables:**
- ✅ Test suite passing
- ✅ >80% code coverage

### 5.2 Write Documentation

**README.md:**
```markdown
# Slate Markdown Editor for VSCode

WYSIWYG markdown editor powered by TipTap.

## Features
- Rich text editing
- Live preview
- Theme support
- Image insertion
- Export to HTML

## Installation
Search for "Slate Markdown Editor" in VSCode marketplace

## Usage
Right-click any .md file > "Open With..." > "Slate Markdown Editor"

## Keyboard Shortcuts
- Cmd+S - Save
- Cmd+B - Bold
- ...
```

**CHANGELOG.md:**
```markdown
# Changelog

## [0.1.0] - 2025-01-15
### Added
- Initial release
- Basic WYSIWYG editor
- Markdown conversion
- Theme support
```

**Deliverables:**
- ✅ README with screenshots
- ✅ CHANGELOG
- ✅ LICENSE (MIT)
- ✅ Contributing guide

### 5.3 Create Extension Icon

Create 128x128 PNG icon:

```bash
# Save as packages/vscode-extension/icon.png
```

Add to package.json:
```json
{
  "icon": "icon.png"
}
```

**Deliverables:**
- ✅ Professional icon
- ✅ Icon displays in marketplace

### 5.4 Create Demo GIF

Record demo showing:
1. Opening markdown file
2. Editing with formatting
3. Saving
4. Theme switching

```bash
# Use LICEcap or similar
# Save as demo.gif
# Add to README
```

**Deliverables:**
- ✅ Demo GIF
- ✅ Screenshots

## Phase 6: Publishing (Week 6)

### 6.1 Prepare for Publishing

**Pre-publish checklist:**
- ✅ All tests passing
- ✅ README complete with screenshots
- ✅ CHANGELOG up to date
- ✅ LICENSE file present
- ✅ Icon added
- ✅ Version number set (0.1.0)
- ✅ No console errors/warnings
- ✅ Bundle size reasonable (<10MB)

### 6.2 Package Extension

```bash
cd packages/vscode-extension

# Install vsce if not already
npm install -g @vscode/vsce

# Package
vsce package

# Creates: slate-markdown-editor-0.1.0.vsix
```

**Test .vsix locally:**
```bash
code --install-extension slate-markdown-editor-0.1.0.vsix
```

**Deliverables:**
- ✅ .vsix file created
- ✅ .vsix installs and works

### 6.3 Create Publisher Account

1. Go to https://marketplace.visualstudio.com/manage
2. Create publisher account
3. Get personal access token from Azure DevOps

```bash
vsce login <publisher-name>
# Enter token when prompted
```

**Deliverables:**
- ✅ Publisher account created
- ✅ Logged in with vsce

### 6.4 Publish Extension

```bash
# Publish to marketplace
vsce publish

# Or publish manually
# Upload .vsix at https://marketplace.visualstudio.com/manage
```

**Deliverables:**
- ✅ Extension published
- ✅ Visible in marketplace

### 6.5 Promote Extension

- ✅ Tweet announcement
- ✅ Post on Reddit r/vscode
- ✅ Blog post
- ✅ Update web app to link to extension

## Ongoing Maintenance

### Weekly Tasks
- Monitor GitHub issues
- Review pull requests
- Update dependencies
- Fix bugs

### Monthly Tasks
- Add features from roadmap
- Update documentation
- Publish new version

### Quarterly Tasks
- Review architecture
- Performance optimization
- Security audit

## Success Metrics

### MVP Success Criteria
- ✅ Extension installs without errors
- ✅ Can edit and save markdown files
- ✅ Markdown ↔ HTML conversion works
- ✅ No data loss
- ✅ <100ms typing latency
- ✅ Works on Mac, Windows, Linux

### Post-Launch Metrics
- **Week 1:** 100+ installs
- **Month 1:** 1,000+ installs
- **Month 3:** 5,000+ installs
- **User rating:** >4.0 stars
- **Bug reports:** <5 critical bugs

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Data loss during conversion | Extensive testing, backup mechanism |
| Performance issues | Lazy loading, virtual scrolling |
| Theme compatibility | Test with popular themes |
| VSCode API changes | Pin to specific VSCode version |
| Security vulnerabilities | CSP, input sanitization, audit |

## Resources Needed

### Development
- 1 developer (full-time, 6 weeks)
- 1 designer (icon, screenshots)
- 1 technical writer (documentation)

### Infrastructure
- GitHub repository (hosting)
- VSCode marketplace (distribution)
- CI/CD pipeline (GitHub Actions)

### Budget
- $0 (open source)
- Optional: domain for marketing site

## Next Steps

1. ✅ Review this roadmap with team
2. ✅ Get approval to proceed
3. ✅ Start Phase 1: Setup
4. ✅ Weekly check-ins on progress
5. ✅ Adjust timeline as needed

## Questions?

- See `vscode-extension-quick-reference.md` for API details
- See `vscode-plugin-design.md` for design decisions
- See `extraction-strategy.md` for component architecture
