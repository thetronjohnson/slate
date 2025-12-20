# VSCode Plugin Design - Slate Markdown Editor

## Executive Summary

This document outlines the design for integrating the Slate editor as a VSCode extension that provides a WYSIWYG markdown editing experience directly within VSCode.

## Goals

### Primary Goals
1. ✅ **WYSIWYG Markdown Editing** - Rich text editing with live preview
2. ✅ **Seamless VSCode Integration** - Feels like a native VSCode feature
3. ✅ **Direct File Editing** - Edit actual `.md` files, no intermediate formats
4. ✅ **Theme Consistency** - Respects VSCode light/dark themes
5. ✅ **Keyboard Shortcuts** - Standard VSCode shortcuts work

### Secondary Goals
6. ⚠️ **Backward Compatibility** - Can still open as text
7. ⚠️ **Performance** - Fast loading, smooth editing
8. ⚠️ **Export Options** - Support various formats (HTML, PDF)
9. ⚠️ **Extensibility** - Allow custom TipTap extensions

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  VSCode Extension                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │  Extension Host (Node.js)                     │    │
│  │  ┌─────────────────────────────────────────┐  │    │
│  │  │ extension.ts                            │  │    │
│  │  │ - Activation                            │  │    │
│  │  │ - Register CustomTextEditorProvider     │  │    │
│  │  └─────────────────────────────────────────┘  │    │
│  │                      ↕                         │    │
│  │  ┌─────────────────────────────────────────┐  │    │
│  │  │ SlateEditorProvider.ts                  │  │    │
│  │  │ - resolveCustomTextEditor()             │  │    │
│  │  │ - Manage webview lifecycle              │  │    │
│  │  │ - Sync TextDocument ↔ Webview           │  │    │
│  │  └─────────────────────────────────────────┘  │    │
│  │                      ↕                         │    │
│  │  ┌─────────────────────────────────────────┐  │    │
│  │  │ VSCode Storage Adapter                  │  │    │
│  │  │ - Read/write .md files                  │  │    │
│  │  │ - Workspace/global state                │  │    │
│  │  └─────────────────────────────────────────┘  │    │
│  └───────────────────────────────────────────────┘    │
│                      ↕ postMessage                     │
│  ┌───────────────────────────────────────────────┐    │
│  │  Webview (Browser Context)                    │    │
│  │  ┌─────────────────────────────────────────┐  │    │
│  │  │ Vue 3 App                               │  │    │
│  │  │ ┌────────────────────────────────────┐  │  │    │
│  │  │ │ SlateEditor Component              │  │  │    │
│  │  │ │ - TipTap Editor                    │  │  │    │
│  │  │ │ - Toolbar                          │  │  │    │
│  │  │ │ - Keyboard shortcuts               │  │  │    │
│  │  │ └────────────────────────────────────┘  │  │    │
│  │  └─────────────────────────────────────────┘  │    │
│  └───────────────────────────────────────────────┘    │
│                      ↕ WorkspaceEdit                   │
│  ┌───────────────────────────────────────────────┐    │
│  │  TextDocument (.md file)                      │    │
│  │  - Actual markdown file on disk               │    │
│  │  - Managed by VSCode                          │    │
│  └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Component Design

### 1. Extension Entry (extension.ts)

**Responsibilities:**
- Extension activation
- Register custom editor provider
- Register commands
- Setup event listeners

**Code Structure:**
```typescript
export function activate(context: vscode.ExtensionContext) {
  // Register custom editor
  const provider = new SlateEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      SlateEditorProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    )
  );

  // Register commands
  registerCommands(context);

  // Setup configuration listener
  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('slate')) {
      // Reload editors
    }
  });
}
```

### 2. Slate Editor Provider (SlateEditorProvider.ts)

**Responsibilities:**
- Create and manage webview panels
- Synchronize document changes
- Handle messages from webview
- Generate webview HTML

**Key Methods:**

#### resolveCustomTextEditor()
```typescript
async resolveCustomTextEditor(
  document: vscode.TextDocument,
  webviewPanel: vscode.WebviewPanel,
  token: vscode.CancellationToken
): Promise<void> {
  // 1. Setup webview
  this.setupWebview(webviewPanel, document);

  // 2. Setup communication
  this.setupMessageHandlers(webviewPanel, document);

  // 3. Sync document changes
  this.setupDocumentSync(webviewPanel, document);

  // 4. Send initial content
  this.sendInitialContent(webviewPanel, document);
}
```

#### Message Handlers
```typescript
private handleMessage(message: any, document: vscode.TextDocument) {
  switch (message.type) {
    case 'update':
      // Update TextDocument with new content
      this.updateDocument(document, message.content);
      break;

    case 'save':
      // Trigger save
      document.save();
      break;

    case 'export':
      // Export to format
      this.exportDocument(document, message.format);
      break;

    case 'ready':
      // Webview is ready, send content
      this.sendContent(document);
      break;
  }
}
```

