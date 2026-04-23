import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { db } from '../services/db';
import type { PromptRecord, TagWithWeight, ImageParameters } from '../types';
import { STORES } from '../types';
import { compressImage } from '../utils/imageCompressor';

export const usePromptStore = defineStore('prompt', () => {
  // State
  const prompts = ref<PromptRecord[]>([]);
  const currentPrompt = ref<PromptRecord | null>(null);
  const isLoading = ref(false);

  // Getters
  const sortedPrompts = computed(() => {
    return [...prompts.value].sort((a, b) => b.updatedAt - a.updatedAt);
  });

  const getPromptById = computed(() => (id: string) => {
    return prompts.value.find(p => p.id === id);
  });

  // Actions
  async function loadPrompts() {
    isLoading.value = true;
    try {
      prompts.value = await db.getAll<PromptRecord>(STORES.PROMPTS);
    } finally {
      isLoading.value = false;
    }
  }

  async function createPrompt(data: {
    name: string;
    positive: string;
    negative: string;
    tags?: TagWithWeight[];
    source?: 'manual' | 'parsed';
    thumbnailData?: string;
    previewData?: string;
    parameters?: ImageParameters;
  }): Promise<PromptRecord> {
    const now = Date.now();
    const prompt: PromptRecord = {
      id: crypto.randomUUID(),
      name: data.name,
      positive: data.positive,
      negative: data.negative,
      tags: data.tags || [],
      source: data.source || 'manual',
      thumbnailData: data.thumbnailData,
      previewData: data.previewData,
      parameters: data.parameters,
      createdAt: now,
      updatedAt: now,
    };

    console.log('[PromptStore] 创建提示词:', {
      id: prompt.id,
      name: prompt.name,
      hasThumbnail: !!prompt.thumbnailData,
      thumbnailLength: prompt.thumbnailData?.length,
    });

    await db.put(STORES.PROMPTS, prompt);
    prompts.value.unshift(prompt);

    // 验证保存后的数据
    const saved = await db.get<PromptRecord>(STORES.PROMPTS, prompt.id);
    console.log('[PromptStore] 保存到数据库后:', {
      id: saved?.id,
      hasThumbnail: !!saved?.thumbnailData,
      thumbnailLength: saved?.thumbnailData?.length,
    });

    return prompt;
  }

  async function updatePrompt(id: string, updates: Partial<PromptRecord>) {
    const prompt = prompts.value.find(p => p.id === id);
    if (!prompt) return;

    const updated = {
      ...prompt,
      ...updates,
      updatedAt: Date.now(),
    };

    await db.put(STORES.PROMPTS, updated);
    const index = prompts.value.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts.value[index] = updated;
    }

    if (currentPrompt.value?.id === id) {
      currentPrompt.value = updated;
    }
  }

  async function deletePrompt(id: string) {
    await db.delete(STORES.PROMPTS, id);
    prompts.value = prompts.value.filter(p => p.id !== id);
    if (currentPrompt.value?.id === id) {
      currentPrompt.value = null;
    }
  }

  function setCurrentPrompt(prompt: PromptRecord | null) {
    currentPrompt.value = prompt;
  }

  function createEmptyPrompt(): PromptRecord {
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      name: '新建提示词',
      positive: '',
      negative: '',
      tags: [],
      source: 'manual',
      createdAt: now,
      updatedAt: now,
    };
  }

  // Import from parsed image metadata with image data
  async function importFromMetadata(
    name: string,
    positive: string,
    negative: string,
    thumbnailData?: string,
    previewData?: string,
    parameters?: ImageParameters
  ): Promise<PromptRecord> {
    return createPrompt({
      name,
      positive,
      negative,
      source: 'parsed',
      thumbnailData,
      previewData,
      parameters,
    });
  }

  // Create prompt with image file (compresses image automatically)
  async function createPromptWithImage(
    data: {
      name: string;
      positive: string;
      negative: string;
      tags?: TagWithWeight[];
    },
    imageFile?: File
  ): Promise<PromptRecord> {
    let thumbnailData: string | undefined;
    let previewData: string | undefined;

    if (imageFile) {
      const compressed = await compressImage(imageFile);
      thumbnailData = compressed.thumbnailData;
      previewData = compressed.previewData;
    }

    return createPrompt({
      ...data,
      source: 'manual',
      thumbnailData,
      previewData,
    });
  }

  return {
    prompts,
    currentPrompt,
    isLoading,
    sortedPrompts,
    getPromptById,
    loadPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    setCurrentPrompt,
    createEmptyPrompt,
    importFromMetadata,
    createPromptWithImage,
  };
});
