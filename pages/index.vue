<template>
  <div class="space-y-8">
    <!-- Banner de bienvenida Kroma Studio -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 text-white p-8 sm:p-10 shadow-lg">
      <div class="relative z-10 max-w-2xl space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold tracking-wide">
          <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-pink-300" />
          <span>KROMA STUDIO &bull; PRODUCCIÓN AUDIOVISUAL AUTOMATIZADA</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Crea montajes de cine y collages con ritmo en segundos.
        </h1>
        <p class="text-indigo-100 text-sm sm:text-base leading-relaxed">
          Arrastra tus fotos, vídeos y música. Kroma se encarga de la deduplicación por píxeles, transcodificación H.264, sincronización y subtitulado.
        </p>
      </div>
      <div class="absolute -right-8 -bottom-10 opacity-20 pointer-events-none w-72 h-72">
        <img src="/logo.svg" alt="Kroma Watermark" class="w-full h-full object-contain filter drop-shadow-2xl" />
      </div>
    </div>

    <!-- Métricas de Assets -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-video-camera" class="w-6 h-6 text-blue-500 mb-1" />
        <span class="text-2xl font-bold">{{ assets?.videos?.length ?? 0 }}</span>
        <span class="text-xs text-gray-500">Vídeos</span>
      </div>

      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-photo" class="w-6 h-6 text-emerald-500 mb-1" />
        <span class="text-2xl font-bold">{{ assets?.images?.length ?? 0 }}</span>
        <span class="text-xs text-gray-500">Imágenes</span>
      </div>

      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-musical-note" class="w-6 h-6 text-purple-500 mb-1" />
        <span class="text-2xl font-bold">{{ assets?.audios?.length ?? 0 }}</span>
        <span class="text-xs text-gray-500">Pistas Audio</span>
      </div>

      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-6 h-6 text-amber-500 mb-1" />
        <span class="text-2xl font-bold">{{ assets?.subtitles?.length ?? 0 }}</span>
        <span class="text-xs text-gray-500">Subtítulos</span>
      </div>

      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-language" class="w-6 h-6 text-pink-500 mb-1" />
        <span class="text-2xl font-bold">{{ assets?.fonts?.length ?? 0 }}</span>
        <span class="text-xs text-gray-500">Fuentes TTF</span>
      </div>

      <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        <UIcon name="i-heroicons-check-badge" class="w-6 h-6 text-primary-500 mb-1" />
        <span class="text-2xl font-bold">{{ assets?.outputs?.length ?? 0 }}</span>
        <span class="text-xs text-gray-500">Generados</span>
      </div>
    </div>

    <!-- Tarjetas de Acceso a Modos -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Tarjeta Video Maker -->
      <UCard class="hover:border-primary-500 transition-colors cursor-pointer group" @click="navigateTo('/video-maker')">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <UIcon name="i-heroicons-video-camera" class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-lg font-bold group-hover:text-primary-500 transition-colors">Video Maker</h2>
              <p class="text-xs text-gray-500">Concatenación secuencial con transcodificación en dos fases</p>
            </div>
          </div>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Combina clips heterogéneos de diferentes resoluciones y formatos. Define vídeos de inicio (intro), cierre (outro) y mezcla automáticamente los intermedios sin saltos ni desfases de audio.
        </p>
        <template #footer>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">{{ assets?.videos?.length ?? 0 }} vídeos listos</span>
            <UButton to="/video-maker" color="primary" variant="ghost" trailing-icon="i-heroicons-arrow-right">
              Abrir Asistente
            </UButton>
          </div>
        </template>
      </UCard>

      <!-- Tarjeta Collage Maker -->
      <UCard class="hover:border-primary-500 transition-colors cursor-pointer group" @click="navigateTo('/collage')">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <UIcon name="i-heroicons-photo" class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-lg font-bold group-hover:text-primary-500 transition-colors">Collage Maker</h2>
              <p class="text-xs text-gray-500">Fotos + Música + Subtítulos estilizados</p>
            </div>
          </div>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Convierte una colección de fotografías en un montaje rítmico sincronizado con tu música. Deduplica imágenes idénticas mediante Sharp y quema subtítulos con tipografía personalizada.
        </p>
        <template #footer>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-400">{{ assets?.images?.length ?? 0 }} fotos disponibles</span>
            <UButton to="/collage" color="primary" variant="ghost" trailing-icon="i-heroicons-arrow-right">
              Abrir Asistente
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Zona de Subida Rápida de Assets -->
    <div class="space-y-3">
      <h3 class="text-base font-semibold">Subir Nuevos Recursos Multimedia</h3>
      <MediaUploader @uploaded="refreshAssets" />
    </div>

    <!-- Galería de Vídeos Terminados -->
    <div v-if="assets?.outputs && assets.outputs.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold flex items-center gap-2">
          <UIcon name="i-heroicons-play-circle" class="w-5 h-5 text-primary-500" />
          Vídeos Generados Recientemente
        </h3>
        <UButton color="gray" variant="ghost" size="xs" icon="i-heroicons-arrow-path" @click="refreshAssets">
          Refrescar
        </UButton>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="video in assets.outputs"
          :key="video.name"
          class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col"
        >
          <div class="bg-black aspect-video flex items-center justify-center">
            <video controls class="w-full h-full object-contain" :src="video.url"></video>
          </div>
          <div class="p-4 flex-1 flex flex-col justify-between gap-3">
            <div>
              <p class="font-medium text-sm truncate" :title="video.name">{{ video.name }}</p>
              <p class="text-xs text-gray-500 mt-1">
                {{ (video.size / (1024 * 1024)).toFixed(2) }} MB &bull; {{ new Date(video.updatedAt).toLocaleDateString() }}
              </p>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <UButton
                size="xs"
                color="primary"
                variant="soft"
                icon="i-heroicons-arrow-down-tray"
                :to="video.url"
                download
                target="_blank"
              >
                Descargar
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: assets, refresh: refreshAssets } = await useFetch('/api/assets');
</script>
