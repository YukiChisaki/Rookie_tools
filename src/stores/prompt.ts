import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { db } from '../services/db';
import type { PromptRecord, TagWithWeight, ImageParameters } from '../types';
import { STORES } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { generateId } from '../utils/id';
import type { ImportResult } from '../types/data-io';

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
    
    // 深拷贝 parameters，去除可能的不可克隆属性（如 getter、原型链等）
    const cleanParameters = data.parameters 
      ? JSON.parse(JSON.stringify(data.parameters)) 
      : undefined;
    
    const prompt: PromptRecord = {
      id: generateId(),
      name: data.name,
      positive: data.positive,
      negative: data.negative,
      tags: data.tags || [],
      source: data.source || 'manual',
      thumbnailData: data.thumbnailData,
      previewData: data.previewData,
      parameters: cleanParameters,
      createdAt: now,
      updatedAt: now,
    };

    console.log('[PromptStore] createPrompt 构建的 PromptRecord:', {
      id: prompt.id,
      name: prompt.name,
      positiveLength: prompt.positive?.length || 0,
      negativeLength: prompt.negative?.length || 0,
      hasParameters: !!prompt.parameters,
      parametersKeys: prompt.parameters ? Object.keys(prompt.parameters) : 'none',
      hasThumbnail: !!prompt.thumbnailData,
      thumbnailLength: prompt.thumbnailData?.length,
    });

    await db.put(STORES.PROMPTS, prompt);
    prompts.value.unshift(prompt);

    // 验证保存后的数据
    const saved = await db.get<PromptRecord>(STORES.PROMPTS, prompt.id);
    console.log('[PromptStore] 保存到数据库后验证:', {
      id: saved?.id,
      name: saved?.name,
      positiveLength: saved?.positive?.length || 0,
      negativeLength: saved?.negative?.length || 0,
      hasParameters: !!saved?.parameters,
      parametersKeys: saved?.parameters ? Object.keys(saved.parameters) : 'none',
      hasThumbnail: !!saved?.thumbnailData,
      thumbnailLength: saved?.thumbnailData?.length,
    });

    return prompt;
  }

  async function updatePrompt(id: string, updates: Partial<PromptRecord>) {
    const prompt = prompts.value.find(p => p.id === id);
    if (!prompt) return;

    const raw = {
      ...prompt,
      ...updates,
      updatedAt: Date.now(),
    };

    // 深拷贝去除所有层级的 Vue 响应式代理，否则 IndexedDB put() 会报 DataCloneError
    // toRaw 仅剥一层 Proxy，对嵌套的 reactive 对象无效
    const updated = JSON.parse(JSON.stringify(raw));

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
      id: generateId(),
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
    console.log('[PromptStore] importFromMetadata 接收参数:', {
      name,
      positiveLength: positive?.length || 0,
      negativeLength: negative?.length || 0,
      hasThumbnail: !!thumbnailData,
      hasPreview: !!previewData,
      hasParameters: !!parameters,
      parametersKeys: parameters ? Object.keys(parameters) : 'none',
    });
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

  /**
   * 批量导入提示词数据
   * 按 ID 去重，已有 ID 的记录自动跳过
   * @param items 待导入的提示词数组
   * @returns 导入结果统计
   */
  async function bulkImportPrompts(items: PromptRecord[]): Promise<ImportResult> {
    const existingIds = new Set(prompts.value.map((p) => p.id))
    const toImport = items.filter((item) => !existingIds.has(item.id))

    if (toImport.length === 0) {
      return { succeeded: 0, skipped: items.length, failed: 0 }
    }

    try {
      // 深拷贝去除 Vue 响应式代理
      const cleanItems = JSON.parse(JSON.stringify(toImport))
      await db.bulkPut(STORES.PROMPTS, cleanItems)
      prompts.value = [...prompts.value, ...cleanItems]

      return {
        succeeded: toImport.length,
        skipped: items.length - toImport.length,
        failed: 0,
      }
    } catch (err) {
      console.error('[PromptStore] 批量导入失败:', err)
      return {
        succeeded: 0,
        skipped: items.length - toImport.length,
        failed: toImport.length,
      }
    }
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
    bulkImportPrompts,
  };
});
