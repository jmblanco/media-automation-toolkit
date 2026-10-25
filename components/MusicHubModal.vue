<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
              <UIcon name="i-heroicons-musical-note" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Música de Estudio para tu Montaje
              </h3>
              <p class="text-xs text-gray-500">Música real de artistas (gratis) o genera canciones temáticas en Suno</p>
            </div>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            class="-my-1"
            @click="isOpen = false"
          />
        </div>
      </template>

      <!-- Pestañas Principales -->
      <div class="space-y-4 py-1">
        <div class="flex border-b border-gray-200 dark:border-gray-800">
          <button
            type="button"
            class="py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors"
            :class="[
              activeTab === 'library'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
            @click="activeTab = 'library'"
          >
            <UIcon name="i-heroicons-globe-alt" class="w-4 h-4" />
            <span>Biblioteca de Música Real (Gratis)</span>
          </button>

          <button
            type="button"
            class="py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors"
            :class="[
              activeTab === 'suno'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
            @click="activeTab = 'suno'"
          >
            <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
            <span>Crear Canción en Suno (Gratis)</span>
          </button>
        </div>

        <!-- Pestaña 1: Biblioteca de Música Real -->
        <div v-if="activeTab === 'library'" class="space-y-4">
          <!-- Filtros de estilo -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              v-for="filter in filters"
              :key="filter.tag"
              type="button"
              class="text-xs px-2.5 py-1 rounded-full border transition-colors"
              :class="[
                selectedTag === filter.tag
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-semibold'
                  : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300'
              ]"
              @click="setFilter(filter.tag)"
            >
              {{ filter.label }}
            </button>
          </div>

          <!-- Lista de canciones -->
          <div class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            <div
              v-for="track in tracks"
              :key="track.id"
              class="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between gap-3 hover:border-gray-300 transition-colors"
            >
              <div class="flex items-center gap-3 min-w-0">
                <!-- Botón de Preescucha Play/Pause -->
                <button
                  type="button"
                  class="w-9 h-9 rounded-full bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 flex items-center justify-center shrink-0 text-primary-500 hover:scale-105 transition-transform"
                  @click="toggleAudioPreview(track)"
                >
                  <UIcon
                    :name="playingTrackId === track.id ? 'i-heroicons-pause-solid' : 'i-heroicons-play-solid'"
                    class="w-4 h-4"
                  />
                </button>

                <!-- Info de la canción -->
                <div class="min-w-0">
                  <p class="font-semibold text-xs text-gray-900 dark:text-white truncate" :title="track.name">
                    {{ track.name }}
                  </p>
                  <p class="text-[11px] text-gray-500 truncate">
                    {{ track.artist }} &bull; {{ formatDuration(track.duration) }}
                  </p>
                </div>
              </div>

              <!-- Botón para usar en el montaje -->
              <UButton
                size="xs"
                color="primary"
                variant="solid"
                icon="i-heroicons-plus"
                :loading="downloadingTrackId === track.id"
                @click="selectAndDownloadTrack(track)"
              >
                Usar en Vídeo
              </UButton>
            </div>
          </div>
        </div>

        <!-- Pestaña 2: Flujo Suno AI 100% Gratuito -->
        <div v-else-if="activeTab === 'suno'" class="space-y-4">
          <div class="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/50 space-y-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">🎵</span>
              <h4 class="font-bold text-sm text-purple-950 dark:text-purple-200">
                Crea una canción personalizada en Suno (Sin pagar nada)
              </h4>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Suno ofrece <strong>50 créditos gratuitos diarios</strong> a cualquier usuario con cuenta de Google o Discord. Puedes componer una canción con letra personalizada sobre tus fotos y luego incorporarla al montaje en segundos.
            </p>

            <div class="space-y-2 pt-1 text-xs text-gray-700 dark:text-gray-300">
              <div class="flex items-start gap-2">
                <span class="font-bold text-purple-600 shrink-0">1.</span>
                <span>Abre <a href="https://suno.com" target="_blank" class="underline font-semibold text-purple-600 hover:text-purple-700">suno.com</a> en una nueva pestaña.</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="font-bold text-purple-600 shrink-0">2.</span>
                <span>Pulsa en <strong>"Create"</strong> y describe tu temática (ej: <em>"Pop alegre sobre el verano y las vacaciones familiares"</em>).</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="font-bold text-purple-600 shrink-0">3.</span>
                <span>Descarga el archivo <code>.mp3</code> a tu ordenador o móvil.</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="font-bold text-purple-600 shrink-0">4.</span>
                <span>Suelta el archivo descargado en la zona de abajo 👇</span>
              </div>
            </div>

            <div class="pt-2">
              <UButton
                to="https://suno.com"
                target="_blank"
                color="purple"
                variant="solid"
                icon="i-heroicons-arrow-top-right-on-square"
                size="sm"
              >
                Abrir Suno.com (Gratis)
              </UButton>
            </div>
          </div>

          <!-- Uploader integrado para soltar la canción de Suno -->
          <div>
            <MediaUploader @uploaded="handleSunoUpload" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton color="gray" variant="ghost" @click="isOpen = false">
            Cerrar
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'selected', fileName: string): void;
}>();

