# Task 3: Annotation UI & Management

**Timeline:** Week 2, Days 1-3 (3-4 days)
**Goal:** Enhanced UI for managing annotations - sidebar, filters, statistics

## Overview

Build UI components to:
- View all annotations in a sidebar panel
- Filter by type, status, priority
- Jump to annotation in document
- Bulk accept/reject operations
- Statistics and summary views

## Step 1: Create Annotations Sidebar (2 hours)

Create `webview/components/AnnotationsSidebar.vue`:

```vue
<template>
  <div class="annotations-sidebar">
    <div class="sidebar-header">
      <h3>Annotations</h3>
      <button @click="$emit('close')" class="close-btn">✕</button>
    </div>

    <div class="sidebar-stats">
      <div class="stat-item">
        <span class="stat-count">{{ stats.pending }}</span>
        <span class="stat-label">Pending</span>
      </div>
      <div class="stat-item">
        <span class="stat-count">{{ stats.accepted }}</span>
        <span class="stat-label">Accepted</span>
      </div>
      <div class="stat-item">
        <span class="stat-count">{{ stats.rejected }}</span>
        <span class="stat-label">Rejected</span>
      </div>
    </div>

    <div class="sidebar-filters">
      <select v-model="filterType" class="filter-select">
        <option value="all">All Types</option>
        <option value="suggestion">Suggestions</option>
        <option value="question">Questions</option>
        <option value="issue">Issues</option>
        <option value="note">Notes</option>
      </select>

      <select v-model="filterStatus" class="filter-select">
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
        <option value="resolved">Resolved</option>
      </select>
    </div>

    <div class="sidebar-actions">
      <button @click="acceptAll" class="action-btn btn-accept-all">
        Accept All Pending
      </button>
      <button @click="rejectAll" class="action-btn btn-reject-all">
        Reject All Pending
      </button>
    </div>

    <div class="annotations-list">
      <div
        v-for="annotation in filteredAnnotations"
        :key="annotation.id"
        class="annotation-item"
        :class="`type-${annotation.type} status-${annotation.status}`"
        @click="jumpToAnnotation(annotation.id)"
      >
        <div class="annotation-item-header">
          <span class="annotation-icon">{{ getIcon(annotation.type) }}</span>
          <span class="annotation-type">{{ annotation.type }}</span>
          <span class="annotation-status-badge" :class="`status-${annotation.status}`">
            {{ annotation.status }}
          </span>
        </div>
        <div class="annotation-item-content">
          {{ annotation.content }}
        </div>
        <div class="annotation-item-meta">
          <span class="annotation-id">{{ annotation.id }}</span>
          <span v-if="annotation.priority" class="annotation-priority">
            {{ annotation.priority }}
          </span>
        </div>
        <div v-if="annotation.status === 'pending'" class="annotation-item-actions">
          <button @click.stop="accept(annotation.id)" class="btn-mini btn-accept">✓</button>
          <button @click.stop="reject(annotation.id)" class="btn-mini btn-reject">✗</button>
        </div>
      </div>

      <div v-if="filteredAnnotations.length === 0" class="empty-state">
        No annotations found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Annotation {
  id: string;
  type: 'suggestion' | 'question' | 'issue' | 'note';
  status: 'pending' | 'accepted' | 'rejected' | 'resolved';
  content: string;
  priority?: string;
  position?: number;
}

const props = defineProps<{
  annotations: Annotation[];
}>();

const emit = defineEmits<{
  close: [];
  accept: [id: string];
  reject: [id: string];
  jumpTo: [id: string];
  acceptAll: [];
  rejectAll: [];
}>();

const filterType = ref<string>('all');
const filterStatus = ref<string>('all');

const stats = computed(() => {
  const pending = props.annotations.filter(a => a.status === 'pending').length;
  const accepted = props.annotations.filter(a => a.status === 'accepted').length;
  const rejected = props.annotations.filter(a => a.status === 'rejected').length;

  return { pending, accepted, rejected };
});

const filteredAnnotations = computed(() => {
  return props.annotations.filter(annotation => {
    const typeMatch = filterType.value === 'all' || annotation.type === filterType.value;
    const statusMatch = filterStatus.value === 'all' || annotation.status === filterStatus.value;
    return typeMatch && statusMatch;
  });
});

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    suggestion: '💡',
    question: '❓',
    issue: '⚠️',
    note: '📝'
  };
  return icons[type] || '📝';
}

function accept(id: string) {
  emit('accept', id);
}

function reject(id: string) {
  emit('reject', id);
}

function jumpToAnnotation(id: string) {
  emit('jumpTo', id);
}

function acceptAll() {
  emit('acceptAll');
}

function rejectAll() {
  emit('rejectAll');
}
</script>

<style scoped>
.annotations-sidebar {
  width: 350px;
  height: 100vh;
  background: var(--vscode-sideBar-background);
  border-left: 1px solid var(--vscode-sideBar-border);
  display: flex;
  flex-direction: column;
  color: var(--vscode-sideBar-foreground);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--vscode-sideBar-border);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--vscode-sideBar-foreground);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
}

.sidebar-stats {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--vscode-editor-background);
  border-bottom: 1px solid var(--vscode-sideBar-border);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-count {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--vscode-charts-blue);
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  opacity: 0.7;
  text-transform: uppercase;
}

.sidebar-filters {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-bottom: 1px solid var(--vscode-sideBar-border);
}

.filter-select {
  width: 100%;
  padding: 0.5rem;
  background: var(--vscode-input-background);
  color: var(--vscode-input-foreground);
  border: 1px solid var(--vscode-input-border);
  border-radius: 0.25rem;
}

.sidebar-actions {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-bottom: 1px solid var(--vscode-sideBar-border);
}

.action-btn {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.8;
}

.btn-accept-all {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.btn-reject-all {
  background: var(--vscode-button-secondaryBackground);
  color: var(--vscode-button-secondaryForeground);
}

.annotations-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.annotation-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.annotation-item:hover {
  border-color: var(--vscode-focusBorder);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.annotation-item-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.annotation-icon {
  font-size: 1rem;
}

.annotation-type {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: capitalize;
}

.annotation-status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background: var(--vscode-charts-yellow);
  color: #000;
}

.status-accepted {
  background: var(--vscode-charts-green);
  color: #fff;
}

.status-rejected {
  background: var(--vscode-charts-red);
  color: #fff;
}

.annotation-item-content {
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.annotation-item-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.6;
}

.annotation-id {
  font-family: monospace;
}

.annotation-priority {
  padding: 0.125rem 0.375rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 0.25rem;
}

.annotation-item-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-mini {
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-mini:hover {
  opacity: 0.8;
}

.btn-accept {
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
}

.btn-reject {
  background: transparent;
  color: var(--vscode-foreground);
  border: 1px solid var(--vscode-input-border);
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  opacity: 0.6;
}
</style>
```