#### Document Synchronization
```typescript
private setupDocumentSync(
  panel: vscode.WebviewPanel,
  document: vscode.TextDocument
) {
  // Listen for external changes to document
  const changeSubscription = vscode.workspace.onDidChangeTextDocument(e => {
    if (e.document.uri.toString() === document.uri.toString()) {
      // Document changed externally, update webview
      panel.webview.postMessage({
        type: 'externalUpdate',
        content: document.getText()
      });
    }
  });

  panel.onDidDispose(() => changeSubscription.dispose());
}
```

### 3. Webview Application (webview/editor.ts)

**Responsibilities:**
- Initialize Vue app with Slate editor
- Handle content updates
- Send changes to extension
- Manage editor state

**Initialization:**
```typescript
import { createApp } from 'vue';
import SlateEditor from '@slate-editor/core';

const vscode = acquireVsCodeApi();

// Create Vue app
const app = createApp({
  components: { SlateEditor },
  data() {
    return {
      content: '',
      theme: 'light',
      isDirty: false
    };
  },
  methods: {
    handleUpdate(html: string) {
      this.content = html;
      this.isDirty = true;

      // Debounce updates to extension
      this.debouncedUpdate(html);
    },

    debouncedUpdate: debounce(function(html: string) {
      vscode.postMessage({
        type: 'update',
        content: html
      });
      this.isDirty = false;
    }, 500),

    handleSave() {
      vscode.postMessage({ type: 'save' });
    }
  }
});

app.mount('#app');

// Listen for messages from extension
window.addEventListener('message', event => {
  const message = event.data;

  switch (message.type) {
    case 'init':
      app.content = message.content;
      app.theme = message.theme;
      break;

    case 'externalUpdate':
      // Document changed externally
      if (!app.isDirty) {
        app.content = message.content;
      }
      break;

    case 'themeChanged':
      app.theme = message.theme;
      break;
  }
});

// Signal ready
vscode.postMessage({ type: 'ready' });
```

### 4. Storage Adapter (storage/VSCodeStorageAdapter.ts)

**Responsibilities:**
- Implement StorageAdapter interface for VSCode
- Read/write files via VSCode API
- Manage workspace state

```typescript
import * as vscode from 'vscode';
import { StorageAdapter } from '@slate-editor/core';

export class VSCodeStorageAdapter implements StorageAdapter {
  constructor(
    private context: vscode.ExtensionContext,
    private document: vscode.TextDocument
  ) {}

  async save(key: string, content: string): Promise<void> {
    // For markdown files, save directly to document
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      this.document.uri,
      new vscode.Range(0, 0, this.document.lineCount, 0),
      content
    );
    await vscode.workspace.applyEdit(edit);
  }

  async load(key: string): Promise<string | null> {
    return this.document.getText();
  }

  async delete(key: string): Promise<void> {
    // Not applicable for direct file editing
  }

  async list(): Promise<Array<{ key: string; name: string }>> {
    // Return all .md files in workspace
    const files = await vscode.workspace.findFiles('**/*.md');
    return files.map(uri => ({
      key: uri.toString(),
      name: path.basename(uri.fsPath)
    }));
  }

  // Metadata storage using Memento
  async saveMeta(key: string, data: any): Promise<void> {
    await this.context.workspaceState.update(key, data);
  }

  async loadMeta(key: string): Promise<any> {
    return this.context.workspaceState.get(key);
  }
}
```

## Data Flow

### Initial Load
```
1. User opens .md file
2. VSCode calls resolveCustomTextEditor()
3. Provider creates webview with HTML
4. Webview loads, initializes Vue app
5. Vue app sends 'ready' message
6. Provider sends 'init' with document content
7. Editor displays content
```

### Editing Flow
```
1. User types in editor
2. TipTap updates internal state
3. Editor debounces and sends 'update' message
4. Provider receives message
5. Provider updates TextDocument via WorkspaceEdit
6. VSCode marks file as dirty
7. VSCode's undo/redo stack updated
```

### External Change Flow
```
1. File changes externally (git pull, another editor, etc.)
2. VSCode fires onDidChangeTextDocument event
3. Provider receives event
4. Provider sends 'externalUpdate' to webview
5. Webview checks if editor is dirty
6. If not dirty, update editor content
7. If dirty, show merge conflict UI
```

### Save Flow
```
1. User presses Cmd+S
2. Webview sends 'save' message
3. Provider calls document.save()
4. VSCode writes file to disk
5. VSCode fires onDidSaveTextDocument
6. Provider sends 'saved' confirmation to webview
7. Webview shows "Saved" indicator
```

