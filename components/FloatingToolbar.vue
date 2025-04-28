<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 translate-y-1"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-1"
  >
    <div 
      v-if="isVisible"
      ref="toolbar"
      class="fixed z-50 flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200/75 shadow-lg"
      :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    >
      <!-- Format Menu Items -->
      <button 
        v-for="item in formatMenuItems" 
        :key="item.name"
        @click="item.action"
        class="p-1.5 rounded-md hover:bg-gray-50 transition-all duration-150 active:scale-95"
        :class="{ 'text-gray-900 bg-gray-100': editor && item.isActive && item.isActive(), 'text-gray-500': !(editor && item.isActive && item.isActive()) }"
        :title="item.name"
      >
        <Icon :icon="item.icon" class="w-4 h-4" />
      </button>
      
      <div class="h-5 w-px bg-gray-200/75 mx-1"></div>
      
      <!-- List Menu Items -->
      <button 
        v-for="item in listMenuItems" 
        :key="item.name"
        @click="item.action"
        class="p-1.5 rounded-md hover:bg-gray-50 transition-all duration-150 active:scale-95"
        :class="{ 'text-gray-900 bg-gray-100': editor && item.isActive && item.isActive(), 'text-gray-500': !(editor && item.isActive && item.isActive()) }"
        :title="item.name"
      >
        <Icon :icon="item.icon" class="w-4 h-4" />
      </button>
      
      <div class="h-5 w-px bg-gray-200/75 mx-1"></div>
      
      <!-- Insert Menu Items -->
      <button 
        v-for="item in insertMenuItems" 
        :key="item.name"
        @click="item.action"
        class="p-1.5 rounded-md hover:bg-gray-50 transition-all duration-150 active:scale-95"
        :class="{ 'text-gray-900 bg-gray-100': editor && item.isActive && item.isActive(), 'text-gray-500': !(editor && item.isActive && item.isActive()) }"
        :title="item.name"
      >
        <Icon :icon="item.icon" class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { Icon } from '@iconify/vue';

const props = defineProps({
  editor: {
    type: Object,
    required: true
  },
  formatMenuItems: {
    type: Array,
    required: true
  },
  listMenuItems: {
    type: Array,
    required: true
  },
  insertMenuItems: {
    type: Array,
    required: true
  }
});

const isVisible = ref(false);
const position = ref({ x: 0, y: 0 });
const toolbar = ref(null);

function updateToolbarPosition() {
  if (!props.editor || !isVisible.value) return;
  
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Position the toolbar above and aligned with the left of the selection
  position.value = {
    x: rect.left,
    y: rect.top - (toolbar.value?.offsetHeight + 10)
  };
  
  // Keep toolbar within viewport
  const viewportWidth = window.innerWidth;
  const toolbarWidth = toolbar.value?.offsetWidth || 0;
  
  // Ensure toolbar doesn't go off screen on the right
  if (position.value.x + toolbarWidth > viewportWidth - 10) {
    position.value.x = viewportWidth - toolbarWidth - 10;
  }
  
  // Ensure minimum left padding
  if (position.value.x < 10) position.value.x = 10;
}

function handleSelectionChange() {
  if (!props.editor) return;
  
  const selection = window.getSelection();
  const isCollapsed = selection.isCollapsed;
  const isEditorFocused = props.editor.isFocused;
  
  isVisible.value = !isCollapsed && isEditorFocused;
  
  if (isVisible.value) {
    updateToolbarPosition();
  }
}

onMounted(() => {
  document.addEventListener('selectionchange', handleSelectionChange);
  window.addEventListener('scroll', updateToolbarPosition);
  window.addEventListener('resize', updateToolbarPosition);
});

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', handleSelectionChange);
  window.removeEventListener('scroll', updateToolbarPosition);
  window.removeEventListener('resize', updateToolbarPosition);
});
</script> 