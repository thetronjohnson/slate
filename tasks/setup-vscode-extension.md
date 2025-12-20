# Task 1: Setup VSCode Extension with TipTap

**Timeline:** Week 1, Days 1-3 (2-3 days)
**Goal:** Basic WYSIWYG markdown editor working in VSCode

## Prerequisites

```bash
# Required tools
node --version   # v18+
npm --version    # v9+
code --version   # VSCode 1.85+

# Install extension generator
npm install -g yo generator-code

# Install extension packager
npm install -g @vscode/vsce
```

## Step 1: Scaffold VSCode Extension (30 min)

```bash
# Create new directory (NOT in Slate repo)
cd ~/projects
mkdir vscode-markdown-annotator
cd vscode-markdown-annotator

# Generate extension
yo code

# Choose:
# - TypeScript extension
# - Name: markdown-annotator
# - Identifier: markdown-annotator
# - Description: WYSIWYG markdown editor with AI annotations
# - Initialize git: Yes
# - Package manager: npm

cd markdown-annotator
```

## Step 2: Configure Extension Manifest (20 min)

Edit `package.json`:

```json
{
  "name": "markdown-annotator",
  "displayName": "Markdown Annotator",
  "description": "WYSIWYG markdown editor with AI agent annotations",
  "version": "0.1.0",
  "publisher": "your-name",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onCustomEditor:markdownAnnotator.editor"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "customEditors": [
      {
        "viewType": "markdownAnnotator.editor",
        "displayName": "Markdown Annotator",
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
        "command": "markdownAnnotator.openAsText",
        "title": "Open as Text",
        "category": "Markdown Annotator"
      },
      {
        "command": "markdownAnnotator.sendToAgent",
        "title": "Send to AI Agent for Review",
        "category": "Markdown Annotator"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "command": "markdownAnnotator.sendToAgent",
          "when": "resourceLangId == markdown",
          "group": "navigation"
        }
      ]
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./ && npm run compile:webview",
    "compile:webview": "webpack --config webpack.webview.config.js",
    "watch": "tsc -watch -p ./",
    "watch:webview": "webpack --watch --config webpack.webview.config.js"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "@vscode/vsce": "^2.22.0",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "ts-loader": "^9.5.1",
    "vue-loader": "^17.4.2",
    "@vitejs/plugin-vue": "^5.0.0"
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
    "vue": "^3.5.13",
    "turndown": "^7.2.0",
    "markdown-it": "^14.0.0"
  }
}
```

## Step 3: Install Dependencies (5 min)

```bash
npm install
```

## Step 4: Create Extension Entry Point (30 min)

Create `src/extension.ts`:

```typescript
import * as vscode from 'vscode';
import { MarkdownAnnotatorProvider } from './MarkdownAnnotatorProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Markdown Annotator extension activated');

  // Register custom editor provider
  const provider = new MarkdownAnnotatorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      'markdownAnnotator.editor',
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
          enableFindWidget: true
        },
        supportsMultipleEditorsPerDocument: false
      }
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('markdownAnnotator.openAsText', () => {
      const uri = vscode.window.activeTextEditor?.document.uri;
      if (uri) {
        vscode.commands.executeCommand('vscode.openWith', uri, 'default');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('markdownAnnotator.sendToAgent', async () => {
      vscode.window.showInformationMessage('AI agent integration coming soon!');
    })
  );
}

export function deactivate() {}
```

## Step 5: Create Custom Editor Provider (1 hour)

Create `src/MarkdownAnnotatorProvider.ts`:

```typescript
import * as vscode from 'vscode';
import * as path from 'path';

export class MarkdownAnnotatorProvider implements vscode.CustomTextEditorProvider {

  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {

    // Setup webview options
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
        vscode.Uri.joinPath(this.context.extensionUri, 'node_modules')
      ]
    };

    // Set initial HTML
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Handle messages from webview
    const messageListener = webviewPanel.webview.onDidReceiveMessage(e => {
      switch (e.type) {
        case 'update':
          this.updateTextDocument(document, e.content);
          break;
        case 'save':
          document.save();
          break;
        case 'ready':
          // Send initial content when webview is ready
          this.sendContent(webviewPanel, document);
          break;
        case 'log':
          console.log('[Webview]', e.message);
          break;
      }
    });

    // Sync document changes from external sources
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        webviewPanel.webview.postMessage({
          type: 'externalUpdate',
          content: document.getText()
        });
      }
    });

    // Send theme updates
    const changeThemeSubscription = vscode.window.onDidChangeActiveColorTheme(theme => {
      webviewPanel.webview.postMessage({
        type: 'themeChanged',
        theme: theme.kind
      });
    });

    // Cleanup
    webviewPanel.onDidDispose(() => {
      messageListener.dispose();
      changeDocumentSubscription.dispose();
      changeThemeSubscription.dispose();
    });
  }

  private sendContent(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
    panel.webview.postMessage({
      type: 'init',
      content: document.getText(),
      theme: vscode.window.activeColorTheme.kind
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'media', 'editor.css')
    );

    const nonce = this.getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy"
            content="default-src 'none';
                     style-src ${webview.cspSource} 'unsafe-inline';
                     script-src 'nonce-${nonce}';
                     img-src ${webview.cspSource} https: data:;
                     font-src ${webview.cspSource};">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>Markdown Annotator</title>
    </head>
    <body>
      <div id="app"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }

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

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
```

