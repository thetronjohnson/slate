# Development Guide

This guide covers how to develop, debug, and extend the Markdown WYSIWYG VSCode extension.

## Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Debugging](#debugging)
- [Making Changes](#making-changes)
- [Common Tasks](#common-tasks)
- [Architecture Deep Dive](#architecture-deep-dive)
- [Troubleshooting](#troubleshooting)

## Project Structure

```
markdown-wysiwyg/
├── src/                          # Extension host code (Node.js)
│   ├── extension.ts              # Extension entry point
│   └── MarkdownWysiwygProvider.ts # Custom editor provider
│
├── webview/                      # Webview code (Browser)
│   ├── main.ts                   # Webview entry point
│   ├── Editor.vue                # TipTap editor component
│   ├── editor.css                # Editor styles
│   ├── markdown.ts               # Markdown ↔ HTML conversion
│   └── vue-shim.d.ts             # TypeScript declarations for Vue
│
├── out/                          # Compiled extension (generated)
│   ├── extension.js
│   └── MarkdownWysiwygProvider.js
│
├── media/                        # Compiled webview (generated)
│   └── editor.js                 # Bundled Vue app
│
├── .vscode/
│   ├── launch.json               # Debug configuration
│   └── tasks.json                # Build tasks
│
├── package.json                  # Extension manifest + dependencies
├── tsconfig.json                 # TypeScript config (extension)
├── tsconfig.webview.json         # TypeScript config (webview)
├── webpack.config.js             # Webview bundler config
└── test.md                       # Sample test file
```

### Two Execution Contexts

This extension runs in **two separate environments**:

1. **Extension Host** (`src/`) - Node.js process
   - Manages VSCode integration
   - Reads/writes markdown files
   - Communicates with webview via `postMessage`

2. **Webview** (`webview/`) - Browser context
   - Runs TipTap editor
   - Handles user input
   - Converts HTML ↔ Markdown

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- VSCode 1.85+

### Initial Setup

```bash
cd /home/user/projects/markdown-wysiwyg
npm install
npm run compile
```

### Opening in VSCode

```bash
code /home/user/projects/markdown-wysiwyg
```

## Development Workflow

### 1. Start Watch Mode

For active development, run watch mode to auto-rebuild on changes:

**Terminal 1 - Watch Extension:**
```bash
npm run watch
```

**Terminal 2 - Watch Webview:**
```bash
npm run watch:webview
```

### 2. Launch Extension Development Host

Press **F5** or:
- Open Run and Debug panel (Ctrl+Shift+D)
- Select "Run Extension"
- Click green play button

This opens a new VSCode window with your extension loaded.

### 3. Make Changes

Edit code → Save → Extension auto-reloads (in watch mode)

### 4. Reload Extension

After changes:
- **Cmd+R** (Mac) or **Ctrl+R** (Windows/Linux) in Extension Development Host
- Or: Cmd+Shift+P → "Developer: Reload Window"

### 5. View Logs

**Extension logs:**
- Help → Toggle Developer Tools → Console tab

**Webview logs:**
- Right-click in editor → "Inspect" → Console tab
- Or focus webview and press Cmd+Shift+I

## Debugging

### Debug Extension Code (Node.js)

1. Set breakpoints in `src/extension.ts` or `src/MarkdownWysiwygProvider.ts`
2. Press F5
3. Open a .md file with "Markdown WYSIWYG"
4. Breakpoints will hit in VSCode debugger

**Debug Console shows:**
- Extension activation
- File operations
- Message handling
- Errors

### Debug Webview Code (Browser)

1. Open Extension Development Host (F5)
2. Open a .md file with "Markdown WYSIWYG"
3. Right-click in editor → "Inspect"
4. Set breakpoints in Sources tab
5. Debug like a web app

**Console shows:**
- Vue component lifecycle
- TipTap editor events
- Markdown conversion
- postMessage communication

### Debug Both Simultaneously

1. Press F5 → Extension Development Host opens
2. Open .md file
3. VSCode debugger shows extension context
4. Open webview DevTools for browser context
5. Debug both at once!

## Making Changes

### Modify Extension Logic

**Example: Change how files are saved**

Edit `src/MarkdownWysiwygProvider.ts`:

```typescript
private updateTextDocument(document: vscode.TextDocument, markdown: string) {
  const edit = new vscode.WorkspaceEdit();

  // Add your custom logic here
  const processedMarkdown = markdown.trim(); // Example: trim whitespace

  edit.replace(
    document.uri,
    new vscode.Range(0, 0, document.lineCount, 0),
    processedMarkdown
  );

  return vscode.workspace.applyEdit(edit);
}
```

**Rebuild:**
```bash
npm run compile  # Or use watch mode
```

**Reload:** Cmd+R in Extension Development Host

### Modify Editor UI

**Example: Change placeholder text**

Edit `webview/Editor.vue`:

```vue
const editor = useEditor({
  extensions: [
    // ...
    Placeholder.configure({
      placeholder: 'Start writing your markdown...' // Changed
    }),
    // ...
  ]
});
```

**Rebuild:**
```bash
npm run compile  # Or use watch:webview
```

**Reload:** Cmd+R in Extension Development Host

### Modify Editor Styles

**Example: Change heading colors**

Edit `webview/editor.css`:

```css
.ProseMirror h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #ff6b6b; /* Changed to red */
  margin-bottom: 1rem;
}
```

**Rebuild:**
```bash
npm run compile
```

**Reload:** Cmd+R in Extension Development Host

### Modify Markdown Conversion

**Example: Add support for custom syntax**

Edit `webview/markdown.ts`:

```typescript
function processInlineFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    // Add your custom syntax here
    .replace(/==(.*?)==/g, '<mark>$1</mark>'); // Example: ==highlight==
}
```

**Rebuild and test with:**
```markdown
This is ==highlighted text==
```

## Common Tasks

### Add a New TipTap Extension

1. **Install extension:**
```bash
npm install @tiptap/extension-underline
```

2. **Import in Editor.vue:**
```vue
<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline'; // Add this

const editor = useEditor({
  extensions: [
    StarterKit.configure({ /* ... */ }),
    Underline, // Add this
    // ... other extensions
  ]
});
</script>
```

3. **Add styles if needed:**
```css
.ProseMirror u {
  text-decoration: underline;
}
```

4. **Update markdown parser to support the syntax**

### Add Keyboard Shortcuts

Edit `webview/Editor.vue`:

```vue
const editor = useEditor({
  extensions: [
    StarterKit,
    // Custom keyboard shortcuts
    Extension.create({
      addKeyboardShortcuts() {
        return {
          'Mod-u': () => this.editor.commands.toggleUnderline(),
          'Mod-Shift-x': () => this.editor.commands.toggleStrike(),
          // Add more shortcuts
        };
      },
    }),
  ]
});
```

### Add a Toolbar

Create `webview/Toolbar.vue`:

```vue
<template>
  <div class="toolbar">
    <button @click="editor.chain().focus().toggleBold().run()"
            :class="{ active: editor.isActive('bold') }">
      Bold
    </button>
    <button @click="editor.chain().focus().toggleItalic().run()"
            :class="{ active: editor.isActive('italic') }">
      Italic
    </button>
    <!-- More buttons -->
  </div>
</template>

<script setup lang="ts">
import { Editor } from '@tiptap/vue-3';

defineProps<{
  editor: Editor;
}>();
</script>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

button.active {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}
</style>
```

Import in `Editor.vue`:

```vue
<template>
  <div class="editor-container">
    <Toolbar v-if="editor" :editor="editor" />
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import Toolbar from './Toolbar.vue';
</script>
```

### Add Custom Annotation Node

Create `webview/extensions/Annotation.ts`:

```typescript
import { Node, mergeAttributes } from '@tiptap/core';

export const Annotation = Node.create({
  name: 'annotation',
  group: 'block',
  content: 'block+',

  addAttributes() {
    return {
      type: {
        default: 'comment',
      },
      author: {
        default: 'ai',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-annotation]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-annotation': '',
      class: 'annotation',
    }), 0];
  },
});
```

Add to Editor:

```vue
import { Annotation } from './extensions/Annotation';

const editor = useEditor({
  extensions: [
    // ...
    Annotation,
  ]
});
```

### Change File Association

Edit `package.json`:

```json
{
  "contributes": {
    "customEditors": [
      {
        "viewType": "markdownWysiwyg.editor",
        "displayName": "Markdown WYSIWYG",
        "selector": [
          { "filenamePattern": "*.md" },
          { "filenamePattern": "*.markdown" }, // Add more patterns
          { "filenamePattern": "*.mdown" }
        ],
        "priority": "option"  // Change to "default" to be default editor
      }
    ]
  }
}
```

### Add Configuration Options

Edit `package.json`:

```json
{
  "contributes": {
    "configuration": {
      "title": "Markdown WYSIWYG",
      "properties": {
        "markdownWysiwyg.fontSize": {
          "type": "number",
          "default": 16,
          "description": "Editor font size"
        },
        "markdownWysiwyg.showToolbar": {
          "type": "boolean",
          "default": false,
          "description": "Show formatting toolbar"
        }
      }
    }
  }
}
```

Read in extension:

```typescript
const config = vscode.workspace.getConfiguration('markdownWysiwyg');
const fontSize = config.get<number>('fontSize', 16);
```

Pass to webview:

```typescript
const html = this.getHtmlForWebview(webview, { fontSize });
```

## Architecture Deep Dive

### Message Flow

```
User types in editor
    ↓
TipTap onUpdate fires
    ↓
HTML → Markdown conversion (htmlToMarkdown)
    ↓
postMessage({ type: 'update', content: markdown })
    ↓
Extension receives message
    ↓
Updates VSCode TextDocument
    ↓
File saved to disk
```

### Markdown Round-Trip

```
File on disk (.md)
    ↓
Read as string (Node.js)
    ↓
Send to webview via postMessage
    ↓
Markdown → HTML (markdownToHtml)
    ↓
Set TipTap content (editor.commands.setContent)
    ↓
User edits
    ↓
HTML → Markdown (htmlToMarkdown)
    ↓
Send back to extension
    ↓
Write to file
```

### Key Files Explained

**src/extension.ts**
- Entry point: `activate()` and `deactivate()`
- Registers CustomTextEditorProvider
- VSCode lifecycle management

**src/MarkdownWysiwygProvider.ts**
- Implements `vscode.CustomTextEditorProvider`
- Creates webview HTML
- Handles file I/O
- Message passing with webview

**webview/main.ts**
- Webview entry point
- Creates Vue app
- Mounts editor

**webview/Editor.vue**
- TipTap editor setup
- Extensions configuration
- Update handling
- VSCode API communication

**webview/markdown.ts**
- `markdownToHtml()` - Parses markdown to HTML for TipTap
- `htmlToMarkdown()` - Converts TipTap HTML back to markdown
- Handles all formatting rules

**webview/editor.css**
- ProseMirror styles
- VSCode theme integration
- Typography and spacing

### VSCode API Usage

**Reading files:**
```typescript
const text = document.getText();
```

**Writing files:**
```typescript
const edit = new vscode.WorkspaceEdit();
edit.replace(document.uri, fullRange, newContent);
await vscode.workspace.applyEdit(edit);
```

**Watching file changes:**
```typescript
const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
  if (e.document.uri.toString() === document.uri.toString()) {
    updateWebview();
  }
});
```

**Sending to webview:**
```typescript
webview.postMessage({ type: 'update', content: markdown });
```

**Receiving from webview:**
```typescript
webview.onDidReceiveMessage(message => {
  switch (message.type) {
    case 'update':
      updateTextDocument(document, message.content);
      break;
  }
});
```

## Troubleshooting

### Build Errors

**"Cannot find module '*.vue'"**
- Ensure `webview/vue-shim.d.ts` exists
- Restart TypeScript server: Cmd+Shift+P → "TypeScript: Restart TS Server"

**"TS7016: Could not find declaration file for module 'X'"**
```bash
npm install --save-dev @types/X
```

**Webpack errors**
- Check `webpack.config.js` syntax
- Verify all loaders are installed
- Clear webpack cache: `rm -rf node_modules/.cache`

**TypeScript errors**
- Check `tsconfig.json` and `tsconfig.webview.json`
- Ensure `exclude` arrays don't conflict
- Run `tsc --noEmit` to check types

### Runtime Errors

**Extension doesn't activate**
- Check activation events in `package.json`
- View Output panel → "Extension Host"
- Check for errors in Debug Console

**Webview shows blank**
- Check webview console (right-click → Inspect)
- Verify `media/editor.js` exists
- Check CSP errors in console
- Ensure webview is getting content message

**Markdown conversion broken**
- Test with simple markdown first
- Check `webview/markdown.ts` for errors
- Log HTML before/after conversion
- Check turndown is working: `console.log(htmlToMarkdown('<p>test</p>'))`

**Styles not applying**
- Verify CSS is bundled in `media/editor.js`
- Check webpack CSS loader configuration
- Inspect element to see if styles are present
- Check VSCode theme variables are defined

### Common Issues

**Changes not appearing**
- Did you rebuild? (`npm run compile`)
- Did you reload Extension Development Host? (Cmd+R)
- Is watch mode running?
- Check you're editing the right file

**Breakpoints not hitting**
- Ensure source maps are generated
- Check `outFiles` in `launch.json`
- Restart debugger
- Extension code: Debug in main VSCode instance
- Webview code: Debug in DevTools

**Performance issues**
- Large files: Debounce updates (already implemented)
- Slow conversion: Profile `markdownToHtml`/`htmlToMarkdown`
- Memory leaks: Check editor cleanup in `onUnmounted`

### Getting Help

**Useful VSCode commands:**
- "Developer: Toggle Developer Tools" - Extension logs
- "Developer: Open Webview Developer Tools" - Webview logs
- "Developer: Reload Window" - Restart extension
- "TypeScript: Restart TS Server" - Fix IntelliSense

**Useful logs:**
```typescript
// Extension side
console.log('[Extension]', 'message');

// Webview side
props.vscode.postMessage({ type: 'log', message: 'debug info' });
```

**Check versions:**
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
code --version  # Should be 1.85+
```

## Best Practices

### Code Organization

- Keep extension logic in `src/`
- Keep webview logic in `webview/`
- No DOM manipulation in extension code
- No Node.js APIs in webview code

### Performance

- Debounce frequent operations (already done for updates)
- Clean up event listeners in `onUnmounted`
- Use `retainContextWhenHidden: true` sparingly
- Lazy load heavy dependencies

### Type Safety

- Add proper TypeScript types
- Don't use `any` unless necessary
- Use VSCode's type definitions
- Define message types for postMessage

### Testing

- Test with small files first
- Test with large files (>1000 lines)
- Test all markdown features
- Test light/dark themes
- Test external file changes
- Test save/reload cycle

### Git Workflow

```bash
# Make changes
git add .
git commit -m "feat: add underline support"

# Test thoroughly
npm run compile
# Press F5, test changes

# Push when ready
git push -u origin claude/vscode-plugin-extraction-Tk1sf
```

---

**Happy coding!** 🚀

For questions about specific features, check the official docs:
- [VSCode Extension API](https://code.visualstudio.com/api)
- [TipTap Documentation](https://tiptap.dev/)
- [Vue 3 Documentation](https://vuejs.org/)
