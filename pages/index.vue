<template>
  <div class="flex h-screen bg-white">
    <!-- Sidebar -->
    <div 
      class="h-full bg-white border-r border-gray-200/50 shadow-sm transition-all duration-300 ease-in-out z-10 flex flex-col"
      :class="isSidebarOpen ? 'w-64' : 'w-14'"
    >
      <Sidebar 
        :files="files" 
        :activeFile="activeFile" 
        @select-file="selectFile" 
        @create-file="createFile" 
        :is-collapsed="!isSidebarOpen"
        @toggle-sidebar="toggleSidebar"
      />
    </div>
    
    <!-- Main Editor Area -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Top Bar -->
      <div class="flex items-center justify-between px-4 h-12 bg-white border-b border-gray-200/50 shadow-sm">
        <div class="flex items-center">
          <h1 class="text-sm font-medium text-gray-800">{{ activeFile?.name || 'Untitled' }}</h1>
          <span class="ml-3 text-xs text-gray-400" v-if="activeFile">
            Last edited: {{ formatDate(activeFile.updatedAt) }}
          </span>
        </div>
        
        <!-- Formatting Menu -->
        <div class="flex items-center gap-3" v-if="editorRef && editorRef.editor">
          <!-- Format Menu Items -->
          <div class="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200/75 shadow-sm">
            <button 
              v-for="item in editorRef.formatMenuItems" 
              :key="item.name"
              @click="item.action"
              class="p-1.5 rounded-md hover:bg-gray-50 transition-all duration-150 active:scale-95"
              :class="{ 'text-gray-900 bg-gray-100': editorRef.editor && item.isActive && item.isActive(), 'text-gray-500': !(editorRef.editor && item.isActive && item.isActive()) }"
              :title="item.name"
            >
              <Icon :icon="item.icon" class="w-4 h-4" />
            </button>
            
            <div class="h-5 w-px bg-gray-200/75 mx-1"></div>
            
            <!-- List Menu Items -->
            <button 
              v-for="item in editorRef.listMenuItems" 
              :key="item.name"
              @click="item.action"
              class="p-1.5 rounded-md hover:bg-gray-50 transition-all duration-150 active:scale-95"
              :class="{ 'text-gray-900 bg-gray-100': editorRef.editor && item.isActive && item.isActive(), 'text-gray-500': !(editorRef.editor && item.isActive && item.isActive()) }"
              :title="item.name"
            >
              <Icon :icon="item.icon" class="w-4 h-4" />
            </button>
            
            <div class="h-5 w-px bg-gray-200/75 mx-1"></div>
            
            <!-- Insert Menu Items -->
            <button 
              v-for="item in editorRef.insertMenuItems.slice(0, 5)" 
              :key="item.name"
              @click="item.action"
              class="p-1.5 rounded-md hover:bg-gray-50 transition-all duration-150 active:scale-95"
              :class="{ 'text-gray-900 bg-gray-100': editorRef.editor && item.isActive && item.isActive(), 'text-gray-500': !(editorRef.editor && item.isActive && item.isActive()) }"
              :title="item.name"
            >
              <Icon :icon="item.icon" class="w-4 h-4" />
            </button>
          </div>
          
          <button 
            @click="exportMarkdown" 
            class="text-sm flex items-center gap-2 px-4 py-2 text-gray-600 bg-white hover:bg-gray-50 rounded-md transition-all duration-200 border border-gray-200/75 shadow-sm hover:shadow active:scale-95"
          >
            <Icon icon="lucide:download" class="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
      
      <!-- Editor -->
      <div class="flex-1 overflow-auto p-0 bg-white/50">
        <div class="max-w-3xl mx-auto px-8 py-12 bg-white min-h-full">
          <MarkdownEditor 
            v-if="activeFile" 
            ref="editorRef"
            v-model="activeFile.content" 
            @update:modelValue="updateFileContent"
          />
          <div v-else class="flex flex-col items-center justify-center h-64 mt-12 text-gray-400">
            <Icon icon="lucide:file-text" class="w-16 h-16 mb-4 text-gray-200" />
            <p class="text-lg">Select a file or create a new one to start editing</p>
            <button 
              @click="createFile('Untitled')" 
              class="mt-4 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black transition-all duration-200 flex items-center gap-2 hover:shadow-md active:scale-95"
            >
              <Icon icon="lucide:file-plus" class="w-4 h-4" />
              Create New File
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';

// Sample files data structure
const files = ref([]);
const activeFile = ref(null);
const editorRef = ref(null);
const isSidebarOpen = ref(true);

onMounted(() => {
  // Load files from localStorage or initialize with a default file
  const savedFiles = localStorage.getItem('slate-files');
  if (savedFiles) {
    files.value = JSON.parse(savedFiles);
    if (files.value.length > 0) {
      activeFile.value = files.value[0];
    }
  } else {
    // Create a default file with a welcome message
    createFile('Getting Started', '<h1>Welcome to Slate</h1><p>This is your first document. Start writing or use the formatting tools above.</p>');
  }
});

function selectFile(file) {
  activeFile.value = file;
}

function createFile(name = 'Untitled', content = '') {
  const newFile = {
    id: Date.now().toString(),
    name: name,
    content: content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  files.value.push(newFile);
  activeFile.value = newFile;
  saveFiles();
}

function updateFileContent(content) {
  if (activeFile.value) {
    activeFile.value.content = content;
    activeFile.value.updatedAt = new Date().toISOString();
    saveFiles();
  }
}

function saveFiles() {
  localStorage.setItem('slate-files', JSON.stringify(files.value));
}

function exportMarkdown() {
  if (!activeFile.value) return;
  
  const blob = new Blob([activeFile.value.content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${activeFile.value.name}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}
</script> 