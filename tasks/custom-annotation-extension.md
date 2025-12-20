# Task 2: Custom Annotation Extension

**Timeline:** Week 1, Days 4-5 (2 days)
**Goal:** TipTap extension for AI agent annotations with custom markdown syntax

## Overview

Create a custom TipTap node extension that:
- Parses `<!--@agent:...@-->` syntax from markdown
- Renders annotations with visual indicators
- Supports different annotation types (suggestion, question, issue, note)
- Tracks annotation state (pending, accepted, rejected, resolved)

## Step 1: Define Annotation Syntax (30 min)

### Markdown Syntax Design

```markdown
<!--@agent:TYPE status="STATE" id="ID" [metadata]
Annotation content here
@-->
```

**Examples:**

```markdown
<!--@agent:suggestion status="pending" id="ann-001"
Consider adding error handling for this API call
@-->

<!--@agent:question status="pending" id="ann-002" priority="high"
Have you considered the edge case for empty arrays?
@-->

<!--@agent:issue status="accepted" id="ann-003" severity="critical"
This approach won't scale beyond 1000 items
@-->

<!--@agent:note status="resolved" id="ann-004"
Great implementation!
@-->
```

### Annotation Attributes

| Attribute | Type | Required | Values |
|-----------|------|----------|--------|
| type | string | ✅ | suggestion, question, issue, note |
| status | string | ✅ | pending, accepted, rejected, resolved |
| id | string | ✅ | Unique identifier (ann-XXX) |
| priority | string | ❌ | low, medium, high |
| severity | string | ❌ | info, warning, critical |
| agent | string | ❌ | Agent identifier |
| timestamp | string | ❌ | ISO timestamp |

## Step 2: Create TipTap Extension (2 hours)

Create `webview/extensions/AgentAnnotation.ts`:

```typescript
import { Node, mergeAttributes } from '@tiptap/core';
import { VueNodeViewRenderer } from '@tiptap/vue-3';
import AgentAnnotationView from '../components/AgentAnnotationView.vue';

export interface AgentAnnotationOptions {
  HTMLAttributes: Record<string, any>;
}

export interface AgentAnnotationAttributes {
  type: 'suggestion' | 'question' | 'issue' | 'note';
  status: 'pending' | 'accepted' | 'rejected' | 'resolved';
  id: string;
  priority?: 'low' | 'medium' | 'high';
  severity?: 'info' | 'warning' | 'critical';
  agent?: string;
  timestamp?: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    agentAnnotation: {
      /**
       * Insert an agent annotation
       */
      setAgentAnnotation: (attributes: AgentAnnotationAttributes) => ReturnType;
      /**
       * Update annotation status
       */
      updateAnnotationStatus: (id: string, status: string) => ReturnType;
    };
  }
}

export const AgentAnnotation = Node.create<AgentAnnotationOptions>({
  name: 'agentAnnotation',

  group: 'block',

  content: 'text*',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      type: {
        default: 'suggestion',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => ({
          'data-type': attributes.type
        })
      },
      status: {
        default: 'pending',
        parseHTML: element => element.getAttribute('data-status'),
        renderHTML: attributes => ({
          'data-status': attributes.status
        })
      },
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => ({
          'data-id': attributes.id
        })
      },
      priority: {
        default: null,
        parseHTML: element => element.getAttribute('data-priority'),
        renderHTML: attributes => {
          if (!attributes.priority) return {};
          return { 'data-priority': attributes.priority };
        }
      },
      severity: {
        default: null,
        parseHTML: element => element.getAttribute('data-severity'),
        renderHTML: attributes => {
          if (!attributes.severity) return {};
          return { 'data-severity': attributes.severity };
        }
      },
      agent: {
        default: null,
        parseHTML: element => element.getAttribute('data-agent'),
        renderHTML: attributes => {
          if (!attributes.agent) return {};
          return { 'data-agent': attributes.agent };
        }
      },
      timestamp: {
        default: null,
        parseHTML: element => element.getAttribute('data-timestamp'),
        renderHTML: attributes => {
          if (!attributes.timestamp) return {};
          return { 'data-timestamp': attributes.timestamp };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-agent-annotation]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-agent-annotation': ''
      }),
      0
    ];
  },

  addNodeView() {
    return VueNodeViewRenderer(AgentAnnotationView);
  },

  addCommands() {
    return {
      setAgentAnnotation:
        attributes =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
            content: [
              {
                type: 'text',
                text: attributes.content || ''
              }
            ]
          });
        },

      updateAnnotationStatus:
        (id, status) =>
        ({ tr, state }) => {
          let updated = false;

          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.id === id) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                status
              });
              updated = true;
              return false;
            }
          });

          return updated;
        }
    };
  }
});
```

## Step 3: Create Vue Component for Annotation Display (1.5 hours)

Create `webview/components/AgentAnnotationView.vue`:

```vue
<template>
  <node-view-wrapper class="agent-annotation" :class="annotationClasses">
    <div class="annotation-header">
      <div class="annotation-icon">
        <span v-if="node.attrs.type === 'suggestion'">💡</span>
        <span v-else-if="node.attrs.type === 'question'">❓</span>
        <span v-else-if="node.attrs.type === 'issue'">⚠️</span>
        <span v-else>📝</span>
      </div>
      <div class="annotation-meta">
        <span class="annotation-type">{{ node.attrs.type }}</span>
        <span class="annotation-id">{{ node.attrs.id }}</span>
        <span v-if="node.attrs.priority" class="annotation-priority">
          {{ node.attrs.priority }}
        </span>
      </div>
      <div class="annotation-status" :class="`status-${node.attrs.status}`">
        {{ node.attrs.status }}
      </div>
    </div>

    <node-view-content class="annotation-content" />

    <div class="annotation-actions" v-if="node.attrs.status === 'pending'">
      <button @click="acceptAnnotation" class="btn-accept">
        ✓ Accept
      </button>
      <button @click="rejectAnnotation" class="btn-reject">
        ✗ Reject
      </button>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3';

const props = defineProps(nodeViewProps);

const annotationClasses = computed(() => {
  return [
    `annotation-${props.node.attrs.type}`,
    `status-${props.node.attrs.status}`,
    props.node.attrs.priority ? `priority-${props.node.attrs.priority}` : '',
    props.node.attrs.severity ? `severity-${props.node.attrs.severity}` : ''
  ].filter(Boolean);
});

function acceptAnnotation() {
  props.editor.commands.updateAnnotationStatus(
    props.node.attrs.id,
    'accepted'
  );
}

function rejectAnnotation() {
  props.editor.commands.updateAnnotationStatus(
    props.node.attrs.id,
    'rejected'
  );
}
</script>

<style scoped>
.agent-annotation {
  margin: 1rem 0;
  border-radius: 0.5rem;
  border: 2px solid;
  overflow: hidden;
  transition: all 0.2s;
}

/* Type-based colors */
.annotation-suggestion {
  border-color: var(--vscode-charts-blue, #0078d4);
  background: var(--vscode-charts-blue, rgba(0, 120, 212, 0.1));
}

.annotation-question {
  border-color: var(--vscode-charts-purple, #8a2be2);
  background: rgba(138, 43, 226, 0.1);
}

.annotation-issue {
  border-color: var(--vscode-charts-red, #e74856);
  background: rgba(231, 72, 86, 0.1);
}

.annotation-note {
  border-color: var(--vscode-charts-green, #107c10);
  background: rgba(16, 124, 16, 0.1);
}

/* Status modifiers */
.status-accepted {
  opacity: 0.7;
  border-style: dashed;
}

.status-rejected {
  opacity: 0.5;
  text-decoration: line-through;
}

.status-resolved {
  opacity: 0.6;
}

/* Header */
.annotation-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.annotation-icon {
  font-size: 1.25rem;
}

.annotation-meta {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.annotation-type {
  font-weight: 600;
  text-transform: capitalize;
}

.annotation-id {
  opacity: 0.6;
  font-family: monospace;
  font-size: 0.75rem;
}

.annotation-priority {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  background: rgba(0, 0, 0, 0.1);
  font-size: 0.75rem;
  text-transform: uppercase;
}

.annotation-status {
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background: var(--vscode-charts-yellow, #ffb900);
  color: #000;
}

.status-accepted {
  background: var(--vscode-charts-green, #107c10);
  color: #fff;
}

.status-rejected {
  background: var(--vscode-charts-red, #e74856);
  color: #fff;
}

.status-resolved {
  background: var(--vscode-charts-blue, #0078d4);
  color: #fff;
}

/* Content */
.annotation-content {
  padding: 1rem;
  font-size: 0.95rem;
  line-height: 1.6;
}

/* Actions */
.annotation-actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.02);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.annotation-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-accept {
  background: var(--vscode-button-background, #0078d4);
  color: var(--vscode-button-foreground, #fff);
}

.btn-accept:hover {
  background: var(--vscode-button-hoverBackground, #005a9e);
}

.btn-reject {
  background: transparent;
  color: var(--vscode-foreground);
  border: 1px solid var(--vscode-input-border);
}

.btn-reject:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>
```

## Step 4: Update Markdown Parser (1 hour)

Update `webview/utils/markdown.ts` to parse annotation syntax:

```typescript
import TurndownService from 'turndown';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-'
});

// Custom rule for agent annotations
turndownService.addRule('agentAnnotation', {
  filter: node => {
    return (
      node.nodeName === 'DIV' &&
      node.hasAttribute('data-agent-annotation')
    );
  },
  replacement: (content, node: any) => {
    const type = node.getAttribute('data-type') || 'note';
    const status = node.getAttribute('data-status') || 'pending';
    const id = node.getAttribute('data-id') || 'unknown';
    const priority = node.getAttribute('data-priority');
    const severity = node.getAttribute('data-severity');
    const agent = node.getAttribute('data-agent');

    let attrs = `type="${type}" status="${status}" id="${id}"`;
    if (priority) attrs += ` priority="${priority}"`;
    if (severity) attrs += ` severity="${severity}"`;
    if (agent) attrs += ` agent="${agent}"`;

    return `\n<!--@agent:${type} ${attrs}\n${content.trim()}\n@-->\n`;
  }
});

export function htmlToMarkdown(html: string): string {
  return turndownService.turndown(html);
}

export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Parse agent annotations
  const annotationRegex = /<!--@agent:(\w+)\s+([^>]+)\n([\s\S]*?)\n@-->/g;

  html = html.replace(annotationRegex, (match, type, attrsStr, content) => {
    // Parse attributes
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w+)="([^"]+)"/g;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    // Build HTML
    let dataAttrs = `data-agent-annotation data-type="${type}"`;
    Object.entries(attrs).forEach(([key, value]) => {
      dataAttrs += ` data-${key}="${value}"`;
    });

    return `<div ${dataAttrs}>${content.trim()}</div>`;
  });

  // Standard markdown conversion
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  html = html.replace(/^(?!<[h|d]|```)(.+)$/gm, '<p>$1</p>');

  return html;
}
```

## Step 5: Update Editor to Use Extension (30 min)

Update `webview/Editor.vue`:

```typescript
import { AgentAnnotation } from './extensions/AgentAnnotation';

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
    TaskItem.configure({ nested: true }),
    AgentAnnotation // Add custom extension
  ],
  // ... rest of config
});
```

## Step 6: Add Insert Annotation Command (45 min)

Create `src/commands/insertAnnotation.ts`:

```typescript
import * as vscode from 'vscode';

export function registerInsertAnnotationCommand(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand(
    'markdownAnnotator.insertAnnotation',
    async () => {
      // Get annotation type
      const type = await vscode.window.showQuickPick(
        ['suggestion', 'question', 'issue', 'note'],
        { placeHolder: 'Select annotation type' }
      );

      if (!type) return;

      // Get content
      const content = await vscode.window.showInputBox({
        prompt: 'Enter annotation content',
        placeHolder: 'Your annotation...'
      });

      if (!content) return;

      // Generate ID
      const id = `ann-${Date.now().toString(36)}`;

      // Send to webview
      // (This requires storing active webview reference)
      const annotation = {
        type,
        status: 'pending',
        id,
        content,
        timestamp: new Date().toISOString()
      };

      // Post message to webview
      context.workspaceState.update('pendingAnnotation', annotation);
    }
  );
}
```

Update `src/extension.ts` to register command:

```typescript
import { registerInsertAnnotationCommand } from './commands/insertAnnotation';

export function activate(context: vscode.ExtensionContext) {
  // ... existing code

  context.subscriptions.push(
    registerInsertAnnotationCommand(context)
  );
}
```

## Step 7: Test Annotation Extension (1 hour)

### Test Cases

1. **Manual Insertion**
   ```markdown
   # Test Document

   Regular paragraph.

   <!--@agent:suggestion status="pending" id="ann-001"
   This is a test suggestion
   @-->

   More content.
   ```

2. **Different Types**
   - Test suggestion (blue)
   - Test question (purple)
   - Test issue (red)
   - Test note (green)

3. **Status Changes**
   - Click "Accept" - should update status
   - Click "Reject" - should update status
   - Verify markdown updates correctly

4. **Round-trip**
   - Open markdown with annotations
   - Edit in WYSIWYG
   - Save
   - Reopen - annotations should persist

### Testing Checklist

- ✅ Annotations parse from markdown correctly
- ✅ Annotations display with correct styling
- ✅ Accept/reject buttons work
- ✅ Status updates reflected in markdown
- ✅ Different types show different colors
- ✅ Icons display correctly
- ✅ Metadata attributes preserved
- ✅ Round-trip conversion preserves data

## Troubleshooting

### Annotations not rendering
- Check if extension is registered in Editor.vue
- Verify parseHTML() rule matches your HTML structure
- Check browser console for errors

### Accept/reject not working
- Verify `updateAnnotationStatus` command is working
- Check if ID matching is correct
- Add console.log to debug

### Markdown conversion broken
- Test regex patterns separately
- Verify attribute parsing
- Check HTML structure matches parseHTML()

## Deliverables

✅ Custom TipTap AgentAnnotation extension
✅ Vue component for annotation display
✅ Markdown parser supporting annotation syntax
✅ Accept/reject functionality
✅ Visual styling for different types/states
✅ Insert annotation command

## Next Task

**[annotation-ui.md](./annotation-ui.md)** - Build enhanced UI for managing annotations (sidebar panel, filters, etc.)

---

**Estimated Time:** 2 days
**Difficulty:** Medium-Hard
**Dependencies:** Task 1 (VSCode Extension Setup)