## Step 6: Copy Styles from Slate (30 min)

```bash
# Copy editor styles from Slate repo
mkdir -p webview/styles
cp /home/user/slate/components/MarkdownEditor.vue webview/styles/reference.vue

# Create editor.css based on Slate's styles
```

Create `webview/styles/editor.css`:

```css
/* Base Editor Styles - Adapted from Slate */

:root {
  /* Use VSCode theme variables */
  --editor-bg: var(--vscode-editor-background, #ffffff);
  --editor-fg: var(--vscode-editor-foreground, #374151);
  --editor-heading: var(--vscode-editorWidget-foreground, #111827);
  --editor-placeholder: var(--vscode-input-placeholderForeground, #9ca3af);
  --editor-border: var(--vscode-panel-border, #d1d5db);
  --editor-code-bg: var(--vscode-textCodeBlock-background, rgba(241, 245, 249, 0.7));
  --editor-selection: var(--vscode-editor-selectionBackground, rgba(59, 130, 246, 0.3));
}

body {
  margin: 0;
  padding: 0;
  background: var(--editor-bg);
  color: var(--editor-fg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

#app {
  height: 100vh;
  overflow: auto;
}

.ProseMirror {
  min-height: 100vh;
  outline: none;
  padding: 2rem;
  background: var(--editor-bg);
  color: var(--editor-fg);
}

/* Placeholder */
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--editor-placeholder);
  pointer-events: none;
  height: 0;
}

/* Headings */
.ProseMirror h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 1.5rem;
  color: var(--editor-heading);
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--editor-heading);
  letter-spacing: -0.01em;
}

.ProseMirror h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: var(--editor-heading);
}

/* Paragraphs */
.ProseMirror p {
  margin-bottom: 1rem;
  line-height: 1.7;
  font-size: 1.05rem;
}

/* Lists */
.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.ProseMirror li {
  margin-bottom: 0.25rem;
  line-height: 1.7;
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
}

/* Code */
.ProseMirror code {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 0.9em;
  background: var(--editor-code-bg);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  border: 1px solid var(--editor-border);
}

.ProseMirror pre {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  background: var(--editor-code-bg);
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 1rem 0;
  font-size: 0.9em;
  overflow-x: auto;
  border: 1px solid var(--editor-border);
}

.ProseMirror pre code {
  background: transparent;
  border: none;
  padding: 0;
}

/* Blockquotes */
.ProseMirror blockquote {
  border-left: 4px solid var(--editor-border);
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  font-style: italic;
  opacity: 0.9;
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
  color: var(--vscode-textLink-foreground);
  text-decoration: underline;
  cursor: pointer;
}

.ProseMirror a:hover {
  color: var(--vscode-textLink-activeForeground);
}

/* HR */
.ProseMirror hr {
  margin: 1.5rem 0;
  border: none;
  border-top: 2px solid var(--editor-border);
}

/* Selection */
.ProseMirror::selection {
  background: var(--editor-selection);
}
```

## Step 7: Create Vue Webview App (1.5 hours)

Create `webview/main.ts`:

```typescript
import { createApp } from 'vue';
import Editor from './Editor.vue';

// Get VSCode API
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();

const app = createApp(Editor, {
  vscode
});

app.mount('#app');
```

Create `webview/Editor.vue`:

```vue
<template>
  <div class="editor-container">
    <editor-content v-if="editor" :editor="editor" />
    <div v-else class="loading">Loading editor...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { markdownToHtml, htmlToMarkdown } from './utils/markdown';

const props = defineProps<{
  vscode: any
}>();

const content = ref('');
const isDirty = ref(false);
let updateTimeout: NodeJS.Timeout | null = null;

// Create TipTap editor
const editor = useEditor({
  content: '',
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] }
    }),
    Placeholder.configure({
      placeholder: 'Start writing your markdown...'
    }),
    Image,
    Link,
    TaskList,
    TaskItem.configure({ nested: true })
  ],
  onUpdate: ({ editor }) => {
    isDirty.value = true;
    const html = editor.getHTML();

    // Debounce updates
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      // Convert HTML to markdown before sending
      const markdown = htmlToMarkdown(html);
      props.vscode.postMessage({
        type: 'update',
        content: markdown
      });
      isDirty.value = false;
    }, 500);
  }
});

// Listen for messages from extension
onMounted(() => {
  window.addEventListener('message', handleMessage);

  // Keyboard shortcuts
  window.addEventListener('keydown', handleKeydown);

  // Signal ready
  props.vscode.postMessage({ type: 'ready' });
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
  window.removeEventListener('keydown', handleKeydown);
  if (updateTimeout) clearTimeout(updateTimeout);
  editor.value?.destroy();
});

function handleMessage(event: MessageEvent) {
  const message = event.data;

  switch (message.type) {
    case 'init':
      // Convert markdown to HTML for editor
      const html = markdownToHtml(message.content);
      content.value = message.content;
      editor.value?.commands.setContent(html);
      break;

    case 'externalUpdate':
      if (!isDirty.value) {
        const html = markdownToHtml(message.content);
        editor.value?.commands.setContent(html);
      }
      break;

    case 'themeChanged':
      // Theme handled via CSS variables
      break;
  }
}

function handleKeydown(e: KeyboardEvent) {
  // Cmd/Ctrl + S to save
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    props.vscode.postMessage({ type: 'save' });
  }
}
</script>

<style>
@import './styles/editor.css';

.editor-container {
  height: 100vh;
  overflow: auto;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: var(--vscode-foreground);
}
</style>
```

## Step 8: Create Markdown Utilities (45 min)

Create `webview/utils/markdown.ts`:

```typescript
import TurndownService from 'turndown';

// HTML → Markdown converter
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

// Markdown → HTML converter
// Simplified version - you can use markdown-it or similar
export function markdownToHtml(markdown: string): string {
  // Basic conversion (expand this later)
  let html = markdown;

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold, italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Paragraphs
  html = html.replace(/^(?!<[h|p|u|o|b]|```)(.+)$/gm, '<p>$1</p>');

  return html;
}
```

## Step 9: Setup Webpack Build (30 min)

Create `webpack.webview.config.js`:

```javascript
const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = {
  target: 'web',
  entry: './webview/main.ts',
  output: {
    path: path.resolve(__dirname, 'media'),
    filename: 'editor.js'
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue'],
    alias: {
      'vue': 'vue/dist/vue.runtime.esm-bundler.js'
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/]
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin()
  ],
  devtool: 'source-map'
};
```

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2022",
    "outDir": "out",
    "lib": ["ES2022"],
    "sourceMap": true,
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["node_modules", ".vscode-test", "webview"]
}
```

Create `tsconfig.webview.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "lib": ["ES2022", "DOM"],
    "rootDir": "webview"
  },
  "include": ["webview/**/*"]
}
```

## Step 10: Test the Extension (30 min)

```bash
# Compile everything
npm run compile

# Open in VSCode
code .

# Press F5 to launch Extension Development Host

# In the new window:
# 1. Create a test.md file
# 2. Right-click > "Open With..." > "Markdown Annotator"
# 3. Try editing - should work!
```

## Testing Checklist

- ✅ Extension activates without errors
- ✅ Can open .md files in custom editor
- ✅ Can type and format text (bold, italic, headings)
- ✅ Changes save to file
- ✅ Cmd+S saves
- ✅ External file changes sync to editor
- ✅ Can switch back to text editor
- ✅ Theme respects VSCode light/dark mode

## Troubleshooting

### Webview shows blank page
- Check browser console in webview (Cmd+Shift+I)
- Verify `media/editor.js` was built
- Check CSP errors in console

### Styles not loading
- Verify `media/editor.css` exists
- Check `asWebviewUri()` paths are correct
- Check CSP allows styles

### TypeScript errors
- Run `npm run compile` to see errors
- Check tsconfig.json settings
- Verify all types are installed

## Deliverables

At the end of this task, you should have:

✅ Working VSCode extension scaffold
✅ TipTap editor rendering in webview
✅ Basic markdown editing (WYSIWYG)
✅ Save/load functionality
✅ Theme integration
✅ Styles adapted from Slate

## Next Task

**[custom-annotation-extension.md](./custom-annotation-extension.md)** - Create the TipTap annotation extension for AI agent feedback.

---

**Estimated Time:** 2-3 days
**Difficulty:** Medium
**Dependencies:** None
