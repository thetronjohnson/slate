<template>
  <div class="min-h-screen bg-white font-manrope">
    <!-- Workspace Selection Modal -->
    <div v-if="!workspace" 
      class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
        <!-- Welcome Header -->
        <div class="p-8 text-center border-b border-slate-100">
          <div class="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Icon name="ph:notebook" class="w-6 h-6 text-blue-500" />
          </div>
          <h2 class="text-2xl font-semibold text-slate-800 mb-2">Welcome to Slate</h2>
          <p class="text-slate-600 max-w-sm mx-auto">
            Your minimal markdown editor for distraction-free writing and note-taking
          </p>
        </div>

        <!-- Features Grid -->
        <div class="grid grid-cols-2 gap-4 p-8 border-b border-slate-100">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Icon name="ph:file-text" class="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 class="text-sm font-medium text-slate-800 mb-1">Markdown Support</h3>
              <p class="text-xs text-slate-500">Write in markdown with live preview and syntax highlighting</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Icon name="ph:folder-simple" class="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h3 class="text-sm font-medium text-slate-800 mb-1">File Organization</h3>
              <p class="text-xs text-slate-500">Keep your notes organized in folders and subfolders</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Icon name="ph:keyboard" class="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 class="text-sm font-medium text-slate-800 mb-1">Keyboard Friendly</h3>
              <p class="text-xs text-slate-500">Quick shortcuts and commands for efficient writing</p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
              <Icon name="ph:paint-brush" class="w-4 h-4 text-rose-500" />
            </div>
            <div>
              <h3 class="text-sm font-medium text-slate-800 mb-1">Minimal Design</h3>
              <p class="text-xs text-slate-500">Clean interface for distraction-free writing</p>
            </div>
          </div>
        </div>

        <!-- Action Section -->
        <div class="p-8">
          <button 
            @click="selectWorkspace"
            class="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
          >
            <Icon name="ph:folder-simple" class="w-5 h-5" />
            Choose Workspace Folder
          </button>
          <p class="text-xs text-slate-500 text-center mt-4">
            Select an existing folder or create a new one for your workspace. 
            Use the file explorer's "New Folder" option to create a new workspace.
          </p>
        </div>
      </div>
    </div>

    <div class="min-h-screen bg-white flex flex-col">
      <!-- Fixed top section -->
      <div class="flex flex-col bg-white z-20">
        <!-- Add fixed height for consistent spacing -->
        <div class="h-[2px] bg-white"></div>
        <TitleBar :title="currentFile?.name?.replace('.md', '') || 'Untitled'" />
      </div>

      <!-- Main Layout with fixed header -->
      <div class="flex flex-1 relative">
        <!-- Collapsible Sidebar -->
        <div 
          class="flex flex-col border-r border-slate-200 transition-all duration-300 ease-in-out bg-white group/sidebar h-[calc(100vh-48px)] sticky top-[48px]"
          :class="[isSidebarOpen ? 'w-[280px]' : 'w-[48px]']"
        >
          <!-- Quick Actions -->
          <div class="flex-shrink-0" v-show="isSidebarOpen">
            <div class="p-3 border-slate-200">
              <div class="flex items-center gap-2">
                <div class="flex items-center bg-white/70 backdrop-blur-sm rounded-lg border border-slate-200 shadow-sm flex-1 overflow-hidden">
                  <button 
                    @click="isSidebarOpen = !isSidebarOpen"
                    class="p-2 hover:bg-slate-50 transition-colors"
                    :title="isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'"
                  >
                    <Icon
                      :name="isSidebarOpen ? 'ph:caret-left' : 'ph:caret-right'"
                      class="w-4 h-4 text-slate-500"
                    />
                  </button>
                  <button 
                    @click="changeWorkspace"
                    class="flex items-center gap-1 px-2 py-1 text-slate-600 action-button flex-1 border-r border-slate-200/60 truncate group"
                    :title="workspace?.split('/').pop()"
                  >
                    <Icon name="ph:folder-simple" class="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                    <span class="text-sm font-medium truncate">{{ workspace?.split('/').pop() }}</span>
                  </button>
                  <button 
                    @click="showNewFileModal = true"
                    class="p-1 text-slate-400 action-button border-slate-200/60 group"
                    title="New File"
                  >
                    <Icon name="ph:file-plus" class="w-4 h-4 group-hover:text-slate-600" />
                  </button>
                  <button 
                    @click="showNewFolderModal = true"
                    class="p-1 text-slate-400 action-button group"
                    title="New Folder"
                  >
                    <Icon name="ph:folder-plus" class="w-4 h-4 group-hover:text-slate-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Scrollable File Tree -->
          <div 
            class="flex-1 overflow-y-auto custom-scrollbar px-1 overscroll-contain"
            v-show="isSidebarOpen"
          >
            <div v-if="!fileTree.length" class="p-4 text-center">
              <div v-if="isSidebarOpen" class="text-xs text-slate-400">
                <p>No files yet</p>
                <button 
                  @click="showNewFileModal = true"
                  class="mt-2 px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-md transition-colors inline-flex items-center gap-1.5"
                >
                  <Icon name="ph:plus" class="w-4 h-4" />
                  Create a file
                </button>
              </div>
            </div>
            <div v-else class="py-2">
              <FileTreeItem 
                v-for="item in fileTree" 
                :key="item.path"
                :item="item"
                :current-file="currentFile"
                :isSidebarOpen="isSidebarOpen"
                @select="handleItemSelect"
                @delete="handleDeleteFile"
                @rename="(oldPath, newPath) => handleRename(oldPath, newPath)"
                @newFile="handleNewFileInFolder"
                @newFolder="handleNewFolderInFolder"
              />
            </div>
          </div>

          <!-- Add collapsed view content -->
          <div 
            v-show="!isSidebarOpen" 
            class="flex-1 flex flex-col items-center pt-12 gap-2"
          >
            <!-- Toggle Button for collapsed state -->
            <button
              @click="isSidebarOpen = !isSidebarOpen"
              class="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-white hover:shadow-custom hover:border border-slate-200/70"
              :title="isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'"
            >
              <Icon
                name="ph:caret-right"
                class="w-4 h-4"
              />
            </button>
            <!-- New File button -->
            <button 
              @click="showNewFileModal = true"
              class="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-white hover:shadow-custom hover:border border-slate-200/70"
              title="New File"
            >
              <Icon name="ph:plus" class="w-4 h-4" />
            </button>

            <!-- Show Files button -->
            <button
              class="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-white hover:shadow-custom hover:border border-slate-200/70"
              @click="isSidebarOpen = true"
              title="Show files"
            >
              <Icon name="ph:files" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Editor Area -->
        <div class="flex-1 flex flex-col h-[calc(100vh-48px)] sticky top-[48px]">
          <!-- Fixed Header -->
          <div class="flex-shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-sm z-10">
            <header class="px-6 h-[48px] flex items-center justify-between">
              <div class="flex items-center gap-3">
                <h1 class="text-sm text-slate-800 font-medium">
                  {{ currentFile?.name?.replace('.md', '') || 'Untitled' }}
                </h1>
                <span 
                  v-if="hasUnsavedChanges" 
                  class="w-1.5 h-1.5 rounded-full bg-blue-400"
                  title="Unsaved changes"
                ></span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm text-slate-400" v-if="lastSaved">
                  Saved {{ lastSaved }}
                </span>
                <button 
                  class="text-sm flex items-center gap-2 px-3 py-1.5 rounded-md transition-all duration-200"
                  :class="hasUnsavedChanges ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-500 hover:bg-slate-50'"
                  @click="currentFile && saveFile(currentFile)"
                >
                  <Icon 
                    :name="hasUnsavedChanges ? 'ph:floppy-disk-fill' : 'ph:floppy-disk'" 
                    class="w-4 h-4"
                  />
                  Save
                </button>
              </div>
            </header>
          </div>

          <!-- Scrollable Editor -->
          <div class="flex-1 overflow-hidden">
        <MarkdownEditor 
          v-model="content" 
          class="h-full"
          @update:modelValue="handleContentUpdate"
        />
          </div>
        </div>
      </div>

      <!-- Status Messages -->
      <Transition
        enter-active-class="transform transition duration-300"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transform transition duration-200"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <div 
          v-if="statusMessage" 
          class="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm shadow-lg"
        >
          {{ statusMessage }}
        </div>
      </Transition>
    </div>

    <!-- New File Modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="showNewFileModal"
        class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="showNewFileModal = false"
      >
        <div class="bg-white rounded-xl shadow-lg border border-slate-200/60 p-6 max-w-sm w-full mx-4">
          <div class="flex items-center gap-3 mb-4">
            <Icon name="ph:file-plus" class="w-4 h-4 text-blue-500" />
            <h3 class="text-base font-medium text-slate-800">New File</h3>
          </div>
          <div class="relative">
            <input 
              v-model="newFileName"
              type="text"
              placeholder="Untitled.md"
              class="w-full px-2 py-1.5 bg-white border border-slate-200/70 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all pr-8"
              @keyup.enter="handleCreateFile"
              @keyup.esc="showNewFileModal = false"
              ref="newFileInput"
            />
            <span class="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400">.md</span>
          </div>
          <div class="flex justify-end gap-2 mt-3">
            <button 
              @click="showNewFileModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="handleCreateFile"
              class="px-2.5 py-1.5 bg-blue-500 text-white text-sm rounded primary-button"
              :disabled="!newFileName"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- New Folder Modal -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        v-if="showNewFolderModal"
        class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50"
        @click.self="showNewFolderModal = false"
      >
        <div class="bg-white rounded-xl shadow-lg border border-slate-200/60 p-6 max-w-sm w-full mx-4">
          <div class="flex items-center gap-3 mb-4">
            <Icon name="ph:folder-plus" class="w-4 h-4 text-blue-500" />
            <h3 class="text-base font-medium text-slate-800">New Folder</h3>
          </div>
          <div class="relative">
            <input 
              v-model="newFolderName"
              type="text"
              placeholder="Folder name"
              class="w-full px-2 py-1.5 bg-white border border-slate-200/70 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              @keyup.enter="handleCreateFolder"
              @keyup.esc="showNewFolderModal = false"
              ref="newFolderInput"
            />
          </div>
          <div class="flex justify-end gap-2 mt-3">
            <button 
              @click="showNewFolderModal = false"
              class="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              @click="handleCreateFolder"
              class="px-2.5 py-1.5 bg-blue-500 text-white text-sm rounded primary-button"
              :disabled="!newFolderName"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'

