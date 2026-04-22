import { ref } from 'vue';
import { defineStore } from 'pinia';
import { db } from '../services/db';
import type { ParsedImage, ParsedImageMetadata } from '../types';
import { STORES } from '../types';

export const useImageStore = defineStore('image', () => {
  // State
  const parsedImages = ref<ParsedImage[]>([]);
  const isLoading = ref(false);

  // Actions
  async function loadParsedImages() {
    isLoading.value = true;
    try {
      parsedImages.value = await db.getAll<ParsedImage>(STORES.PARSED_IMAGES);
    } finally {
      isLoading.value = false;
    }
  }

  async function addParsedImage(
    fileName: string,
    originalBlob: Blob,
    thumbnailBlob: Blob,
    metadata: ParsedImageMetadata
  ): Promise<ParsedImage> {
    const image: ParsedImage = {
      id: crypto.randomUUID(),
      fileName,
      originalBlob,
      thumbnailBlob,
      metadata,
      parsedAt: Date.now(),
    };

    await db.put(STORES.PARSED_IMAGES, image);
    parsedImages.value.unshift(image);
    return image;
  }

  async function deleteParsedImage(id: string) {
    await db.delete(STORES.PARSED_IMAGES, id);
    parsedImages.value = parsedImages.value.filter(img => img.id !== id);
  }

  async function clearAll() {
    await db.clear(STORES.PARSED_IMAGES);
    parsedImages.value = [];
  }

  return {
    parsedImages,
    isLoading,
    loadParsedImages,
    addParsedImage,
    deleteParsedImage,
    clearAll,
  };
});