const toast = useToast();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => {
    stopAudio();
    emit('update:modelValue', val);
  }
});

const activeTab = ref<'library' | 'suno'>('library');
const selectedTag = ref<string>('');
const downloadingTrackId = ref<string | null>(null);

// Audio preview HTML5
const playingTrackId = ref<string | null>(null);
let currentAudio: HTMLAudioElement | null = null;

const filters = [
  { label: '✨ Todas', tag: '' },
  { label: '☕ Lofi & Chill', tag: 'lofi' },
  { label: '🎸 Acústico & Guitarra', tag: 'acoustic' },
  { label: '🏖️ Pop & Alegre', tag: 'pop' },
  { label: '🎬 Épico & Cinematográfico', tag: 'cinematic' },
  { label: '🎹 Piano Nostálgico', tag: 'piano' }
];

// Cargar pistas
const { data: exploreData, refresh: refreshExplore } = await useFetch('/api/music/explore', {
  query: computed(() => ({ tag: selectedTag.value || undefined }))
});

const tracks = computed(() => exploreData.value?.tracks || []);

const setFilter = (tag: string) => {
  stopAudio();
  selectedTag.value = tag;
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const stopAudio = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  playingTrackId.value = null;
};

const toggleAudioPreview = (track: { id: string; audioUrl: string; name: string }) => {
  if (playingTrackId.value === track.id) {
    stopAudio();
    return;
  }

  stopAudio();
  playingTrackId.value = track.id;

  // Usar endpoint proxy local para evitar bloqueos de CORS o 403 Forbidden
  const proxyUrl = `/api/music/proxy?url=${encodeURIComponent(track.audioUrl)}`;
  currentAudio = new Audio(proxyUrl);

  currentAudio.play().catch(err => {
    console.warn('Error al reproducir preview:', err);
    toast.add({
      title: 'Aviso de audio',
      description: 'El navegador bloqueó la reproducción automática. Pulsa de nuevo para escuchar.',
      color: 'amber'
    });
    stopAudio();
  });

  currentAudio.onended = () => {
    playingTrackId.value = null;
  };

  currentAudio.onerror = (e) => {
    console.error('Error cargando audio stream:', e);
    toast.add({
      title: 'Error de reproducción',
      description: 'No se pudo reproducir la vista previa.',
      color: 'red'
    });
    stopAudio();
  };
};

const selectAndDownloadTrack = async (track: { name: string; audioUrl: string; id: string }) => {
  stopAudio();
  downloadingTrackId.value = track.id;

  try {
    const res = await $fetch<{ success: boolean; fileName: string }>('/api/music/download', {
      method: 'POST',
      body: {
        name: track.name,
        audioUrl: track.audioUrl
      }
    });

    toast.add({
      title: '¡Música añadida!',
      description: `La canción "${track.name}" se ha descargado y seleccionado para tu montaje.`,
      color: 'green'
    });

    emit('selected', res.fileName);
    isOpen.value = false;
  } catch (err: any) {
    toast.add({
      title: 'Error descargando pista',
      description: err.data?.message || err.message,
      color: 'red'
    });
  } finally {
    downloadingTrackId.value = null;
  }
};

const handleSunoUpload = () => {
  toast.add({
    title: 'Canción de Suno cargada',
    description: 'Tu pista generada en Suno ya está lista en los assets.',
    color: 'green'
  });
  isOpen.value = false;
  emit('selected', '');
};

onBeforeUnmount(() => {
  stopAudio();
});
</script>