interface File {
  name: string
  path: string
  content?: string
  lastSaved?: string
}

const workspace = ref<string | null>(null)
const files = ref<File[]>([])
const currentFile = ref<File | null>(null)
const title = ref('')
const content = ref('')
const isScrolled = ref(false)
const isHeaderHovered = ref(false)
const lastSaved = ref('')
const statusMessage = ref('')
const showNewFileModal = ref(false)
const newFileName = ref('')
const newFileInput = ref<HTMLInputElement>()
const isSidebarOpen = ref(true)
const hasUnsavedChanges = ref(false)
const originalContent = ref('')
const showNewFolderModal = ref(false)
const newFolderName = ref('')
const newFolderInput = ref<HTMLInputElement>()
const fileTree = ref<Array<any>>([])
const selectedFolderPath = ref<string | null>(null)
const lastOpenedFilePath = ref('')

const MARKDOWN_TEMPLATE = `# Welcome to Your New Document

This is a quick guide to Markdown formatting:

## Basic Syntax

### Headers
Use # for different levels:
# Heading 1
## Heading 2
### Heading 3

### Emphasis
*This text is italic*
**This text is bold**
***This text is bold and italic***

### Lists
Unordered list:
- Item 1
- Item 2
  - Nested item
  - Another nested item

Numbered list:
1. First item
2. Second item
3. Third item

### Links and Images
[Link text](URL)
![Image alt text](image URL)

### Code
For inline code, use single backticks: \`like this\`

Code block:
\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### Quotes
> This is a blockquote
> You can have multiple lines

### Horizontal Rule
Use three dashes:
---

Start writing below this guide. You can delete it anytime.`

