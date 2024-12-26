<template>
  <div 
    class="relative px-2 py-1 text-slate-500"
    :class="{ 
      'ml-2': !isRoot && isSidebarOpen,
      'text-indigo-700 bg-blue-50 font-medium rounded-md': currentFile?.path === item.path
    }"
  >
    <div 
      class="flex items-center gap-2 group cursor-pointer hover:text-indigo-700"
      :class="[
        !isSidebarOpen && 'justify-center'
      ]"
      @click="handleClick"
    >
      <button 
        v-if="item.type === 'folder' && isSidebarOpen"
        class="flex-shrink-0 p-0.5 -ml-0.5"
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
        :class="item.type === 'folder' ? 'text-slate-400' : 'text-slate-400'"
      />
      
      <div v-if="isSidebarOpen" class="min-w-0 flex-1">
        <input
          v-if="isEditing"
          ref="nameInput"
          v-model="editedName"
          type="text"
          class="w-full px-1.5 py-0.5 text-sm bg-white border border-blue-400 rounded focus:outline-none"
          @keyup.enter="handleRename"
          @blur="handleRename"
          @keyup.esc="isEditing = false"
        />
        <span 
          v-else
          class="text-sm truncate block"
          :title="item.name"
          @dblclick="startEditing"
        >
          {{ item.name }}
        </span>
      </div>

      <div 
        v-if="isSidebarOpen"
        class="invisible group-hover:visible flex items-center gap-2 ml-2 flex-shrink-0"
      >
        <template v-if="item.type === 'folder'">
          <button 
            @click.stop="$emit('newFile', item.path)"
            class="p-1 text-slate-400 hover:text-slate-600"
            title="New file"
          >
            <Icon name="ph:file-plus" class="w-4 h-4" />
          </button>
          <button 
            @click.stop="$emit('newFolder', item.path)"
            class="p-1 text-slate-400 hover:text-slate-600"
            title="New folder"
          >
            <Icon name="ph:folder-plus" class="w-4 h-4" />
          </button>
        </template>
        <template v-else>
          <button 
            @click.stop="startEditing"
            class="p-1 text-slate-400 hover:text-slate-600"
            title="Rename"
          >
            <Icon name="ph:pencil-simple" class="w-4 h-4" />
          </button>
          <button 
            @click.stop="handleDelete"
            class="p-1 text-slate-400 hover:text-red-500"
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
    
    <Transition
      enter-active-class="transition-all duration-200 ease-out overflow-hidden"
      leave-active-class="transition-all duration-200 ease-in overflow-hidden"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div 
        v-if="item.type === 'folder' && item.children"
        v-show="isOpen && isSidebarOpen"
        class="mt-0.5 custom-scrollbar"
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
    </Transition>
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

function onEnter(el: Element) {
  const height = el.scrollHeight
  ;(el as HTMLElement).style.maxHeight = '0'
  
  nextTick(() => {
    requestAnimationFrame(() => {
      ;(el as HTMLElement).style.maxHeight = `${height}px`
    })
  })
}

function onLeave(el: Element) {
  const height = el.scrollHeight
  ;(el as HTMLElement).style.maxHeight = `${height}px`
  
  nextTick(() => {
    requestAnimationFrame(() => {
      ;(el as HTMLElement).style.maxHeight = '0'
    })
  })
}
</script> 

<style scoped>
@import '../assets/styles/global.css';

/* Component specific styles */
.file-item {
  @apply text-neutral-600 hover:text-neutral-800;
  transition: var(--transition-ease);
}

.folder-item {
  @apply text-neutral-700 font-medium;
  transition: var(--transition-ease);
}

.active-file {
  @apply text-[#007AFF] bg-[#007AFF]/[0.04];
}

/* Icon colors */
.icon-file {
  @apply text-neutral-400;
  transition: var(--transition-ease);
}

.icon-folder {
  @apply text-neutral-500;
  transition: var(--transition-ease);
}

/* Hover states */
.hover-state {
  @apply hover:bg-[#1d1d1f]/[0.02];
  transition: var(--transition-ease);
}

/* Modern Scrollbar Design */
.sidebar-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.2s ease;
}

.sidebar-scrollbar:hover {
  scrollbar-color: rgba(100, 116, 139, 0.2) transparent;
}

/* Webkit Scrollbar Styles */
.sidebar-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.sidebar-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 8px;
  margin: 4px;
}

.sidebar-scrollbar::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.2);
}

.sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(100, 116, 139, 0.3);
}

.sidebar-scrollbar::-webkit-scrollbar-thumb:active {
  background-color: rgba(100, 116, 139, 0.4);
}

/* Dark theme variant */
:root[data-theme="dark"] .sidebar-scrollbar:hover::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.1);
}

:root[data-theme="dark"] .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

:root[data-theme="dark"] .sidebar-scrollbar::-webkit-scrollbar-thumb:active {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Add these animation styles */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

.duration-200 {
  transition-duration: 200ms;
}

.ease-in {
  transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}

.ease-out {
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}

.overflow-hidden {
  overflow: hidden;
}

/* Also add a transition for the caret icon */
button .icon {
  @apply transition-transform duration-200;
}

button[aria-expanded="true"] .icon {
  @apply rotate-90;
}

/* Add new animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

/* Keep only essential transitions */
.group-hover\:flex {
  transition: opacity 0.15s ease;
}
</style> 