## Content Format Strategy

### Challenge
TipTap stores content as HTML, but markdown files are plain text.

### Solution Options

#### Option 1: Store HTML in Markdown (Recommended for Phase 1)
```markdown
# Title

Regular markdown content...

<!-- HTML content from TipTap below -->
<h1>Title</h1>
<p>Regular markdown content...</p>
```

**Pros:**
- ✅ Lossless (no conversion)
- ✅ Works with all TipTap features
- ✅ Fast (no conversion overhead)

**Cons:**
- ❌ Not readable as plain markdown
- ❌ Git diffs are messy

#### Option 2: Bidirectional Conversion (Recommended for Phase 2)
```
Markdown File ←→ HTML (TipTap)
    ↑                ↓
turndown        formatTipTapHtml
```

**On Load:**
```typescript
const markdown = document.getText();
const html = markdownToHtml(markdown); // formatTipTapHtml()
editor.setContent(html);
```

**On Save:**
```typescript
const html = editor.getHTML();
const markdown = htmlToMarkdown(html); // turndown
updateDocument(markdown);
```

**Pros:**
- ✅ Readable markdown files
- ✅ Clean git diffs
- ✅ Compatible with other editors

**Cons:**
- ⚠️ Potential data loss (HTML → MD → HTML)
- ⚠️ Conversion overhead
- ⚠️ Need to handle edge cases

#### Option 3: Dual Storage (Advanced)
Store both formats with metadata:

```markdown
---
slate-html: base64encodedhtml...
---

# Markdown version

Regular markdown content...
```

**Pros:**
- ✅ Lossless
- ✅ Readable markdown

**Cons:**
- ❌ File size overhead
- ❌ Complexity

**Recommendation:** Start with Option 2 (Bidirectional), monitor for conversion issues, have Option 1 as fallback.

## Theme Integration

### Detecting Theme
```typescript
// In extension
const theme = vscode.window.activeColorTheme;

// Listen for theme changes
vscode.window.onDidChangeActiveColorTheme(newTheme => {
  webviewPanel.webview.postMessage({
    type: 'themeChanged',
    kind: newTheme.kind // Light = 1, Dark = 2, HighContrast = 3
  });
});
```

### Applying Theme in Webview
```css
/* editor.css */
:root {
  /* Use VSCode theme variables */
  --editor-bg: var(--vscode-editor-background);
  --editor-fg: var(--vscode-editor-foreground);
  --code-bg: var(--vscode-textCodeBlock-background);
}

.ProseMirror {
  background: var(--editor-bg);
  color: var(--editor-fg);
}
```

```typescript
// In webview
const applyTheme = (kind: vscode.ColorThemeKind) => {
  const isDark = kind === 2;
  document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
};
```

## Configuration

### VSCode Settings
```json
{
  "slate.editor.defaultView": "wysiwyg",
  "slate.editor.showToolbar": true,
  "slate.editor.autosave": true,
  "slate.editor.autosaveDelay": 1500,
  "slate.editor.theme": "auto",
  "slate.editor.fontSize": 16,
  "slate.editor.fontFamily": "Inter, system-ui",
  "slate.export.includeStyles": true,
  "slate.export.pdfMargins": "1in"
}
```

### package.json contributes
```json
{
  "contributes": {
    "configuration": {
      "title": "Slate Markdown Editor",
      "properties": {
        "slate.editor.defaultView": {
          "type": "string",
          "enum": ["wysiwyg", "text"],
          "default": "wysiwyg",
          "description": "Default view mode for markdown files"
        },
        "slate.editor.showToolbar": {
          "type": "boolean",
          "default": true,
          "description": "Show formatting toolbar"
        },
        "slate.editor.autosave": {
          "type": "boolean",
          "default": true,
          "description": "Auto-save changes"
        }
      }
    }
  }
}
```

## Commands

### Contributed Commands
```json
{
  "contributes": {
    "commands": [
      {
        "command": "slate.openAsText",
        "title": "Open as Text",
        "category": "Slate"
      },
      {
        "command": "slate.openAsWYSIWYG",
        "title": "Open as WYSIWYG",
        "category": "Slate"
      },
      {
        "command": "slate.exportAsHTML",
        "title": "Export as HTML",
        "category": "Slate"
      },
      {
        "command": "slate.exportAsPDF",
        "title": "Export as PDF",
        "category": "Slate"
      },
      {
        "command": "slate.insertImage",
        "title": "Insert Image",
        "category": "Slate"
      }
    ],
    "menus": {
      "editor/title": [
        {
          "command": "slate.openAsText",
          "when": "resourceLangId == markdown && activeCustomEditorId == slate.markdownEditor",
          "group": "navigation"
        }
      ],
      "commandPalette": [
        {
          "command": "slate.exportAsHTML",
          "when": "activeCustomEditorId == slate.markdownEditor"
        }
      ]
    }
  }
}
```

