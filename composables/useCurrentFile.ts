import { ref } from 'vue'

const currentFile = ref<string | null>(null)

export function useCurrentFile() {
  return currentFile
} 