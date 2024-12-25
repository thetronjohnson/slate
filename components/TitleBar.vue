<template>
  <div class="titlebar">
    <div class="title">Slate</div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.titlebar {
  @apply fixed top-0 left-0 right-0 h-[48px] bg-white/80 backdrop-blur-sm border-b border-slate-200;
  -webkit-app-region: drag;
}

.title {
  @apply text-center text-sm text-slate-600 leading-[48px] font-medium;
  font-family: 'Poppins', sans-serif;
}
</style> 