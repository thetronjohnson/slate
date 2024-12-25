<template>
  <div class="titlebar">
    <div class="title">{{ title || 'Untitled' }}</div>
  </div>
</template>

<style scoped>
.titlebar {
  @apply fixed top-0 left-0 right-0 h-7 bg-white/80 backdrop-blur-sm;
  -webkit-app-region: drag;
}

.title {
  @apply text-center text-sm text-slate-500 leading-7;
}
</style> 