function formatDateTime(isoString: string) {
  try {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  } catch (error) {
    return ''
  }
}

// Load workspace from electron store
onMounted(async () => {
  if (window.require) {
    const { ipcRenderer } = window.require('electron')
    const savedWorkspace = await ipcRenderer.invoke('get-workspace')
    if (savedWorkspace) {
      workspace.value = savedWorkspace
      await loadFileTree()
    }

    // Add workspace change listener
    ipcRenderer.on('workspace-changed', async (event, newWorkspace) => {
      workspace.value = newWorkspace
      await loadFileTree()
    })
  }
})

async function selectWorkspace() {
  if (!window.require) return
  const { ipcRenderer } = window.require('electron')
  
  try {
    const result = await ipcRenderer.invoke('select-workspace')
    if (result.success && result.path) {
      workspace.value = result.path
      localStorage.setItem('workspace', workspace.value)
      
      // Clear current file when changing workspace
      currentFile.value = null
      content.value = ''
      
      await loadFileTree()
      return result.path
    }
    return null
  } catch (error) {
    console.error('Error selecting workspace:', error)
    return null
  }
}

async function loadFiles() {
  if (window.require && workspace.value) {
    const { ipcRenderer } = window.require('electron')
    const fileList = await ipcRenderer.invoke('get-files', workspace.value)
    files.value = fileList
  }
}

