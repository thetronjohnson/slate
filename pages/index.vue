<template>
  <div class="flex h-screen bg-white">
    <!-- Export Modal -->
    <Modal
      :is-open="showExportModal"
      title="Export Document"
      @close="showExportModal = false"
    >
      <p class="text-sm text-slate-600 mb-2">
        Choose your preferred export format:
      </p>
      <div class="space-y-2">
        <button
          @click="exportMarkdown"
          class="w-full flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all duration-200 group text-left"
        >
          <Icon 
            icon="lucide:file-text" 
            class="w-5 h-5 text-slate-400 group-hover:text-slate-600" 
          />
          <div>
            <div class="font-medium text-slate-900">Markdown</div>
            <div class="text-xs text-slate-500">Export as a .md file</div>
          </div>
        </button>
        
        <ClientOnly>
          <button
            @click="exportPDF"
            class="w-full flex items-center gap-3 p-3 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all duration-200 group text-left"
            :disabled="isExporting"
          >
            <Icon 
              :icon="isExporting ? 'lucide:loader-2' : 'lucide:file'" 
              class="w-5 h-5 text-slate-400 group-hover:text-slate-600"
              :class="{ 'animate-spin': isExporting }" 
            />
            <div>
              <div class="font-medium text-slate-900">PDF</div>
              <div class="text-xs text-slate-500">
                {{ isExporting ? 'Generating PDF...' : 'Export as a PDF document' }}
              </div>
            </div>
          </button>
        </ClientOnly>
      </div>
      <template #actions>
        <button
          type="button"
          class="inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 active:scale-95"
          @click="showExportModal = false"
        >
          Export
        </button>
      </template>
    </Modal>
    
    <!-- Sidebar -->
    <div 
      class="h-full bg-white/80 backdrop-blur border-r border-slate-200/50 shadow-sm transition-all duration-300 ease-in-out z-10 flex flex-col"
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
      <div class="flex items-center justify-between px-4 h-12 bg-white/80 backdrop-blur border-b border-slate-200/50 shadow-sm">
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
            @click="showExportModal = true" 
            class="text-sm flex items-center gap-2 px-4 py-2 text-slate-700 bg-white hover:bg-slate-50 rounded-md transition-all duration-200 border border-slate-200/60 shadow-sm hover:shadow active:scale-95"
          >
            <Icon icon="lucide:download" class="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
      
      <!-- Editor -->
      <div class="flex-1 overflow-auto p-0 bg-white/50" ref="editorContainer">
        <div class="max-w-3xl mx-auto px-8 py-12 bg-white h-full">
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
import { ref, onMounted, nextTick } from 'vue';
import { Icon } from '@iconify/vue';
import Modal from '../components/Modal.vue';
import TurndownService from 'turndown';

// Sample files data structure
const files = ref([]);
const activeFile = ref(null);
const editorRef = ref(null);
const isSidebarOpen = ref(true);
const showExportModal = ref(false);
const isExporting = ref(false);
const editorContainer = ref(null);

// Local Storage Keys
const STORAGE_KEYS = {
  FILES: 'slate-files',
  SIDEBAR_STATE: 'slate-sidebar-state'
};

// Initialize turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
  strongDelimiter: '**'
});

onMounted(() => {
  loadFromLocalStorage();
});

function loadFromLocalStorage() {
  try {
    // Load files
    const savedFiles = localStorage.getItem(STORAGE_KEYS.FILES);
    if (savedFiles) {
      files.value = JSON.parse(savedFiles);
      if (files.value.length > 0) {
        activeFile.value = files.value[0];
      }
    } else {
      // Create a default file with a welcome message
      createFile('Getting Started', `
        <h1>Welcome to Slate</h1>
        <p>This is your first document. Here are some things you can do:</p>
        <ul>
          <li>Write your content in markdown</li>
          <li>Use the formatting tools above to style your text</li>
          <li>Create new documents using the sidebar</li>
          <li>Export your documents as Markdown or PDF</li>
          <li>Your documents are automatically saved in your browser</li>
        </ul>
        <blockquote>
          <p>Tip: You can collapse the sidebar using the button in the top-left corner</p>
        </blockquote>
      `.trim());
    }
    
    // Load sidebar state
    const sidebarState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
    if (sidebarState !== null) {
      isSidebarOpen.value = JSON.parse(sidebarState);
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    // Reset to default state if there's an error
    files.value = [];
    createFile('Getting Started', '<h1>Welcome to Slate</h1><p>This is your first document.</p>');
  }
}

function selectFile(file) {
  activeFile.value = file;
  // Reset scroll position when switching files
  nextTick(() => {
    if (editorContainer.value) {
      editorContainer.value.scrollTop = 0;
    }
  });
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
  try {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files.value));
  } catch (error) {
    console.error('Error saving files to localStorage:', error);
    alert('Failed to save your changes. Please make sure you have enough storage space.');
  }
}

