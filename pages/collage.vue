<template>
  <div class="space-y-8">
    <!-- Encabezado con navegación atrás -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UButton to="/" variant="ghost" color="gray" icon="i-heroicons-arrow-left" />
        <div>
          <h1 class="text-2xl font-bold">Collage Maker</h1>
          <p class="text-xs text-gray-500">Composición de fotos + música + subtítulos con deduplicación por Sharp</p>
        </div>
      </div>
      <UButton
        color="primary"
        size="lg"
        icon="i-heroicons-sparkles"
        :loading="isStarting"
        :disabled="state.isRendering || !selectedAudio || !assets?.images || assets.images.length === 0"
        @click="startCollage"
      >
        {{ state.isRendering ? 'Procesando...' : 'Generar Collage' }}
      </UButton>
    </div>

    <!-- Formulario de Configuración -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna Izquierda: Parámetros -->
      <UCard class="space-y-4">
        <template #header>
          <h3 class="font-semibold text-sm">Parámetros del Collage</h3>
        </template>

        <div class="space-y-4">
          <!-- Audio Principal -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Pista de Audio Principal <span class="text-red-500">*</span>
              </label>
              <UButton
                size="2xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-musical-note"
                @click="isMusicHubOpen = true"
              >
                Explorar / Suno
              </UButton>
            </div>
            <USelectMenu
              v-model="selectedAudio"
              :options="audioOptions"
              placeholder="Selecciona una canción (.mp3, .wav)"
            />
            <p class="text-[11px] text-gray-500 mt-1">La duración total del vídeo se ajustará al audio.</p>
          </div>

          <!-- Relación de Aspecto -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Formato / Relación de Aspecto
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class="border rounded-lg p-2.5 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
                :class="[
                  selectedAspect === '16:9'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                ]"
                @click="selectedAspect = '16:9'"
              >
                <UIcon name="i-heroicons-tv" class="w-4 h-4" />
                <span>16:9 Horizontal</span>
              </button>

              <button
                type="button"
                class="border rounded-lg p-2.5 flex items-center justify-center gap-2 text-xs font-medium transition-colors"
                :class="[
                  selectedAspect === '9:16'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                ]"
                @click="selectedAspect = '9:16'"
              >
                <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
                <span>9:16 Vertical</span>
              </button>
            </div>
          </div>

          <!-- Subtítulos Opcionales -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Archivo de Subtítulos (Opcional)
            </label>
            <USelectMenu
              v-model="selectedSubs"
              :options="subsOptions"
              placeholder="Ninguno"
              clearable
            />
          </div>

          <!-- Tipografía Opcional -->
          <div v-if="selectedSubs">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fuente Tipográfica (.ttf / .otf)
            </label>
            <USelectMenu
              v-model="selectedFont"
              :options="fontOptions"
              placeholder="Fuente por defecto"
              clearable
            />
          </div>

          <!-- Nombre de salida -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre del Archivo de Salida
            </label>
            <UInput v-model="outputName" placeholder="video_final.mp4" icon="i-heroicons-document-text" />
          </div>

          <!-- Resumen de fotos -->
          <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-xs space-y-1">
            <div class="flex justify-between">
              <span class="text-gray-500">Fotos disponibles:</span>
              <span class="font-semibold">{{ assets?.images?.length ?? 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Deduplicación por Sharp:</span>
              <span class="font-semibold text-emerald-500">Activa (Auto)</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Columna Derecha: Fotos y Uploader -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-sm">Fotografías en Galería ({{ assets?.images?.length ?? 0 }})</h3>
          <UButton size="xs" color="gray" variant="ghost" icon="i-heroicons-arrow-path" @click="refreshAssets">
            Actualizar
          </UButton>
        </div>

        <!-- Lista/Cuadrícula de fotos -->
        <div v-if="assets?.images && assets.images.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
          <div
            v-for="img in assets.images"
            :key="img.name"
            class="group relative border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex flex-col"
          >
            <div class="aspect-square flex items-center justify-center p-2 text-center">
              <UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400" />
            </div>
            <div class="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
              <p class="text-[11px] font-medium truncate" :title="img.name">{{ img.name }}</p>
              <p class="text-[9px] text-gray-400 mt-0.5">{{ (img.size / 1024).toFixed(0) }} KB</p>
            </div>
          </div>
        </div>

        <!-- Uploader -->
        <div class="pt-2">
          <MediaUploader @uploaded="refreshAssets" />
        </div>
      </div>
    </div>

    <!-- Modal Central de Música (Jamendo / Suno) -->
    <MusicHubModal
      v-model="isMusicHubOpen"
      @selected="onMusicSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const { data: assets, refresh: refreshAssets } = await useFetch('/api/assets');
const { state, isModalOpen } = useRenderProgress();
const toast = useToast();

const selectedAudio = ref<string | null>(null);
const selectedSubs = ref<string | null>(null);
const selectedFont = ref<string | null>(null);
const selectedAspect = ref<'16:9' | '9:16'>('16:9');
const outputName = ref('video_final.mp4');
const isStarting = ref(false);
const isMusicHubOpen = ref(false);

const onMusicSelected = async (fileName?: string) => {
  await refreshAssets();
  if (fileName) {
    selectedAudio.value = fileName;
  }
};

// Auto-seleccionar primer audio o valentin_megamix si existe
watch(assets, (newVal) => {
  if (newVal?.audios && newVal.audios.length > 0 && !selectedAudio.value) {
    const valentin = newVal.audios.find(a => a.name.includes('valentin'));
    selectedAudio.value = valentin ? valentin.name : newVal.audios[0].name;
  }
  if (newVal?.subtitles && newVal.subtitles.length > 0 && !selectedSubs.value) {
    selectedSubs.value = newVal.subtitles[0].name;
  }
  if (newVal?.fonts && newVal.fonts.length > 0 && !selectedFont.value) {
    selectedFont.value = newVal.fonts[0].name;
  }
}, { immediate: true });

const audioOptions = computed(() => (assets.value?.audios || []).map(a => a.name));
const subsOptions = computed(() => (assets.value?.subtitles || []).map(s => s.name));
const fontOptions = computed(() => (assets.value?.fonts || []).map(f => f.name));

const startCollage = async () => {
  if (!selectedAudio.value) {
    toast.add({ title: 'Atención', description: 'Por favor selecciona una pista de audio.', color: 'amber' });
    return;
  }

  if (state.value.isRendering) {
    isModalOpen.value = true;
    return;
  }

  isStarting.value = true;
  try {
    await $fetch('/api/render/collage', {
      method: 'POST',
      body: {
        audioName: selectedAudio.value,
        subsName: selectedSubs.value || undefined,
        fontName: selectedFont.value || undefined,
        aspect: selectedAspect.value,
        outputName: outputName.value || 'video_final.mp4'
      }
    });

    isModalOpen.value = true;
    toast.add({
      title: 'Collage iniciado',
      description: 'El análisis de audio y renderizado ha comenzado en segundo plano.',
      color: 'blue'
    });
  } catch (err: any) {
    toast.add({
      title: 'Error al iniciar collage',
      description: err.data?.message || err.message,
      color: 'red'
    });
  } finally {
    isStarting.value = false;
  }
};
</script>
