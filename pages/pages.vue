<template>
  <div class="min-h-screen bg-white">
    <!-- Delete Confirmation Modal -->
    <Modal
      :is-open="showDeleteModal"
      title="Delete Page"
      @close="showDeleteModal = false"
    >
      <p class="text-sm text-slate-600">
        Are you sure you want to delete "{{ pageToDelete?.name }}"? This action cannot be undone.
      </p>
      <template #actions>
        <div class="flex justify-end">
          <button
            type="button"
            :disabled="isDeleting"
            @click="confirmDelete"
            class="inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </template>
    </Modal>

    <!-- Header -->
    <header class="flex items-center h-12 bg-white/80 backdrop-blur border-b border-slate-200/50 shadow-sm">
      <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-full">
          <!-- Left side - Adjusted to match Sidebar positioning -->
          <div class="flex items-center gap-2 pl-[11px]">
            <button
              @click="router.push('/')"
              class="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-all duration-150"
              title="Back to Editor"
            >
              <Icon icon="lucide:arrow-left" class="w-4 h-4" />
            </button>
            <span class="font-bold text-sm text-slate-700">Slate Editor</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Title Section -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-slate-900">Public Pages</h1>
        <p class="mt-1 text-sm text-slate-500">Public pages can be shared with anyone and cannot be updated</p>
      </div>

      <div v-if="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>

      <div v-else-if="pages.length === 0" class="text-center py-12">
        <Icon icon="lucide:files" class="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 class="text-sm font-medium text-slate-900">No public pages yet</h3>
        <p class="mt-1 text-sm text-slate-500">
          Your published pages will appear here
        </p>
      </div>

      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="page in pages"
          :key="page.id"
          class="relative group bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-all duration-200"
        >
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-sm font-medium text-slate-900">
                {{ page.name }}
              </h3>
              <p class="mt-1 text-xs text-slate-500">
                Published {{ formatDate(page.created_at) }}
              </p>
            </div>
            <div class="flex items-center gap-1">
              <div class="relative">
                <button
                  @click="copyPageId(page.id)"
                  class="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  title="Copy page URL"
                >
                  <Icon icon="lucide:copy" class="w-4 h-4" />
                </button>
                <!-- Copied Message -->
                <div
                  v-if="showCopiedMessage === page.id"
                  class="absolute bottom-full right-0 mb-2 px-3 py-1 text-xs font-medium text-white bg-slate-900 rounded shadow-sm animate-fade-in-down"
                >
                  Link copied!
                </div>
              </div>
              <button
                @click="openPage(page.id)"
                class="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                title="Open page"
              >
                <Icon icon="lucide:external-link" class="w-4 h-4" />
              </button>
              <button
                @click="handleDelete(page)"
                class="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-50"
                title="Delete page"
              >
                <Icon icon="lucide:trash-2" class="w-4 h-4" />
              </button>
            </div>
          </div>
          <div class="mt-4 text-sm text-slate-600 line-clamp-3" v-html="getPreview(page.content)"></div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import Modal from '~/components/Modal.vue'

const router = useRouter()
const pages = ref([])
const isLoading = ref(true)
const isDeleting = ref(false)
const showDeleteModal = ref(false)
const pageToDelete = ref(null)
const showUserMenu = ref(false)
const user = useSupabaseUser()
const showCopiedMessage = ref(null)

onMounted(async () => {
  if (!user.value) {
    return router.push('/login')
  }
  await fetchPages()
})

async function fetchPages() {
  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', user.value.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    pages.value = data
  } catch (error) {
    console.error('Error fetching pages:', error)
  } finally {
    isLoading.value = false
  }
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(dateString))
}

function getPreview(content) {
  // Basic sanitization and preview generation
  const div = document.createElement('div')
  div.innerHTML = content
  return div.textContent?.slice(0, 150) + '...' || ''
}

async function copyPageId(id) {
  try {
    const config = useRuntimeConfig();
    const pageUrl = `${config.public.appUrl}/${id}`;
    await navigator.clipboard.writeText(pageUrl);
    
    // Show and auto-hide the copied message for this specific page
    showCopiedMessage.value = id;
    setTimeout(() => {
      showCopiedMessage.value = null;
    }, 2000);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    alert('Failed to copy to clipboard. Please copy manually.');
  }
}

function openPage(id) {
  window.open(`/${id}`, '_blank');
}

function handleDelete(page) {
  pageToDelete.value = page
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!pageToDelete.value) return
  
  isDeleting.value = true
  try {
    const { error } = await $fetch('/api/pages/delete', {
      method: 'POST',
      body: {
        pageId: pageToDelete.value.id,
        userId: user.value.id
      }
    })

    if (error) throw error

    // Remove from local state
    pages.value = pages.value.filter(p => p.id !== pageToDelete.value.id)
    showDeleteModal.value = false
  } catch (error) {
    console.error('Error deleting page:', error)
    alert('Failed to delete page. Please try again.')
  } finally {
    isDeleting.value = false
    pageToDelete.value = null
  }
}


async function handleLogout() {
  try {
    const supabase = useSupabaseClient()
    await supabase.auth.signOut()
    showUserMenu.value = false
    await router.push('/login')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<style>
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-down {
  animation: fadeInDown 0.2s ease-out;
}
</style> 