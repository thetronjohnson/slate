<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="close" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel 
              class="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all border border-slate-200/50"
            >
              <DialogTitle 
                as="h3" 
                class="text-lg font-medium leading-6 text-slate-900 mb-4"
              >
                {{ title }}
              </DialogTitle>

              <div class="mt-2">
                <slot />
              </div>

              <div class="mt-6 flex justify-end gap-3">
                <template v-if="!$slots.actions">
                  <button
                    type="button"
                    class="inline-flex justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 active:scale-95"
                    @click="close"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    :class="[
                      'inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95',
                      danger 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    ]"
                    @click="confirm"
                  >
                    {{ confirmText }}
                  </button>
                </template>
                <slot name="actions" />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue';

defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  danger: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'confirm']);

const close = () => emit('close');
const confirm = () => emit('confirm');
</script> 