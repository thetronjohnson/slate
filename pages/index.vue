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
        @delete-file="deleteFile"
        @rename-file="handleFileRename"
      />
    </div>
    
    <!-- Main Editor Area -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Top Bar -->
      <div class="flex items-center justify-between px-4 h-12 bg-white/80 backdrop-blur border-b border-slate-200/50 shadow-sm">
        <div class="flex items-center">
          <h1 class="text-sm font-medium text-gray-800">{{ activeFile?.name || 'Untitled' }}</h1>
          <span class="ml-3 text-xs text-gray-400" v-if="activeFile">
            Last updated {{ formatDate(activeFile.updatedAt) }}
          </span>
        </div>
        
        <!-- Formatting Menu -->
        <div class="flex-1 flex items-center justify-center gap-3" v-if="editorRef && editorRef.editor">
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
        </div>

        <div class="flex items-center gap-2">
          <div class="text-xs text-gray-500 flex items-center gap-1.5">
            <kbd class="px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 border border-gray-200 rounded">
              {{ isMac ? '⌘' : 'Ctrl' }}
            </kbd>
            <span>+</span>
            <kbd class="px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 border border-gray-200 rounded">K</kbd>
            <span class="ml-1">for Slate AI</span>
          </div>
          <div class="h-4 w-px bg-gray-200 mx-2"></div>
          <button 
            @click="showExportModal = true"
            class="p-1.5 rounded-md hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all duration-150 active:scale-95"
            title="Export document"
          >
            <Icon icon="lucide:download" class="w-4 h-4" />
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
            :fileId="activeFile.id"
          />
          <div v-else class="flex flex-col items-center justify-center h-full mt-12 text-gray-400">
            <div class="max-w-md text-center">
              <Icon icon="lucide:book-open" class="w-20 h-20 mb-6 text-gray-200 mx-auto" />
              <h2 class="text-xl font-semibold text-gray-600 mb-2">Welcome to Your SlateWorkspace</h2>
              <p class="text-gray-500 mb-8">Create your first page or choose from our templates to get started quickly.</p>
              
              <div class="space-y-3">
                <button 
                  @click="createFile('Untitled')" 
                  class="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md active:scale-98 group"
                >
                  <Icon icon="lucide:file-plus" class="w-5 h-5 group-hover:scale-110 transition-transform" />
                  New Blank Page
                </button>
                
                <div class="flex gap-3">
                  <button 
                    v-for="template in templates" 
                    :key="template.name"
                    @click="createFile(template.name, template.content)" 
                    class="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <Icon :icon="template.icon" class="w-5 h-5 mb-2 text-gray-400 group-hover:text-gray-600 mx-auto" />
                    <div class="text-sm font-medium text-gray-700">{{ template.name }}</div>
                    <div class="text-xs text-gray-500">{{ template.description }}</div>
                  </button>
                </div>
              </div>
              
              <div class="mt-8 pt-8 border-t border-gray-100">
                <p class="text-sm text-gray-400">
                  Need help? Check out our 
                  <a href="#" class="text-blue-600 hover:text-blue-700 hover:underline">quick start guide</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { Icon } from '@iconify/vue';
import Modal from '../components/Modal.vue';
import TurndownService from 'turndown';
import { useStorage } from '../composables/useStorage';

// Local Storage Keys
const SETTINGS = {
  SIDEBAR_STATE: 'sidebarState'
};

// Initialize turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  bulletListMarker: '-',
  strongDelimiter: '**'
});

const isMac = computed(() => {
  return typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
});

const templates = [
  {
    name: 'Meeting Notes',
    icon: 'lucide:clipboard-list',
    description: 'Structured template for meetings',
    content: `<h1>Meeting Notes</h1>
<p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
<h2>Agenda</h2>
<ul>
  <li>Topic 1</li>
  <li>Topic 2</li>
</ul>
<h2>Action Items</h2>
<ul>
  <li>[ ] Task 1</li>
  <li>[ ] Task 2</li>
</ul>`
  },
  {
    name: 'Project Plan',
    icon: 'lucide:layout-template',
    description: 'Project planning template',
    content: `<h1>Project Overview</h1>
<h2>Objectives</h2>
<ul>
  <li>Objective 1</li>
  <li>Objective 2</li>
</ul>
<h2>Timeline</h2>
<ul>
  <li>Phase 1</li>
  <li>Phase 2</li>
</ul>`
  }
];

const files = ref([]);
const activeFile = ref(null);
const editorRef = ref(null);
const isSidebarOpen = ref(true);
const showExportModal = ref(false);
const isExporting = ref(false);
const editorContainer = ref(null);

const { storage, initStorage } = useStorage();

onMounted(async () => {
  await initStorage();
  try {
    // Load sidebar state
    const sidebarState = await storage.getSetting(SETTINGS.SIDEBAR_STATE);
    if (sidebarState !== null) {
      isSidebarOpen.value = sidebarState;
    }
    
    // Load saved files
    const savedFiles = await storage.getFiles();
    files.value = savedFiles;
    
    // If we have files, load the first one's content
    if (files.value.length > 0) {
      activeFile.value = files.value[0];
      // Load the content for the active file
      const content = await storage.getDocument(activeFile.value.id);
      if (content) {
        // Create a reactive property for content
        activeFile.value = {
          ...activeFile.value,
          content
        };
      }
    } else {
      // Create a default welcome file if no files exist
      await createFile('Getting Started', `
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
          <p>Pro Tip: Try "⌘ + K" to use Slate AI</p>
        </blockquote>
      `.trim());
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
});

function selectFile(file) {
  activeFile.value = file;
  // Save files list to persist any changes (like renames)
  saveFiles();
}

async function createFile(name, content = '') {
  const file = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save the content first
  await storage.saveDocument(file.id, content || '<h1>Untitled</h1>');

  files.value.push(file);
  activeFile.value = file;
  // Save file metadata
  saveFiles();
}

function updateFileContent(newContent) {
  if (activeFile.value) {
    // Update the active file's content
    activeFile.value = {
      ...activeFile.value,
      content: newContent
    };
    activeFile.value.updatedAt = new Date().toISOString();
    saveFiles();
  }
}

function saveFiles() {
  storage.saveFiles(files.value).catch(error => {
    console.error('Error saving files:', error);
  });
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
  storage.saveSetting(SETTINGS.SIDEBAR_STATE, isSidebarOpen.value).catch(error => {
    console.error('Error saving sidebar state:', error);
  });
}

function deleteFile(file) {
  // Remove from files array
  files.value = files.value.filter(f => f.id !== file.id);
  
  // If the deleted file was active, select another file or clear active file
  if (activeFile.value?.id === file.id) {
    activeFile.value = files.value[0] || null;
  }
  
  // Save updated files list
  saveFiles();
}

// Handle file rename
function handleFileRename(file) {
  // Find and update the file in our list
  const index = files.value.findIndex(f => f.id === file.id);
  if (index !== -1) {
    // Preserve the current content
    const currentContent = files.value[index].content;
    files.value[index] = {
      ...files.value[index],
      name: file.name,
      updatedAt: file.updatedAt,
      content: currentContent // Keep the existing content
    };
    
    // If this is the active file, update it too
    if (activeFile.value?.id === file.id) {
      activeFile.value = {
        ...files.value[index],
        content: currentContent // Keep the existing content
      };
    }
    
    // Save the updated files list
    saveFiles();
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