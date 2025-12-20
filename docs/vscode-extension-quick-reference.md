# VSCode Extension Quick Reference - Custom Markdown Editor

## Overview

VSCode extensions can create custom editors using the **Custom Editor API**. For markdown editing, we'll use **CustomTextEditorProvider** which works with VS Code's standard TextDocument.

## Key Concepts

### Custom Editor Types

1. **CustomTextEditorProvider** ⭐ (Use this for Slate)
   - Works with text-based files
   - Uses VS Code's standard TextDocument
   - VS Code handles save/backup/undo automatically
   - Best for: Markdown, JSON, XML, etc.

2. **CustomEditorProvider**
   - Full control over document model
   - Must implement save/backup/undo yourself
   - Best for: Binary files, images, etc.

## Architecture

```
┌─────────────────────────────────────────────────┐
│           VSCode Extension Host                 │
│  ┌───────────────────────────────────────────┐ │
│  │  extension.ts                             │ │
│  │  - Registers CustomTextEditorProvider     │ │
│  │  - Handles activation                     │ │
│  │  - Creates webview panels                 │ │
│  └───────────────┬───────────────────────────┘ │
│                  │                               │
│                  │ postMessage()                 │
│                  ↓                               │
│  ┌───────────────────────────────────────────┐ │
│  │  Webview (HTML/CSS/JS)                    │ │
│  │  - Slate Editor UI                        │ │
│  │  - TipTap/Vue components                  │ │
│  │  - Renders in iframe                      │ │
│  └───────────────┬───────────────────────────┘ │
│                  │                               │
│                  │ postMessage()                 │
│                  ↓                               │
│  ┌───────────────────────────────────────────┐ │
│  │  TextDocument                             │ │
│  │  - Actual .md file content                │ │
│  │  - Managed by VS Code                     │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## File Structure

```
vscode-slate-editor/
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── SlateEditorProvider.ts # Custom editor provider
│   └── webview/
│       ├── editor.ts         # Webview client code
│       ├── editor.html       # Webview HTML template
│       └── styles.css        # Editor styles
├── media/                    # Static assets
│   ├── editor.js             # Bundled Slate editor
│   └── editor.css            # Bundled styles
└── out/                      # Compiled output
```

## Core Implementation

### 1. package.json

```json
{
  "name": "slate-markdown-editor",
  "displayName": "Slate Markdown Editor",
  "description": "WYSIWYG markdown editor powered by Slate",
  "version": "1.0.0",
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
          {
            "filenamePattern": "*.md"
          }
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
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "package": "vsce package"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vsce": "^2.15.0"
  }
}
```

**Key fields:**
- `activationEvents`: When extension loads
- `customEditors.viewType`: Unique identifier
- `customEditors.selector`: File patterns to match
- `customEditors.priority`: `default` (always) or `option` (user choice)

### 2. extension.ts

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
          retainContextWhenHidden: true, // Keep state when hidden
          enableFindWidget: true          // Enable Cmd+F search
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

### 3. SlateEditorProvider.ts

```typescript
import * as vscode from 'vscode';
import * as path from 'path';

