<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-xl font-semibold text-slate-900 font-sans">{{ page?.name || 'Page not found' }}</h1>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>

      <div v-else-if="!page" class="text-center py-12">
        <Icon icon="lucide:file-question" class="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 class="text-sm font-medium text-slate-900 font-sans">Page not found</h3>
        <p class="mt-1 text-sm text-slate-500 font-sans">
          The page you're looking for doesn't exist or has been removed
        </p>
      </div>

      <div v-else class="prose prose-slate max-w-none font-editor">
        <EditorContent :editor="editor" />
      </div>
    </main>

    <!-- Remove the existing footer and replace with floating button -->
    <div class="fixed bottom-4 right-4 z-50">
      <NuxtLink
        to="/" 
        class="flex items-center space-x-1 bg-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 border border-slate-200 font-sans"
      >
        <span class="text-sm text-slate-700 font-sans">Published with</span>
        <span class="text-sm font-medium text-slate-900 font-sans">Slate</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import posthog from 'posthog-js'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
// Add any other Tiptap extensions you need for your content

const router = useRouter()
const route = useRoute()
const page = ref(null)
const isLoading = ref(true)

const editor = useEditor({
  extensions: [
    StarterKit,
    // Add other extensions as needed
  ],
  editable: false, // Make it read-only
  content: '', // Will be updated when page data loads
})

// Update editor content when page data changes
watch(() => page.value, (newPage) => {
  if (newPage && editor.value) {
    editor.value.commands.setContent(newPage.content)
  }
  if (newPage) {
    const description = newPage.content.replace(/<[^>]*>/g, '').slice(0, 160) // Strip HTML and limit to 160 chars
    useHead({
      title: newPage.name,
      meta: [
        { name: 'description', content: description },
        // Open Graph meta tags
        { property: 'og:description', content: description },
        // Twitter meta tags
        { name: 'twitter:description', content: description }
      ]
    })
    // Track page view anonymously
    posthog.capture('published_page_viewed', {
      page_id: route.params.id,
      page_name: newPage.name,
      $set_once: { // Only set these properties once per user
        first_page_view_date: new Date().toISOString(),
      }
    });
  }
})

// Clean up editor instance
onBeforeUnmount(() => {
  editor.value?.destroy()
})

onMounted(async () => {
  await fetchPage()
})

async function fetchPage() {
  try {
    const { data, error } = await $fetch(`/api/pages/${route.params.id}`)
    
    if (error) throw error
    page.value = data
  } catch (error) {
    console.error('Error fetching page:', error)
    page.value = null
  } finally {
    isLoading.value = false
  }
}
</script>

<style>
.prose {
  font-family: 'Noto Serif', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 1rem;
}

.prose h1,
.prose h2,
.prose h3,
.prose p,
.prose ul,
.prose ol,
.prose li {
  font-family: 'Noto Serif', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
}

.prose pre,
.prose code {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
}

.prose h1 {
  font-size: clamp(1.5rem, 5vw, 2rem);
  font-weight: 700;
  margin-bottom: 1rem;
  color: #111827; /* text-gray-900 */
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.prose h2 {
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #1f2937; /* text-gray-800 */
  letter-spacing: -0.01em;
}

.prose h3 {
  font-size: clamp(1.1rem, 3vw, 1.25rem);
  font-weight: 700;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: #1f2937; /* text-gray-800 */
}

.prose p {
  margin-bottom: 1rem;
  line-height: 1.7;
  color: #374151; /* text-gray-700 */
  font-size: 1.05rem;
}

.prose ul, .prose ol {
  margin-bottom: 1rem;
  padding-left: 1.25rem;
  color: #374151; /* text-gray-700 */
  line-height: 1.7;
}

.prose li {
  margin-bottom: 0.25rem;
}

.prose pre {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 0 0.375rem 0.375rem 0;
  margin: 1rem 0;
  font-size: 13px;
  color: #334155;
  border-left: 4px solid #e2e8f0;
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  border-right: 1px solid rgba(226, 232, 240, 0.5);
  border-bottom: 1px solid rgba(226, 232, 240, 0.5);
}

.prose code {
  font-size: 13px;
  background: rgba(241, 245, 249, 0.7);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  color: #334155;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.prose blockquote {
  border-left: 4px solid #fde68a;
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  color: #92400e;
  background: rgba(254, 243, 199, 0.5);
  border-radius: 0 0.375rem 0.375rem 0;
  font-style: normal;
}

.prose blockquote p {
  color: rgba(146, 64, 14, 0.9);
  margin: 0;
  line-height: 1.5;
  font-size: 1rem;
  letter-spacing: -0.01em;
}

.prose img {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
  border-radius: 0.375rem;
  width: 100%;
  object-fit: contain;
}

@media (max-width: 640px) {
  .prose {
    padding: 0 0.5rem;
  }
}
</style> 