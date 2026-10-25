<template>
  <UModal v-model="isModalOpen" :prevent-close="state.isRendering">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              :name="state.isRendering ? 'i-heroicons-arrow-path' : state.error ? 'i-heroicons-x-circle' : 'i-heroicons-check-circle'"
              class="w-6 h-6"
              :class="[
                state.isRendering ? 'animate-spin text-primary-500' : '',
                state.error ? 'text-red-500' : '',
                !state.isRendering && !state.error ? 'text-green-500' : ''
              ]"
            />
            <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
              {{ state.isRendering ? 'Procesando Montaje Multimedia...' : state.error ? 'Error en el Renderizado' : '¡Proceso Finalizado!' }}
            </h3>
          </div>
          <UButton
            v-if="!state.isRendering"
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            class="-my-1"
            @click="isModalOpen = false"
          />
        </div>
      </template>

      <div class="space-y-4 py-2">
        <!-- Mensaje de estado -->
        <p class="text-sm text-gray-600 dark:text-gray-300">
          {{ state.message }}
        </p>

        <!-- Barra de progreso -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs text-gray-500">
            <span>Progreso</span>
            <span>{{ state.percent }}%</span>
          </div>
          <UProgress :value="state.percent" :color="state.error ? 'red' : 'primary'" indicator />
        </div>

        <!-- Detalle de clips o imágenes -->
        <div v-if="state.current !== undefined && state.total" class="text-xs text-gray-500">
          Elemento {{ state.current }} de {{ state.total }}
        </div>

        <!-- Alerta de error -->
        <UAlert
          v-if="state.error"
          icon="i-heroicons-exclamation-triangle"
          color="red"
          variant="soft"
          :title="state.error"
        />

        <!-- Vídeo terminado -->
        <div v-if="state.outputFile && !state.isRendering" class="pt-2 space-y-3">
          <video
            controls
            class="w-full rounded-lg bg-black aspect-video max-h-60"
            :src="state.outputFile"
          ></video>
          <div class="flex justify-end gap-2">
            <UButton
              icon="i-heroicons-arrow-down-tray"
              color="primary"
              :to="state.outputFile"
              download
              target="_blank"
            >
              Descargar Vídeo
            </UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            v-if="!state.isRendering"
            color="gray"
            variant="solid"
            @click="isModalOpen = false"
          >
            Cerrar
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const { state, isModalOpen } = useRenderProgress();
</script>