async function createNewFile() {
  if (!workspace.value) return
  
  const fileName = `untitled-${Date.now()}.md`
  const filePath = `${workspace.value}/${fileName}`
  
  const newFile: File = {
    name: fileName,
    path: filePath,
    content: MARKDOWN_TEMPLATE
  }
  
  await saveFile(newFile)
  files.value.push(newFile)
  openFile(newFile)
}

async function openFile(file: File) {
  if (currentFile.value && hasUnsavedChanges.value) {
    const shouldSave = await showUnsavedChangesDialog()
    if (shouldSave) {
      await saveFile(currentFile.value)
    }
  }

  if (window.require) {
    const { ipcRenderer } = window.require('electron')
    try {
      const fileContent = await ipcRenderer.invoke('read-file', file.path)
      
      currentFile.value = file
      title.value = file.name.replace('.md', '')
      content.value = fileContent
      originalContent.value = fileContent
      hasUnsavedChanges.value = false
      
    } catch (error) {
      showStatus('Error opening file')
    }
  }
}

async function saveFile(file: File) {
  if (window.require) {
    const { ipcRenderer } = window.require('electron')
    try {
      const contentToSave = content.value || file.content || MARKDOWN_TEMPLATE
      
      await ipcRenderer.invoke('save-file', {
        path: file.path,
        content: contentToSave
      })
      
      const stats = await ipcRenderer.invoke('get-file-stats', file.path)
      const timeString = stats ? formatDateTime(stats.mtime) : ''
      
      originalContent.value = contentToSave
      content.value = contentToSave
      hasUnsavedChanges.value = false
      lastSaved.value = timeString
      
      if (currentFile.value) {
        currentFile.value.lastSaved = timeString
      }
      
      showStatus('File saved')
      
    } catch (error) {
      console.error('Error saving file:', error)
      showStatus('Error saving file')
    }
  }
}

function handleContentUpdate(newContent: string) {
  content.value = newContent
  hasUnsavedChanges.value = content.value !== originalContent.value
}

function handleTitleChange() {
  if (currentFile.value && title.value) {
    const newPath = `${workspace.value}/${title.value}.md`
    renameFile(currentFile.value.path, newPath)
  }
}

async function renameFile(oldPath: string, newPath: string) {
  if (window.require) {
    const { ipcRenderer } = window.require('electron')
    try {
      await ipcRenderer.invoke('rename-file', { oldPath, newPath })
      await loadFileTree() // Refresh the file tree
      showStatus('File renamed')
    } catch (error) {
      showStatus('Error renaming file')
    }
  }
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  isScrolled.value = target.scrollTop > 50
}