## Step 2: Integrate Sidebar with Editor (1 hour)

Update `webview/Editor.vue`:

```vue
<template>
  <div class="editor-wrapper">
    <div class="editor-main" :class="{ 'sidebar-open': showSidebar }">
      <div class="editor-toolbar">
        <button @click="toggleSidebar" class="toolbar-btn">
          📋 Annotations ({{ annotations.length }})
        </button>
      </div>
      <editor-content v-if="editor" :editor="editor" />
    </div>

    <transition name="slide">
      <annotations-sidebar
        v-if="showSidebar"
        :annotations="annotations"
        @close="showSidebar = false"
        @accept="acceptAnnotation"
        @reject="rejectAnnotation"
        @jump-to="jumpToAnnotation"
        @accept-all="acceptAllAnnotations"
        @reject-all="rejectAllAnnotations"
      />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AnnotationsSidebar from './components/AnnotationsSidebar.vue';

const showSidebar = ref(false);

const annotations = computed(() => {
  if (!editor.value) return [];

  const annots: any[] = [];

  editor.value.state.doc.descendants((node, pos) => {
    if (node.type.name === 'agentAnnotation') {
      annots.push({
        id: node.attrs.id,
        type: node.attrs.type,
        status: node.attrs.status,
        priority: node.attrs.priority,
        content: node.textContent,
        position: pos
      });
    }
  });

  return annots;
});

function toggleSidebar() {
  showSidebar.value = !showSidebar.value;
}

function acceptAnnotation(id: string) {
  editor.value?.commands.updateAnnotationStatus(id, 'accepted');
}

function rejectAnnotation(id: string) {
  editor.value?.commands.updateAnnotationStatus(id, 'rejected');
}

function jumpToAnnotation(id: string) {
  if (!editor.value) return;

  // Find annotation node position
  let targetPos = 0;
  editor.value.state.doc.descendants((node, pos) => {
    if (node.type.name === 'agentAnnotation' && node.attrs.id === id) {
      targetPos = pos;
      return false;
    }
  });

  // Scroll to position and highlight
  if (targetPos > 0) {
    editor.value.commands.focus();
    editor.value.commands.setTextSelection(targetPos);

    // Scroll into view
    const dom = editor.value.view.domAtPos(targetPos);
    if (dom.node) {
      (dom.node as Element).scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }
}

function acceptAllAnnotations() {
  annotations.value
    .filter(a => a.status === 'pending')
    .forEach(a => acceptAnnotation(a.id));
}

function rejectAllAnnotations() {
  annotations.value
    .filter(a => a.status === 'pending')
    .forEach(a => rejectAnnotation(a.id));
}
</script>

<style scoped>
.editor-wrapper {
  display: flex;
  height: 100vh;
}

.editor-main {
  flex: 1;
  transition: margin-right 0.3s;
}

.editor-main.sidebar-open {
  margin-right: 350px;
}

.editor-toolbar {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--vscode-panel-border);
  background: var(--vscode-editor-background);
}

.toolbar-btn {
  padding: 0.5rem 1rem;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.toolbar-btn:hover {
  background: var(--vscode-button-hoverBackground);
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
```

