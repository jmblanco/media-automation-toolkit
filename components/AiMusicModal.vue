<template>
  <UModal v-model="isOpen" :prevent-close="isGenerating">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
              <UIcon name="i-heroicons-sparkles" class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                Componer Música con Inteligencia Artificial
              </h3>
              <p class="text-xs text-gray-500">Genera pistas musicales a medida para tu montaje</p>
            </div>
          </div>
          <UButton
            v-if="!isGenerating"
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            class="-my-1"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div class="space-y-5 py-2">
        <!-- Selector de Proveedor -->
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Motor de Generación
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="border rounded-xl p-3 text-left transition-all relative flex flex-col justify-between"
              :class="[
                selectedProvider === 'suno'
                  ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 ring-1 ring-purple-500'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              ]"
              @click="selectedProvider = 'suno'"
            >
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-xs text-gray-900 dark:text-white">Suno AI</span>
                  <UBadge
                    size="xs"
                    :color="isSunoConfigured ? 'green' : 'gray'"
                    variant="subtle"
                  >
                    {{ isSunoConfigured ? 'Listo' : 'Requiere Key' }}
                  </UBadge>
                </div>
                <p class="text-[11px] text-gray-500">Canción completa, arreglos vocales o instrumentales de alta fidelidad.</p>
              </div>
            </button>

            <button
              type="button"
              class="border rounded-xl p-3 text-left transition-all relative flex flex-col justify-between"
              :class="[
                selectedProvider === 'musicgen'
                  ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 ring-1 ring-purple-500'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              ]"
              @click="selectedProvider = 'musicgen'"
            >
              <div>
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-xs text-gray-900 dark:text-white">Meta MusicGen</span>
                  <UBadge
                    size="xs"
                    :color="isMusicGenConfigured ? 'green' : 'gray'"
                    variant="subtle"
                  >
                    {{ isMusicGenConfigured ? 'Listo' : 'Requiere Key' }}
                  </UBadge>
                </div>
                <p class="text-[11px] text-gray-500">Fondo instrumental rápido mediante Replicate API oficial.</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Alerta de configuración si falta la clave -->
        <UAlert
          v-if="!currentProviderConfigured"
          icon="i-heroicons-information-circle"
          color="amber"
          variant="soft"
          title="Clave de API pendiente en .env"
          :description="selectedProvider === 'suno'
            ? 'Para conectar Suno añade SUNO_API_KEY en tu archivo .env (soporta wrappers como aimusicapi.ai o apiframe).'
            : 'Para usar MusicGen añade REPLICATE_API_TOKEN en tu archivo .env.'"
        />

        <!-- Prompt de la Música -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">
              Descripción del Estilo o Letra <span class="text-red-500">*</span>
            </label>
            <span class="text-[10px] text-gray-400">Puedes escribir en español</span>
          </div>
          <UTextarea
            v-model="prompt"
            :rows="3"
            placeholder="Ejemplo: Lofi hip hop relajante con piano nostálgico y ritmo suave para fotos familiares..."
          />

          <!-- Presets rápidos -->
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="preset in presets"
              :key="preset.label"
              type="button"
              class="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-600 dark:hover:text-purple-300 transition-colors"
              @click="applyPreset(preset.prompt)"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Opciones adicionales -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre de la Pista
            </label>
            <UInput v-model="trackTitle" placeholder="musica_verano" icon="i-heroicons-musical-note" />
          </div>

          <div class="flex items-center pt-5">
            <UCheckbox
              v-model="isInstrumental"
              name="instrumental"
              label="Solo Instrumental (Sin letra cantada)"
            />
          </div>
        </div>

        <!-- Estado de generación en curso -->
        <div v-if="isGenerating" class="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-purple-600 animate-spin shrink-0" />
          <div class="text-xs">
            <p class="font-semibold text-purple-900 dark:text-purple-200">
              Componiendo pista con {{ selectedProvider === 'suno' ? 'Suno AI' : 'Meta MusicGen' }}...
            </p>
            <p class="text-purple-700 dark:text-purple-400 mt-0.5">
              La IA está orquestando los instrumentos y generando el archivo de audio. Puede tomar entre 15 y 35 segundos.
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <UButton
            color="gray"
            variant="ghost"
            :disabled="isGenerating"
            @click="isOpen = false"
          >
            Cancelar
          </UButton>

          <UButton
            color="primary"
            icon="i-heroicons-sparkles"
            :loading="isGenerating"
            :disabled="!prompt.trim() || isGenerating"
            @click="handleGenerate"
          >
            {{ isGenerating ? 'Componiendo...' : 'Generar Música' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'generated', fileName: string): void;
}>();

const toast = useToast();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

const selectedProvider = ref<'suno' | 'musicgen'>('suno');
const prompt = ref('');
const trackTitle = ref('');
const isInstrumental = ref(true);
const isGenerating = ref(false);

// Consultar estado de los proveedores configurados
const { data: providersData, refresh: refreshProviders } = await useFetch('/api/ai/providers');

const isSunoConfigured = computed(() => {
  const p = providersData.value?.musicProviders?.find(x => x.id === 'suno');
  return Boolean(p?.configured);
});

const isMusicGenConfigured = computed(() => {
  const p = providersData.value?.musicProviders?.find(x => x.id === 'musicgen');
  return Boolean(p?.configured);
});

const currentProviderConfigured = computed(() => {
  return selectedProvider.value === 'suno' ? isSunoConfigured.value : isMusicGenConfigured.value;
});

const presets = [
  { label: '☕ Chill Lofi', prompt: 'Lofi hip hop relajante con piano nostálgico, vinilo crepitante y ritmo suave para fotos familiares.' },
  { label: '🏖️ Pop Verano', prompt: 'Pop alegre y soleado con guitarra acústica, ukelele y palmas festivas, tempo animado.' },
  { label: '🎬 Épico Cine', prompt: 'Banda sonora cinematográfica orquestal, cuerdas crecientes, timbales emotivos y final triunfal.' },
  { label: '🎸 Acústico', prompt: 'Melodía suave de guitarra española acústica, ambiente íntimo y cálido.' },
  { label: '🎂 Cumpleaños', prompt: 'Música festiva y feliz para celebración de cumpleaños, ritmo pop enérgico y optimista.' }
];

const applyPreset = (presetText: string) => {
  prompt.value = presetText;
};

const handleGenerate = async () => {
  if (!prompt.value.trim()) return;

  isGenerating.value = true;
  try {
    const res = await $fetch<{ success: boolean; result: { fileName: string; title: string } }>(
      '/api/ai/generate-music',
      {
        method: 'POST',
        body: {
          prompt: prompt.value.trim(),
          title: trackTitle.value.trim() || undefined,
          provider: selectedProvider.value,
          instrumental: isInstrumental.value
        }
      }
    );

    toast.add({
      title: '¡Música generada con éxito!',
      description: `La pista ${res.result.fileName} ya está disponible en tus assets.`,
      color: 'green'
    });

    emit('generated', res.result.fileName);
    isOpen.value = false;
    prompt.value = '';
    trackTitle.value = '';
  } catch (err: any) {
    toast.add({
      title: 'Error al generar música',
      description: err.data?.message || err.message || 'No se pudo completar la composición.',
      color: 'red'
    });
  } finally {
    isGenerating.value = false;
  }
};
</script>
