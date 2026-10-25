<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
    <!-- Navbar Superior -->
    <header class="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NuxtLink to="/" class="group flex items-center gap-3 hover:opacity-90 transition-opacity">
          <AppLogo with-tagline />
        </NuxtLink>

        <!-- Navegación -->
        <nav class="flex items-center gap-1 sm:gap-2">
          <UButton
            to="/"
            variant="ghost"
            color="gray"
            icon="i-heroicons-squares-2x2"
            label="Dashboard"
          />
          <UButton
            to="/video-maker"
            variant="ghost"
            color="gray"
            icon="i-heroicons-video-camera"
            label="Video Maker"
          />
          <UButton
            to="/collage"
            variant="ghost"
            color="gray"
            icon="i-heroicons-photo"
            label="Collage Maker"
          />
        </nav>

        <!-- Control de Tema y Estado -->
        <div class="flex items-center gap-2">
          <UButton
            v-if="state.isRendering"
            color="primary"
            variant="solid"
            size="sm"
            icon="i-heroicons-arrow-path"
            class="animate-pulse"
            @click="isModalOpen = true"
          >
            <span>Renderizando ({{ state.percent }}%)</span>
          </UButton>

          <ClientOnly>
            <UButton
              :icon="colorMode.value === 'dark' ? 'i-heroicons-moon' : 'i-heroicons-sun'"
              color="gray"
              variant="ghost"
              aria-label="Cambiar tema"
              @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
            />
            <template #fallback>
              <div class="w-8 h-8" />
            </template>
          </ClientOnly>
        </div>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NuxtPage />
    </main>

    <!-- Modal Global de Progreso SSE -->
    <RenderProgressModal />

    <!-- Notificaciones Toast de Nuxt UI -->
    <UNotifications />

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-500">
      <span class="font-semibold text-gray-700 dark:text-gray-300">Kroma Studio</span> &bull; Creación y Montaje Audiovisual Automatizado &copy; 2026
    </footer>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

const colorMode = useColorMode();
const { state, isModalOpen, initProgressStream } = useRenderProgress();

onMounted(() => {
  initProgressStream();
});
</script>
