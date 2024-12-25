import { ref } from 'vue'

const workspace = ref<string | null>(null)

export function useWorkspace() {
  return workspace
} 