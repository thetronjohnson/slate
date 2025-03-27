<template>
  <NuxtPage />
</template>

<script setup>
import { watch, onMounted } from 'vue';
import { useSupabaseUser } from '#imports';

onMounted(() => {
  // Watch for authentication state changes at the app level
  watch(useSupabaseUser(), (newUser) => {
    // Clean up URL if it contains auth code
    if (window.location.search.includes('code=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, { immediate: true });
});
</script> 