// Handle keyboard shortcuts
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      if (currentFile.value) {
        saveFile(currentFile.value)
      }
    }
  })
})

// Add back the showStatus function that was accidentally removed
function showStatus(message: string) {
  statusMessage.value = message
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

// Focus input when modal opens
watch(showNewFileModal, (value) => {
  if (value) {
    nextTick(() => {
      newFileInput.value?.focus()
    })
  } else {
    newFileName.value = ''
  }
})

async function handleCreateFile() {
  if (!newFileName.value) return

  const fileName = newFileName.value.endsWith('.md') 
    ? newFileName.value 
    : `${newFileName.value}.md`

  const filePath = `${selectedFolderPath.value || workspace.value}/${fileName}`
  
  const newFile: File = {
    name: fileName,
    path: filePath,
    content: MARKDOWN_TEMPLATE
  }
  
  try {
    // First save the file with template
    await saveFile(newFile)
    // Then load the file tree
    await loadFileTree()
    showNewFileModal.value = false
    newFileName.value = ''
    selectedFolderPath.value = null
    // Finally open the file
    await openFile(newFile)
    showStatus('File created')
  } catch (error) {
    showStatus('Error creating file')
  }
}

function showUnsavedChangesDialog(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron')
      ipcRenderer.invoke('show-save-dialog', {
        message: 'Do you want to save the changes?',
        detail: "Your changes will be lost if you don't save them.",
      }).then((result) => {
        resolve(result)
      })
    } else {
      resolve(window.confirm('Do you want to save the changes?'))
    }
  })
}

onMounted(() => {
  if (window.require) {
    const { ipcRenderer } = window.require('electron')
    
    // Handle window close
    ipcRenderer.on('window-close-triggered', async () => {
      if (hasUnsavedChanges.value) {
        const shouldSave = await showUnsavedChangesDialog()
        if (shouldSave) {
          await saveFile(currentFile.value!)
        }
      }
      ipcRenderer.send('can-close')
    })
  }
})

async function loadFileTree() {
  if (!window.require) return
  const { ipcRenderer } = window.require('electron')
  
  try {
    const structure = await ipcRenderer.invoke('get-folder-structure', workspace.value)
    fileTree.value = structure

    // Get last opened file path from localStorage
    const savedFilePath = localStorage.getItem(`lastOpenedFile-${workspace.value}`)
    
    if (savedFilePath) {
      // Find the file in the tree structure
      const findFile = (items: any[]): any => {
        for (const item of items) {
          if (item.type === 'markdown' && item.path === savedFilePath) {
            return item
          }
          if (item.type === 'folder' && item.children) {
            const found = findFile(item.children)
            if (found) return found
          }
        }
        return null
      }

      const file = findFile(structure)
      if (file) {
        // Ensure we wait for the file to be loaded
        await handleItemSelect(file)
      } else {
        // If the last opened file doesn't exist anymore, clear the stored path
        localStorage.removeItem(`lastOpenedFile-${workspace.value}`)
      }
    }
  } catch (error) {
    console.error('Error loading files:', error)
  }
}

async function changeWorkspace() {
  if (hasUnsavedChanges.value) {
    const shouldSave = await showUnsavedChangesDialog()
    if (shouldSave) {
      await saveFile(currentFile.value!)
    }
  }
  
  try {
    const { ipcRenderer } = window.require('electron')
    const result = await ipcRenderer.invoke('change-workspace')
    
    if (result.success && result.path) {
      workspace.value = result.path
      currentFile.value = null
      content.value = ''
      await loadFileTree()
      showStatus('Workspace changed successfully')
    }
  } catch (error) {
    console.error('Error changing workspace:', error)
    showStatus('Error changing workspace')
  }
}

