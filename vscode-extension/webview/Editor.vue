<template>
  <div class="editor-container">
    <editor-content v-if="editor" :editor="editor" />
    <div v-else class="loading">Loading editor...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { markdownToHtml, htmlToMarkdown } from './markdown';

const props = defineProps<{
  vscode: any
}>();

const isDirty = ref(false);
let updateTimeout: NodeJS.Timeout | null = null;

// Create TipTap editor - exact config from Slate
const editor = useEditor({
  content: '',
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'code-block',
        },
        exitOnTripleEnter: true,
        exitOnArrowDown: true,
        languageClassPrefix: 'language-',
      }
    }),
    Placeholder.configure({
      placeholder: 'Start writing...'
    }),
    Image,
    Link,
    TaskList,
    TaskItem.configure({
      nested: true
    })
  ],
  onUpdate: ({ editor }) => {
    isDirty.value = true;
    const html = editor.getHTML();

    // Debounce updates - 300ms like Slate (reduced from 1500)
    if (updateTimeout) clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
      // Convert HTML to markdown before sending
      const markdown = htmlToMarkdown(html);
      props.vscode.postMessage({
        type: 'update',
        content: markdown
      });
      isDirty.value = false;
    }, 300);
  }
});

// Listen for messages from extension
onMounted(() => {
  window.addEventListener('message', handleMessage);
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

<style src="./editor.css"></style>