export class SlateEditorProvider implements vscode.CustomTextEditorProvider {

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * Called when custom editor is opened
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {

    // Setup webview options
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media')
      ]
    };

    // Set initial HTML content
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document);

    // Handle messages from webview
    const messageListener = webviewPanel.webview.onDidReceiveMessage(e => {
      switch (e.type) {
        case 'update':
          this.updateTextDocument(document, e.content);
          break;
        case 'save':
          document.save();
          break;
      }
    });

    // Update webview when document changes externally
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        webviewPanel.webview.postMessage({
          type: 'update',
          content: document.getText()
        });
      }
    });

    // Cleanup
    webviewPanel.onDidDispose(() => {
      messageListener.dispose();
      changeDocumentSubscription.dispose();
    });

    // Send initial content
    webviewPanel.webview.postMessage({
      type: 'init',
      content: document.getText()
    });
  }

  /**
   * Generate HTML for webview
   */
  private getHtmlForWebview(webview: vscode.Webview, document: vscode.TextDocument): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css')
    );

    // Use nonce for CSP
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
      <title>Slate Markdown Editor</title>
    </head>
    <body>
      <div id="app"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

  /**
   * Update the TextDocument with new content
   */
  private updateTextDocument(document: vscode.TextDocument, content: string) {
    const edit = new vscode.WorkspaceEdit();

    // Replace entire document
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

### 4. Webview Client (src/webview/editor.ts)

```typescript
// This runs in the webview context
declare const acquireVsCodeApi: () => {
  postMessage(message: any): void;
  getState(): any;
  setState(state: any): void;
};

const vscode = acquireVsCodeApi();

// Listen for messages from extension
window.addEventListener('message', event => {
  const message = event.data;

  switch (message.type) {
    case 'init':
      initEditor(message.content);
      break;
    case 'update':
      updateEditorContent(message.content);
      break;
  }
});

// Initialize Slate/TipTap editor
function initEditor(initialContent: string) {
  // Create Vue app with Slate editor
  // Configure TipTap
  // Set initial content

  // When content changes, notify extension
  editor.on('update', ({ editor }) => {
    const html = editor.getHTML();

    vscode.postMessage({
      type: 'update',
      content: html
    });
  });
}

// Save shortcut
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    vscode.postMessage({ type: 'save' });
  }
});
```

## Communication Patterns

### Extension → Webview

```typescript
// In extension
webviewPanel.webview.postMessage({
  type: 'update',
  content: document.getText()
});
```

### Webview → Extension

```typescript
// In webview
vscode.postMessage({
  type: 'update',
  content: editor.getHTML()
});
```

## Storage Options

### 1. Direct File System (Recommended for Markdown)
```typescript
// Content is in TextDocument
const content = document.getText();

// Updates via WorkspaceEdit
const edit = new vscode.WorkspaceEdit();
edit.replace(document.uri, fullRange, newContent);
vscode.workspace.applyEdit(edit);
```

### 2. Workspace State (Metadata)
```typescript
// Store editor settings per workspace
context.workspaceState.update('slate.settings', {
  theme: 'dark',
  fontSize: 14
});

const settings = context.workspaceState.get('slate.settings');
```

### 3. Global State (User Preferences)
```typescript
// Store user preferences globally
context.globalState.update('slate.userPreferences', {
  defaultFont: 'Inter'
});
```

### 4. Workspace Storage (Files)
```typescript
// Store temporary files
const storageUri = context.storageUri; // workspace-specific
const globalStorageUri = context.globalStorageUri; // user-wide

await vscode.workspace.fs.writeFile(
  vscode.Uri.joinPath(storageUri, 'temp.json'),
  Buffer.from(JSON.stringify(data))
);
```

## Theme Integration

### Access VS Code Theme

```typescript
// In extension
const theme = vscode.window.activeColorTheme;

webviewPanel.webview.postMessage({
  type: 'theme',
  kind: theme.kind // Light = 1, Dark = 2, HighContrast = 3
});
```

### CSS Variables in Webview

```css
/* Use VS Code theme colors */
body {
  color: var(--vscode-editor-foreground);
  background-color: var(--vscode-editor-background);
}

.editor {
  color: var(--vscode-editorWidget-foreground);
  background: var(--vscode-editorWidget-background);
}

code {
  color: var(--vscode-textPreformat-foreground);
  background: var(--vscode-textCodeBlock-background);
}
```

### Common VSCode CSS Variables

```css
--vscode-editor-foreground        /* Main text color */
--vscode-editor-background        /* Main bg color */
--vscode-editor-selectionBackground
--vscode-editor-lineHighlightBackground
--vscode-editorCursor-foreground

--vscode-button-background
--vscode-button-foreground
--vscode-button-hoverBackground

--vscode-input-background
--vscode-input-foreground
--vscode-input-border

--vscode-list-activeSelectionBackground
--vscode-list-hoverBackground
```

## Build & Bundle

### Using esbuild (Fast)

```javascript
// esbuild.js
const esbuild = require('esbuild');

// Extension bundle
esbuild.build({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'out/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node16'
});

// Webview bundle
esbuild.build({
  entryPoints: ['src/webview/editor.ts'],
  bundle: true,
  outfile: 'media/editor.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020'
});
```

### Using webpack

```javascript
// webpack.config.js
const path = require('path');

module.exports = [
  {
    target: 'node',
    entry: './src/extension.ts',
    output: {
      path: path.resolve(__dirname, 'out'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2'
    },
    externals: {
      vscode: 'commonjs vscode'
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader'
        }
      ]
    }
  },
  {
    target: 'web',
    entry: './src/webview/editor.ts',
    output: {
      path: path.resolve(__dirname, 'media'),
      filename: 'editor.js'
    }
  }
];
```

## Testing

### Extension Development Host

1. Open extension folder in VS Code
2. Press `F5` to launch Extension Development Host
3. Open a `.md` file
4. Right-click → "Open With..." → "Slate Markdown Editor"

### Debugging

```typescript
// In extension
console.log('Extension loaded');

// In webview
console.log('Webview initialized');
// Logs appear in webview DevTools (Ctrl+Shift+I)
```

### Unit Tests

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Slate Editor Extension', () => {
  test('Extension activates', async () => {
    const extension = vscode.extensions.getExtension('publisher.slate-markdown-editor');
    assert.ok(extension);
    await extension?.activate();
  });
});
```

## Publishing

### 1. Create Publisher Account
Visit https://marketplace.visualstudio.com/manage

### 2. Get Personal Access Token
From Azure DevOps → User Settings → Personal Access Tokens

### 3. Login to vsce
```bash
npx vsce login <publisher-name>
```

### 4. Package Extension
```bash
npx vsce package
# Creates: slate-markdown-editor-1.0.0.vsix
```

### 5. Publish
```bash
npx vsce publish
# Or publish manually via marketplace website
```

## Best Practices

### Security
✅ Always use nonces in CSP
✅ Use `asWebviewUri()` for local resources
✅ Validate all messages from webview
❌ Never use `eval()` or inline scripts without nonce

### Performance
✅ Use `retainContextWhenHidden: true` sparingly
✅ Lazy load heavy dependencies
✅ Debounce document updates
❌ Don't update on every keystroke

### UX
✅ Respect VS Code theme
✅ Use standard keyboard shortcuts
✅ Handle file changes from external sources
✅ Show loading states

### Code Quality
✅ Use TypeScript
✅ Follow VS Code API guidelines
✅ Add telemetry (opt-in)
✅ Write tests

## Common Pitfalls

### 1. CSP Violations
**Problem:** Inline scripts blocked
**Solution:** Use nonces or external scripts

### 2. Resource Loading
**Problem:** CSS/JS files not found
**Solution:** Use `asWebviewUri()` to convert paths

### 3. State Synchronization
**Problem:** Editor and document out of sync
**Solution:** Listen to `onDidChangeTextDocument`

### 4. Memory Leaks
**Problem:** Event listeners not disposed
**Solution:** Store in `subscriptions`, dispose in `onDidDispose`

## Example: Complete Minimal Editor

See `packages/vscode-extension/` folder for full implementation with:
- ✅ TipTap integration
- ✅ Theme support
- ✅ Auto-save
- ✅ Keyboard shortcuts
- ✅ Markdown import/export

## References & Resources

**Official Documentation:**
- [Custom Editor API](https://code.visualstudio.com/api/extension-guides/custom-editors)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [VS Code API Reference](https://code.visualstudio.com/api/references/vscode-api)

**Examples:**
- [vscode-markdown-editor on GitHub](https://github.com/zaaack/vscode-markdown-editor)
- [Official Custom Editor Samples](https://github.com/Microsoft/vscode-docs/blob/main/api/extension-guides/custom-editors.md)

**Tools:**
- [Yeoman VS Code Generator](https://code.visualstudio.com/api/get-started/your-first-extension)
- [vsce - Publishing tool](https://github.com/microsoft/vscode-vsce)

**Important Note:** The Webview UI Toolkit for VS Code is being deprecated as of January 1, 2025, so build custom UI with standard HTML/CSS/JS instead.

## Next Steps

1. Generate extension scaffold: `yo code`
2. Implement `CustomTextEditorProvider`
3. Create webview with Slate editor
4. Test in Extension Development Host
5. Package and publish

---

**See also:**
- `vscode-plugin-design.md` - Detailed Slate editor integration design
- `implementation-roadmap.md` - Step-by-step implementation plan
