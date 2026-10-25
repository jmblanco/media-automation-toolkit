<template>
  <div class="flex items-center gap-2.5 select-none">
    <!-- Isotipo vectorial Kroma -->
    <div
      class="relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-sm transition-transform group-hover:scale-105"
      :class="sizeClasses"
    >
      <img src="/logo.svg" alt="Kroma Logo" class="w-full h-full object-contain" />
    </div>

    <!-- Logotipo tipográfico -->
    <div v-if="!iconOnly" class="flex flex-col leading-none">
      <div class="flex items-center gap-1.5">
        <span class="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          KROMA
        </span>
        <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          Studio
        </span>
      </div>
      <span v-if="withTagline" class="text-[10px] text-gray-400 font-medium tracking-normal mt-0.5">
        Automated Media Studio
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg';
    iconOnly?: boolean;
    withTagline?: boolean;
  }>(),
  {
    size: 'md',
    iconOnly: false,
    withTagline: false
  }
);

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-7 h-7';
    case 'lg':
      return 'w-12 h-12';
    default:
      return 'w-9 h-9';
  }
});
</script>