## Step 3: Add Keyboard Shortcuts (30 min)

Update `webview/Editor.vue` keyboard handler:

```typescript
function handleKeydown(e: KeyboardEvent) {
  // Cmd/Ctrl + S to save
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    props.vscode.postMessage({ type: 'save' });
  }

  // Cmd/Ctrl + Shift + A to toggle annotations sidebar
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
    e.preventDefault();
    toggleSidebar();
  }

  // Cmd/Ctrl + Shift + I to insert annotation
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'i') {
    e.preventDefault();
    // Trigger insert annotation
    props.vscode.postMessage({ type: 'insertAnnotation' });
  }
}
```

## Step 4: Add Status Bar Integration (1 hour)

Create status bar item in `src/MarkdownAnnotatorProvider.ts`:

```typescript
private statusBarItem: vscode.StatusBarItem;

constructor(private readonly context: vscode.ExtensionContext) {
  // Create status bar item
  this.statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  this.statusBarItem.command = 'markdownAnnotator.showAnnotations';
  context.subscriptions.push(this.statusBarItem);
}

private updateStatusBar(annotations: any[]) {
  const pending = annotations.filter(a => a.status === 'pending').length;
  const total = annotations.length;

  this.statusBarItem.text = `$(comment) ${pending}/${total} Annotations`;
  this.statusBarItem.tooltip = `${pending} pending annotations`;
  this.statusBarItem.show();
}
```

## Step 5: Add Export Annotations Feature (1 hour)

Create `src/commands/exportAnnotations.ts`:

```typescript
import * as vscode from 'vscode';

export interface Annotation {
  id: string;
  type: string;
  status: string;
  content: string;
  priority?: string;
  severity?: string;
  agent?: string;
  timestamp?: string;
}

export async function exportAnnotations(annotations: Annotation[]) {
  const format = await vscode.window.showQuickPick(
    ['JSON', 'CSV', 'Markdown'],
    { placeHolder: 'Select export format' }
  );

  if (!format) return;

  let content: string;
  let extension: string;

  switch (format) {
    case 'JSON':
      content = JSON.stringify(annotations, null, 2);
      extension = 'json';
      break;

    case 'CSV':
      content = annotationsToCSV(annotations);
      extension = 'csv';
      break;

    case 'Markdown':
      content = annotationsToMarkdown(annotations);
      extension = 'md';
      break;

    default:
      return;
  }

  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(`annotations.${extension}`),
    filters: {
      [format]: [extension]
    }
  });

  if (uri) {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
    vscode.window.showInformationMessage(`Annotations exported to ${uri.fsPath}`);
  }
}

function annotationsToCSV(annotations: Annotation[]): string {
  const headers = ['ID', 'Type', 'Status', 'Content', 'Priority', 'Severity', 'Agent', 'Timestamp'];
  const rows = annotations.map(a => [
    a.id,
    a.type,
    a.status,
    a.content.replace(/"/g, '""'),
    a.priority || '',
    a.severity || '',
    a.agent || '',
    a.timestamp || ''
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
}

function annotationsToMarkdown(annotations: Annotation[]): string {
  const grouped = annotations.reduce((acc, a) => {
    if (!acc[a.status]) acc[a.status] = [];
    acc[a.status].push(a);
    return acc;
  }, {} as Record<string, Annotation[]>);

  let md = '# Annotations Report\n\n';

  for (const [status, annots] of Object.entries(grouped)) {
    md += `## ${status.toUpperCase()} (${annots.length})\n\n`;
    for (const a of annots) {
      md += `### ${a.type}: ${a.id}\n`;
      md += `${a.content}\n\n`;
      if (a.priority) md += `**Priority:** ${a.priority}  \n`;
      if (a.severity) md += `**Severity:** ${a.severity}  \n`;
      if (a.agent) md += `**Agent:** ${a.agent}  \n`;
      md += '\n---\n\n';
    }
  }

  return md;
}
```

## Step 6: Testing (1 hour)

### Test Cases

1. **Sidebar Display**
   - Toggle sidebar open/close
   - Verify annotations list populates
   - Check stats are correct

2. **Filtering**
   - Filter by type (suggestion, question, etc.)
   - Filter by status (pending, accepted, etc.)
   - Combined filters work

3. **Actions**
   - Accept single annotation
   - Reject single annotation
   - Accept all pending
   - Reject all pending

4. **Navigation**
   - Click annotation to jump to it
   - Verify scroll and highlight

5. **Export**
   - Export as JSON
   - Export as CSV
   - Export as Markdown
   - Verify content is correct

### Testing Checklist

- ✅ Sidebar opens/closes smoothly
- ✅ Annotations count is accurate
- ✅ Filters work correctly
- ✅ Status updates reflect in both editor and sidebar
- ✅ Jump to annotation scrolls correctly
- ✅ Bulk operations work
- ✅ Export formats are valid
- ✅ Status bar shows correct counts
- ✅ Keyboard shortcuts work

## Deliverables

✅ Annotations sidebar component
✅ Statistics and counts
✅ Filter by type/status
✅ Jump to annotation functionality
✅ Bulk accept/reject operations
✅ Export annotations (JSON, CSV, Markdown)
✅ Status bar integration
✅ Keyboard shortcuts

## Next Task

**[ai-agent-integration.md](./ai-agent-integration.md)** - Integrate with AI agents to automatically generate annotations

---

**Estimated Time:** 3-4 days
**Difficulty:** Medium
**Dependencies:** Task 2 (Custom Annotation Extension)
