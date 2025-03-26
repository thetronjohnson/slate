<template>
  <!-- New File Modal -->
  <Modal
    :is-open="showNewFileModal"
    title="Create New File"
    confirm-text="Create"
    @close="showNewFileModal = false"
    @confirm="handleCreateFile"
  >
    <div class="space-y-4">
      <label class="block">
        <span class="text-sm font-medium text-slate-700">File Name</span>
        <input
          type="text"
          v-model="newFileName"
          class="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Untitled"
          @keyup.enter="handleCreateFile"
          ref="newFileInput"
        />
      </label>
    </div>
  </Modal>
  
  <!-- Rename File Modal -->
  <Modal
    :is-open="showRenameModal"
    title="Rename File"
    confirm-text="Rename"
    @close="showRenameModal = false"
    @confirm="handleRenameFile"
  >
    <div class="space-y-4">
      <label class="block">
        <span class="text-sm font-medium text-slate-700">New File Name</span>
        <input
          type="text"
          v-model="newFileName"
          class="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Untitled"
          @keyup.enter="handleRenameFile"
          ref="renameInput"
        />
      </label>
    </div>
  </Modal>
  
  <!-- Delete File Modal -->
  <Modal
    :is-open="showDeleteModal"
    title="Delete File"
    confirm-text="Delete"
    :danger="true"
    @close="showDeleteModal = false"
    @confirm="handleDeleteFile"
  >
    <p class="text-sm text-slate-600">
      Are you sure you want to delete "<span class="font-medium text-slate-900">{{ fileToDelete?.name }}</span>"?
      <br>
      <span class="text-red-600 mt-2 block">This action cannot be undone.</span>
    </p>
  </Modal>

  <div class="flex flex-col h-full">
    <div 
      class="h-12 px-4 border-b border-slate-200/50 flex items-center justify-between bg-white/90"
      :class="{ 'justify-center': isCollapsed }"
    >
      <div class="flex items-center justify-between w-full" :class="{ 'justify-center': isCollapsed }">
        <span 
          v-if="!isCollapsed" 
          class="font-bold text-sm text-slate-700"
        >
          Slate
        </span>
        
        <!-- Collapse/Expand Button -->
        <button 
          v-if="!isCollapsed"
          @click="$emit('toggle-sidebar')" 
          class="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all duration-150"
          title="Collapse sidebar"
        >
          <Icon icon="lucide:panel-left-close" class="w-4 h-4" />
        </button>
      </div>
      
      <!-- Show expand button only when collapsed -->
      <button 
        v-if="isCollapsed"
        @click="$emit('toggle-sidebar')" 
        class="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all duration-150"
        title="Expand sidebar"
      >
        <Icon icon="lucide:panel-left-open" class="w-4 h-4" />
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto py-3 space-y-1" :class="{ 'px-1': isCollapsed }">
      <div 
        v-for="file in files" 
        :key="file.id"
        @click="$emit('select-file', file)"
        class="rounded-md cursor-pointer flex items-center gap-2.5 transition-all duration-200 hover:bg-slate-100/80 group"
        :class="[
          isCollapsed ? 'justify-center py-2' : 'px-3 py-2 mx-2',
          { 'bg-slate-100 shadow-sm': activeFile?.id === file.id }
        ]"
        :title="isCollapsed ? file.name : ''"
      >
        <Icon 
          icon="lucide:file-text" 
          class="w-4 h-4 flex-shrink-0 transition-colors duration-200" 
          :class="activeFile?.id === file.id ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'" 
        />
        <span 
          v-if="!isCollapsed" 
          class="truncate flex-1 text-sm leading-none" 
          :class="{ 'font-medium text-slate-900': activeFile?.id === file.id }"
        >
          {{ file.name }}
        </span>
        <div 
          v-if="!isCollapsed" 
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-0.5 ml-1"
        >
          <button 
            @click.stop="renameFile(file)" 
            class="p-1.5 text-slate-400 hover:text-slate-900 rounded-md transition-all duration-150 hover:bg-slate-200/80"
            title="Rename"
          >
            <Icon icon="lucide:edit" class="w-3.5 h-3.5" />
          </button>
          <button 
            @click.stop="deleteFile(file)" 
            class="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-all duration-150 hover:bg-red-50"
            title="Delete"
          >
            <Icon icon="lucide:trash-2" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div v-if="files.length === 0" class="text-center text-gray-400 mt-8 p-4">
        <Icon icon="lucide:file-question" class="w-12 h-12 mx-auto mb-2 text-gray-200" />
        <p v-if="!isCollapsed" class="text-sm">No pages yet</p>
      </div>
    </div>
    
    <div class="p-3 border-t border-slate-200/50 bg-white/90" :class="{ 'px-2': isCollapsed }">
      <button 
        @click="createNewFile"
        class="w-full flex items-center justify-center p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md transition-all duration-200 text-sm font-medium shadow-sm hover:shadow active:scale-95"
        :class="{ 'gap-2': !isCollapsed }"
        :title="isCollapsed ? 'New Page' : ''"
      >
        <Icon icon="lucide:file-plus" class="w-4 h-4" />
        <span v-if="!isCollapsed">New Page</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import { Icon } from '@iconify/vue';
import Modal from './Modal.vue';
import { useStorage } from '../composables/useStorage';

const props = defineProps({
  files: {
    type: Array,
    default: () => []
  },
  activeFile: {
    type: Object,
    default: null
  },
  isCollapsed: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'select-file',
  'create-file',
  'toggle-sidebar',
  'delete-file',
  'rename-file'
]);

// Modal states
const showNewFileModal = ref(false);
const showRenameModal = ref(false);
const showDeleteModal = ref(false);
const newFileName = ref('');
const fileToDelete = ref(null);
const fileToRename = ref(null);
const newFileInput = ref(null);
const renameInput = ref(null);

const { storage } = useStorage();

function createNewFile() {
  showNewFileModal.value = true;
  newFileName.value = '';
  nextTick(() => {
    newFileInput.value?.focus();
  });
}

function renameFile(file) {
  fileToRename.value = file;
  newFileName.value = file.name;
  showRenameModal.value = true;
  nextTick(() => {
    renameInput.value?.focus();
  });
}

function deleteFile(file) {
  fileToDelete.value = file;
  showDeleteModal.value = true;
}

function handleCreateFile() {
  if (newFileName.value.trim()) {
    emit('create-file', newFileName.value.trim());
    showNewFileModal.value = false;
  }
}

function handleRenameFile() {
  if (newFileName.value.trim() && fileToRename.value) {
    // Preserve the current content and other properties
    const updatedFile = {
      ...fileToRename.value,
      name: newFileName.value.trim(),
      updatedAt: new Date().toISOString()
    };
    storage.saveFiles(props.files).catch(error => {
      console.error('Error saving renamed file:', error);
    });
    emit('rename-file', updatedFile);
    showRenameModal.value = false;
    fileToRename.value = null;
  }
}

async function handleDeleteFile() {
  if (fileToDelete.value) {
    // Remove file content from IndexedDB
    await storage.deleteDocument(fileToDelete.value.id);
    emit('delete-file', fileToDelete.value);
    showDeleteModal.value = false;
    fileToDelete.value = null;
  }
}
</script> 