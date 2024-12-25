<template>
  <div class="relative" :class="{ 'ml-2': !isRoot && isSidebarOpen }">
    <div 
      class="flex items-center gap-1.5 px-2 py-1.5 rounded-md group relative transition-all"
      :class="[
        'hover:bg-slate-50/80',
        !isSidebarOpen && 'justify-center',
        currentFile?.path === item.path && 'bg-blue-50/50 text-blue-600',
        isHovered && 'bg-slate-50'
      ]"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div 
        class="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
        @click="handleClick"
      >
        <button 
          v-if="item.type === 'folder' && isSidebarOpen"
          class="flex-shrink-0"
          @click.stop="toggleFolder"
        >
          <Icon 
            :name="isOpen ? 'ph:caret-down' : 'ph:caret-right'" 
            class="w-4 h-4"
          />
        </button>

        <Icon 
          :name="item.type === 'folder' ? 'ph:folder' : 'ph:file-text'" 
          class="w-4 h-4 flex-shrink-0"
          :class="getIconClass"
        />
        
        <div v-if="isSidebarOpen" class="min-w-0 flex-1">
          <input
            v-if="isEditing"
            ref="nameInput"
            v-model="editedName"
            type="text"
            class="w-full px-1 py-0.5 text-sm bg-white border border-blue-500 rounded focus:outline-none"
            @keyup.enter="handleRename"
            @blur="handleRename"
            @keyup.esc="isEditing = false"
          />
          <span 
            v-else
            class="text-sm truncate block"
            :class="getTextClass"
            :title="item.name"
            @dblclick="startEditing"
          >
            {{ item.name }}
          </span>
        </div>
      </div>

      <div 
        v-if="isSidebarOpen && isHovered"
        class="flex items-center gap-0.5 ml-1 flex-shrink-0"
      >
        <template v-if="item.type === 'folder'">
          <button 
            @click.stop="$emit('newFile', item.path)"
            class="p-1 text-slate-400 hover:text-slate-600 rounded-sm"
            title="New file"
          >
            <Icon name="ph:file-plus" class="w-4 h-4" />
          </button>
          <button 
            @click.stop="$emit('newFolder', item.path)"
            class="p-1 text-slate-400 hover:text-slate-600 rounded-sm"
            title="New folder"
          >
            <Icon name="ph:folder-plus" class="w-4 h-4" />
          </button>
        </template>
        <template v-else>
          <button 
            @click.stop="startEditing"
            class="p-1 text-slate-400 hover:text-slate-600 rounded-sm"
            title="Rename"
          >
            <Icon name="ph:pencil-simple" class="w-4 h-4" />
          </button>
          <button 
            @click.stop="handleDelete"
            class="p-1 text-slate-400 hover:text-red-500 rounded-sm"
            title="Delete"
          >
            <Icon name="ph:trash" class="w-4 h-4" />
          </button>
        </template>
      </div>

      <div 
        v-if="!isSidebarOpen"
        class="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
      >
        {{ item.name }}
        <div class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
      </div>
    </div>
    
    <div 
      v-if="item.type === 'folder' && item.children"
      v-show="isOpen && isSidebarOpen"
      class="mt-0.5"
    >
      <FileTreeItem 
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :current-file="currentFile"
        :is-root="false"
        :isSidebarOpen="isSidebarOpen"
        @select="$emit('select', $event)"
        @delete="$emit('delete', $event)"
        @newFile="$emit('newFile', $event)"
        @newFolder="$emit('newFolder', $event)"
        @rename="(oldPath, newPath) => $emit('rename', oldPath, newPath)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = defineProps<{
  item: {
    type: string
    name: string
    path: string
    lastSaved?: string
  }
  currentFile: any
  isRoot?: boolean
  isSidebarOpen: boolean
}>()

const emit = defineEmits<{
  select: [item: any]
  delete: [item: any]
  newFile: [path: string]
  newFolder: [path: string]
  rename: [oldPath: string, newPath: string]
}>()

// Get path module from Node.js
const path = window.require ? window.require('path') : {
  dirname: (p: string) => p.substring(0, p.lastIndexOf('/')),
  basename: (p: string) => p.substring(p.lastIndexOf('/') + 1)
}

const isOpen = ref(true)
const isEditing = ref(false)
const editedName = ref('')
const nameInput = ref<HTMLInputElement>()
const isHovered = ref(false)

const getIconClass = computed(() => {
  if (props.item.type === 'folder') {
    return 'text-slate-400'
  }
  return props.currentFile?.path === props.item.path
    ? 'text-blue-500'
    : 'text-slate-400'
})

const getTextClass = computed(() => {
  if (props.item.type === 'folder') {
    return 'text-slate-700 font-medium'
  }
  return props.currentFile?.path === props.item.path
    ? 'text-blue-600'
    : 'text-slate-600'
})

function handleClick() {
  if (props.item.type === 'markdown') {
    emit('select', props.item)
  } else if (props.item.type === 'folder') {
    toggleFolder()
  }
}

function handleDelete() {
  emit('delete', props.item)
}

function toggleFolder() {
  isOpen.value = !isOpen.value
}

function startEditing() {
  if (props.item.type === 'markdown') {
    editedName.value = props.item.name.replace('.md', '')
    isEditing.value = true
    nextTick(() => {
      nameInput.value?.focus()
      nameInput.value?.select()
    })
  }
}

function handleRename() {
  if (!isEditing.value) return
  
  const newName = editedName.value.trim()
  if (newName && newName !== props.item.name.replace('.md', '')) {
    const oldPath = props.item.path
    const dirName = path.dirname(oldPath)
    const newPath = `${dirName}/${newName}.md`
    emit('rename', oldPath, newPath)
  }
  
  isEditing.value = false
}
</script> 

<style scoped>
@import '../assets/styles/global.css';

/* Component specific styles */
.file-item {
  @apply text-[#1d1d1f]/70 hover:text-[#1d1d1f]/90;
  transition: var(--transition-ease);
}

.folder-item {
  @apply text-[#1d1d1f]/80 font-medium;
  transition: var(--transition-ease);
}

.active-file {
  @apply text-[#007AFF] bg-[#007AFF]/[0.04];
}

/* Icon colors */
.icon-file {
  @apply text-[#1d1d1f]/30;
  transition: var(--transition-ease);
}

.icon-folder {
  @apply text-[#1d1d1f]/40;
  transition: var(--transition-ease);
}

/* Hover states */
.hover-state {
  @apply hover:bg-[#1d1d1f]/[0.02];
  transition: var(--transition-ease);
}

/* Optional: Add custom scrollbar styles */
.sidebar-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(203, 213, 225, 0.4) transparent;
}

.sidebar-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.sidebar-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(203, 213, 225, 0.4);
  border-radius: 3px;
}

.sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(203, 213, 225, 0.6);
}
</style> 