## Keyboard Shortcuts

### Default Bindings
```json
{
  "contributes": {
    "keybindings": [
      {
        "command": "slate.openAsText",
        "key": "cmd+k cmd+t",
        "mac": "cmd+k cmd+t",
        "when": "activeCustomEditorId == slate.markdownEditor"
      },
      {
        "command": "slate.insertImage",
        "key": "cmd+shift+i",
        "mac": "cmd+shift+i",
        "when": "activeCustomEditorId == slate.markdownEditor"
      }
    ]
  }
}
```

### Editor Shortcuts (in webview)
- `Cmd+S` - Save
- `Cmd+B` - Bold
- `Cmd+I` - Italic
- `Cmd+K` - Insert link
- `Cmd+Shift+X` - Strike through
- `Cmd+E` - Code
- `Cmd+Shift+C` - Code block

## Performance Optimizations

### 1. Lazy Loading
```typescript
// Load heavy dependencies only when needed
let pdfExporter: any;

async function exportPDF() {
  if (!pdfExporter) {
    pdfExporter = await import('./pdfExporter');
  }
  return pdfExporter.export();
}
```

### 2. Debouncing Updates
```typescript
const debouncedUpdate = debounce((content: string) => {
  vscode.postMessage({ type: 'update', content });
}, 500);
```

### 3. Virtual Scrolling (for large documents)
```typescript
// For documents > 10,000 lines
import { VirtualScroller } from 'virtual-scroller-vue';
```

### 4. Web Worker for Parsing
```typescript
// Offload markdown parsing to worker
const worker = new Worker('markdown-worker.js');
worker.postMessage({ markdown });
worker.onmessage = (e) => {
  const html = e.data;
  editor.setContent(html);
};
```

## Error Handling

### Conversion Errors
```typescript
try {
  const html = markdownToHtml(markdown);
  editor.setContent(html);
} catch (error) {
  vscode.window.showErrorMessage(
    `Failed to parse markdown: ${error.message}`
  );
  // Fallback to raw text
  editor.setContent(`<pre>${markdown}</pre>`);
}
```

### Save Errors
```typescript
try {
  await document.save();
} catch (error) {
  vscode.window.showErrorMessage(
    `Failed to save: ${error.message}`,
    'Retry'
  ).then(action => {
    if (action === 'Retry') {
      document.save();
    }
  });
}
```

## Testing Strategy

### Unit Tests
```typescript
suite('SlateEditorProvider', () => {
  test('Converts markdown to HTML', () => {
    const markdown = '# Hello\n\nWorld';
    const html = markdownToHtml(markdown);
    assert.ok(html.includes('<h1>Hello</h1>'));
  });
});
```

### Integration Tests
```typescript
suite('Extension Integration', () => {
  test('Opens markdown file in custom editor', async () => {
    const uri = vscode.Uri.file('/path/to/test.md');
    await vscode.commands.executeCommand('vscode.openWith', uri, 'slate.markdownEditor');
    // Assert editor opened
  });
});
```

### E2E Tests
- Manual testing in Extension Development Host
- Automated tests using VSCode Test Runner

## Deployment

### Pre-publish Checklist
- ✅ Extension manifest complete
- ✅ README with screenshots
- ✅ LICENSE file
- ✅ Icon (128x128 PNG)
- ✅ CHANGELOG
- ✅ All tests passing
- ✅ Build size < 10MB

### Publishing Commands
```bash
# Install vsce
npm install -g @vscode/vsce

# Login
vsce login <publisher-name>

# Package
vsce package

# Publish
vsce publish
```

## Roadmap

### Phase 1: MVP
- ✅ Basic editor with TipTap
- ✅ Markdown ↔ HTML conversion
- ✅ Save/load functionality
- ✅ Theme support
- ✅ Basic toolbar

### Phase 2: Enhanced Features
- ⚠️ Image upload/paste
- ⚠️ Table support
- ⚠️ Syntax highlighting in code blocks
- ⚠️ Export to HTML/PDF
- ⚠️ Split view (markdown | preview)

### Phase 3: Advanced Features
- ⚠️ Collaboration (Live Share integration)
- ⚠️ Custom TipTap extensions
- ⚠️ Template system
- ⚠️ AI integration (GitHub Copilot)

## Next Steps

1. Review this design with stakeholders
2. Setup development environment
3. Follow implementation roadmap (see `implementation-roadmap.md`)
4. Start with Phase 1 MVP

## References

- `extraction-strategy.md` - Component extraction approach
- `vscode-extension-quick-reference.md` - VSCode API reference
- `implementation-roadmap.md` - Step-by-step implementation guide
