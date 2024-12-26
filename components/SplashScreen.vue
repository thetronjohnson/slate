<template>
  <div 
    class="fixed inset-0 bg-white z-50 flex items-center justify-center transition-all duration-300"
    :class="{ 'opacity-0 pointer-events-none': !show }"
  >
    <div class="text-center">
      <div class="w-20 h-20 mx-auto mb-4 animate-pulse-subtle">
        <img 
          :src="slateIcon" 
          alt="Slate" 
          class="w-full h-full object-contain animate-float"
        />
      </div>
      <h1 class="text-xl font-medium text-slate-800">
        Slate
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Loading...
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import slateIcon from '~/public/icons/slate.png'

defineProps<{
  show: boolean
}>()
</script> 

<style scoped>
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes pulse-subtle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}
</style> 