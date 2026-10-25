<template>
  <div class="space-y-8">
    <!-- Encabezado con navegación atrás -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UButton to="/" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
        <div>
          <h1 class="text-2xl font-bold">Video Maker</h1>
          <p class="text-xs text-gray-500">Montaje y concatenación secuencial con normalización H.264/AAC</p>
        </div>
      </div>
      <UButton
        color="primary"
        size="lg"
        icon="i-heroicons-sparkles"
        :loading="isStarting"
        :disabled="state.isRendering || !assets?.videos || assets.videos.length === 0"
        @click="startRender"
      >
        {{ state.isRendering ? 'Procesando...' : 'Renderizar Montaje' }}
      </UButton>
    </div>

    <!-- Configuración del Montaje -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna izquierda: Configuración -->
      <UCard class="space-y-4">
        <template #header>
          <h3 class="font-semibold text-sm">Configuración de Secuencia</h3>
        </template>

        <div class="space-y-4">
          <!-- Intro -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vídeo de Entrada / Intro (Opcional)
            </label>
            <USelectMenu
              v-model="selectedIntro"
              :options="videoOptions"
              placeholder="Ninguna (mezclar todos)"
              clearable
            />
            <p class="text-[11px] text-gray-500 mt-1">Este clip siempre se reproducirá en primer lugar.</p>
          </div>

          <!-- Outro -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vídeo de Cierre / Outro (Opcional)
            </label>
            <USelectMenu
              v-model="selectedOutro"
              :options="videoOptions"
              placeholder="Ninguna (mezclar todos)"
              clearable
            />
            <p class="text-[11px] text-gray-500 mt-1">Este clip siempre se reproducirá al final.</p>
          </div>

          <!-- Nombre de salida -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de archivo final
            </label>
            <UInput v-model="outputName" placeholder="montaje_final.mp4" icon="i-heroicons-document-text" />
          </div>

          <!-- Resumen de clips -->
          <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-500">Total clips a procesar:</span>
              <span class="font-semibold">{{ assets?.videos?.length ?? 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Clips intermedios (shuffle):</span>
              <span class="font-semibold">{{ coreCount }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Columna derecha: Clips disponibles -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-sm">Clips Disponibles ({{ assets?.videos?.length ?? 0 }})</h3>
          <UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-arrow-path" @click="refreshAssets">
            Actualizar
          </UButton>
        </div>

        <div v-if="assets?.videos && assets.videos.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
          <div
            v-for="v in assets.videos"
            :key="v.name"
            class="p-3 bg-white dark:bg-gray-900 border rounded-lg flex items-center justify-between text-xs transition-colors"
            :class="[
              selectedIntro === v.name ? 'border-primary-500 bg-primary-50/20' :
              selectedOutro === v.name ? 'border-purple-500 bg-purple-50/20' :
              'border-gray-200 dark:border-gray-800'
            ]"
          >
            <div class="flex items-center gap-2 truncate">
              <UIcon name="i-heroicons-film" class="w-4 h-4 text-gray-400 shrink-0" />
              <span class="truncate font-medium" :title="v.name">{{ v.name }}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <UBadge v-if="selectedIntro === v.name" size="xs" color="primary" variant="subtle">Intro</UBadge>
              <UBadge v-else-if="selectedOutro === v.name" size="xs" color="purple" variant="subtle">Outro</UBadge>
              <span class="text-gray-400 text-[10px] ml-1">{{ (v.size / (1024 * 1024)).toFixed(1) }} MB</span>
            </div>
          </div>
        </div>

        <!-- Uploader -->
        <div class="pt-2">
          <MediaUploader @uploaded="refreshAssets" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const { data: assets, refresh: refreshAssets } = await useFetch('/api/assets');
const { state, isModalOpen } = useRenderProgress();
const toast = useToast();

const selectedIntro = ref<string | null>(null);
const selectedOutro = ref<string | null>(null);
const outputName = ref('montaje_final.mp4');
const isStarting = ref(false);

const videoOptions = computed(() => {
  return (assets.value?.videos || []).map(v => v.name);
});

const coreCount = computed(() => {
  let count = assets.value?.videos?.length ?? 0;
  if (selectedIntro.value) count--;
  if (selectedOutro.value) count--;
  return Math.max(0, count);
});

const startRender = async () => {
  if (state.value.isRendering) {
    isModalOpen.value = true;
    return;
  }

  isStarting.value = true;
  try {
    const firstVideos = selectedIntro.value ? [selectedIntro.value] : [];
    const lastVideos = selectedOutro.value ? [selectedOutro.value] : [];

    await $fetch('/api/render/video', {
      method: 'POST',
      body: {
        firstVideos,
        lastVideos,
        outputName: outputName.value || 'montaje_final.mp4'
      }
    });

    isModalOpen.value = true;
    toast.add({
      title: 'Montaje iniciado',
      description: 'El proceso de transcodificación ha comenzado en segundo plano.',
      color: 'blue'
    });
  } catch (err: any) {
    toast.add({
      title: 'Error al iniciar',
      description: err.data?.message || err.message,
      color: 'red'
    });
  } finally {
    isStarting.value = false;
  }
};
</script>
