import { ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'

const editor = ref<Editor>()

export function useEditor() {
  return {
    editor
  }
} 