async function exportMarkdown() {
  if (!activeFile.value) return;
  
  try {
    // Convert HTML to Markdown
    const markdown = turndownService.turndown(activeFile.value.content);
    
    // Create and download the file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeFile.value.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showExportModal.value = false;
  } catch (error) {
    console.error('Error exporting markdown:', error);
    alert('Failed to export markdown. Please try again.');
  }
}

async function exportPDF() {
  if (!activeFile.value) return;
  
  try {
    isExporting.value = true;
    
    // Import both libraries
    const [{ jsPDF }, { default: html2pdf }] = await Promise.all([
      import('jspdf'),
      import('html2pdf.js')
    ]);
    
    // Create a new div for PDF generation
    const element = document.createElement('div');
    element.innerHTML = activeFile.value.content;
    element.className = 'pdf-export prose prose-slate max-w-none mx-auto px-8 py-12';
    document.body.appendChild(element);
    
    const options = {
      margin: [15, 15],
      filename: `${activeFile.value.name}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        putOnlyUsedFonts: true,
        floatPrecision: 16
      },
      enableLinks: true,
      pagebreak: { mode: 'avoid-all' }
    };
    
    const pdf = new jsPDF(options.jsPDF);
    
    await html2pdf()
      .from(element)
      .set(options)
      .toPdf()
      .get('pdf')
      .then((pdf) => {
        pdf.setProperties({
          title: activeFile.value.name,
          subject: 'Exported from Slate',
          creator: 'Slate Editor',
          author: 'Slate User'
        });
        return pdf;
      })
      .save();
    
    document.body.removeChild(element);
    showExportModal.value = false;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please try again.');
  } finally {
    isExporting.value = false;
  }
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
  try {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, JSON.stringify(isSidebarOpen.value));
  } catch (error) {
    console.error('Error saving sidebar state:', error);
  }
}
</script>

<style>
/* Scrollbar Styles */
.flex-1.overflow-auto {
  scrollbar-gutter: stable;
}

.flex-1.overflow-auto::-webkit-scrollbar {
  width: 10px;
}

.flex-1.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.flex-1.overflow-auto::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 20px;
  border: 3px solid #fff;
}

.flex-1.overflow-auto::-webkit-scrollbar-thumb:hover {
  background-color: #cbd5e1;
}

/* PDF Export Styles */
.pdf-export {
  background: white;
  color: #1a1a1a;
  font-family: 'Nunito Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.pdf-export h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #1a1a1a;
  letter-spacing: -0.01em;
}

.pdf-export h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #1a1a1a;
}

.pdf-export h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.pdf-export p {
  margin-bottom: 1rem;
  line-height: 1.7;
  color: #374151;
}

.pdf-export ul, .pdf-export ol {
  margin-bottom: 1rem;
  padding-left: 1.25rem;
}

.pdf-export li {
  margin-bottom: 0.25rem;
  color: #374151;
}

.pdf-export pre {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 1rem 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: #334155;
  white-space: pre-wrap;
}

.pdf-export code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  background: #f8fafc;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  color: #334155;
}

.pdf-export blockquote {
  border-left: 4px solid #fde68a;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #92400e;
  background: #fef3c7;
  padding: 0.5rem 1rem;
  border-radius: 0 0.375rem 0.375rem 0;
}

.pdf-export img {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
  border-radius: 0.375rem;
}
</style> 