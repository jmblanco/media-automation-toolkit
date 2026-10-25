<template>
  <div
    class="border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer"
    :class="[
      isDragging
        ? 'border-primary-500 bg-primary-500/10'
        : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 bg-gray-50/50 dark:bg-gray-800/50'
    ]"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
  >
    <input
      ref="fileInputRef"
      type="file"
      multiple
      class="hidden"
      accept="image/*,video/*,audio/*,.srt,.vtt,.ttf,.otf"
      @change="handleFileSelect"
    />

    <div class="flex flex-col items-center justify-center gap-2">
      <div class="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
        <UIcon name="i-heroicons-arrow-up-tray" class="w-7 h-7" />
      </div>
      <div>
        <p class="font-semibold text-gray-800 dark:text-gray-200">
          Arrastra aquí tus archivos multimedia o haz clic para explorar
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Soporta imágenes (JPG, PNG), vídeos (MP4, MOV), audios (MP3, WAV), subtítulos (.SRT) y fuentes (.TTF)
        </p>
      </div>

      <div v-if="isUploading" class="w-full max-w-xs mt-3 flex items-center justify-center gap-2 text-sm text-primary-500">
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
        <span>Subiendo archivos...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  (e: 'uploaded'): void;
}>();

const toast = useToast();
const isDragging = ref(false);
const isUploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (!isUploading.value) {
    fileInputRef.value?.click();
  }
};

const uploadFiles = async (files: FileList | File[]) => {
  if (!files || files.length === 0) return;

  isUploading.value = true;
  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i]);
  }

  try {
    const res = await $fetch<{ success: boolean; uploaded: string[] }>('/api/upload', {
      method: 'POST',
      body: formData
    });

    toast.add({
      title: '¡Subida completada!',
      description: `Se han subido ${res.uploaded.length} archivos a sus carpetas de assets.`,
      color: 'green'
    });

    emit('uploaded');
  } catch (err: any) {
    toast.add({
      title: 'Error de subida',
      description: err.data?.message || err.message || 'No se pudieron subir los archivos.',
      color: 'red'
    });
  } finally {
    isUploading.value = false;
    if (fileInputRef.value) fileInputRef.value.value = '';
  }
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files) {
    uploadFiles(e.dataTransfer.files);
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    uploadFiles(target.files);
  }
};
</script>
