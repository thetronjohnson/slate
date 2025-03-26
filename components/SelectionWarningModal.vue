<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="close" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-200 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-150 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto pt-[20vh]">
        <div class="flex min-h-full items-start justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-200 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-150 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-sm transform overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all">
              <div class="p-6">
                <div class="flex items-center gap-4">
                  <div class="p-2 bg-amber-50 rounded-lg">
                    <Icon icon="lucide:text-select" class="w-5 h-5 text-amber-500" />
                  </div>
                  <div class="flex-1 text-left">
                    <h3 class="font-medium text-slate-900">Select Text First</h3>
                    <p class="text-sm text-slate-500 mt-1">Please select some text to use Slate AI</p>
                  </div>
                </div>
              </div>
              <div class="border-t border-slate-200 bg-slate-50 p-4 text-right">
                <button
                  @click="close"
                  class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all duration-200 active:scale-95"
                >
                  Got it
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { Dialog, DialogPanel, TransitionRoot, TransitionChild } from '@headlessui/vue';
import { Icon } from '@iconify/vue';

defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);

function close() {
  emit('close');
}
</script> 