async function handleCreateFolder() {
  if (!newFolderName.value) return
  
  const folderPath = `${selectedFolderPath.value || workspace.value}/${newFolderName.value}`
  
  if (window.require) {
    const { ipcRenderer } = window.require('electron')
    try {
      const created = await ipcRenderer.invoke('create-folder', folderPath)
      
      if (created) {
        await loadFileTree()
        showNewFolderModal.value = false
        newFolderName.value = ''
        selectedFolderPath.value = null
        showStatus('Folder created')
      } else {
        showStatus('Error creating folder')
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      showStatus('Error creating folder')
    }
  }
}

async function handleItemSelect(item: any) {
  if (item.type !== 'markdown') return
  
  try {
    const { ipcRenderer } = window.require('electron')
    const [fileContent, stats] = await Promise.all([
      ipcRenderer.invoke('read-file', item.path),
      ipcRenderer.invoke('get-file-stats', item.path)
    ])
    
    const lastSavedTime = stats ? formatDateTime(stats.mtime) : ''
    
    currentFile.value = {
      name: item.name,
      path: item.path,
      lastSaved: lastSavedTime
    }
    content.value = fileContent
    originalContent.value = fileContent
    hasUnsavedChanges.value = false
    title.value = item.name.replace('.md', '')
    lastSaved.value = lastSavedTime
    
    localStorage.setItem(`lastOpenedFile-${workspace.value}`, item.path)
  } catch (error) {
    console.error('Error reading file:', error)
    showStatus('Error opening file')
    localStorage.removeItem(`lastOpenedFile-${workspace.value}`)
  }
}

// Add focus handling for new folder modal
watch(showNewFolderModal, (value) => {
  if (value) {
    nextTick(() => {
      newFolderInput.value?.focus()
    })
  } else {
    newFolderName.value = ''
  }
})

// Add delete file handler
async function handleDeleteFile(file: any) {
  if (!window.require) return

  const { ipcRenderer } = window.require('electron')
  
  // Show delete confirmation dialog
  const { response } = await ipcRenderer.invoke('show-message-box', {
    type: 'warning',
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,
    cancelId: 1,
    title: 'Delete File',
    message: 'Delete File',
    detail: `Are you sure you want to delete "${file.name}"?`
  })

  if (response === 1) return // Cancel was clicked

  try {
    const deleted = await ipcRenderer.invoke('delete-file', file.path)
    if (deleted) {
      // If the deleted file was open, clear the editor
      if (currentFile.value?.path === file.path) {
        currentFile.value = null
        content.value = ''
        title.value = ''
      }
      await loadFileTree() // Refresh the file tree
      showStatus('File deleted')
    } else {
      showStatus('Error deleting file')
    }
  } catch (error) {
    showStatus('Error deleting file')
  }
}

async function handleNewFileInFolder(folderPath: string) {
  showNewFileModal.value = true
  selectedFolderPath.value = folderPath
}

async function handleNewFolderInFolder(folderPath: string) {
  showNewFolderModal.value = true
  selectedFolderPath.value = folderPath
}

async function handleRename(oldPath: string, newPath: string) {
  if (!window.require) return
  
  const { ipcRenderer } = window.require('electron')
  try {
    // Pass as an object with both paths
    const success = await ipcRenderer.invoke('rename-file', {
      oldPath: oldPath,
      newPath: newPath
    })
    
    if (success) {
      // Update current file if it's the one being renamed
      if (currentFile.value?.path === oldPath) {
        const { basename } = window.require('path')
        currentFile.value = {
          ...currentFile.value,
          path: newPath,
          name: basename(newPath)
        }
      }
      await loadFileTree() // Refresh the file tree
      showStatus('File renamed')
    } else {
      showStatus('Error renaming file')
    }
  } catch (error) {
    console.error('Rename error:', error)
    showStatus('Error renaming file')
  }
}

// Add cleanup when unmounting
onBeforeUnmount(() => {
  if (currentFile.value) {
    localStorage.setItem(`lastOpenedFile-${workspace.value}`, currentFile.value.path)
  }
})
</script>

<style>
@import '../assets/styles/global.css';

/* Add these utility classes */
.btn-icon {
  @apply p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-all duration-200;
}

.action-button {
  @apply hover:bg-slate-50 transition-all duration-200;
}

.primary-button {
  @apply bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200;
}

.secondary-button {
  @apply bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg transition-all duration-200;
}
</style> 