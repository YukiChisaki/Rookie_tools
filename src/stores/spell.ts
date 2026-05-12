import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { db } from '../services/db';
import { parseImage, revokePreviewUrl } from '../services/spellParser';
import type { ParsedImageData } from '../types';
import { STORES } from '../types';
import type { ImportResult } from '../types/data-io';

const MAX_HISTORY_ITEMS = 50;

export const useSpellStore = defineStore('spell', () => {
  // State
  const parsedImages = ref<ParsedImageData[]>([]);
  const currentImage = ref<ParsedImageData | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const sortedImages = computed(() => {
    return [...parsedImages.value].sort((a, b) => b.createdAt - a.createdAt);
  });

  const recentImages = computed(() => {
    return sortedImages.value.slice(0, 10);
  });

  const hasCurrentImage = computed(() => currentImage.value !== null);

  // Actions
  async function loadHistory() {
    isLoading.value = true;
    error.value = null;

    try {
      await db.init();
      const images = await db.getAll<ParsedImageData>(STORES.PARSED_IMAGES);
      parsedImages.value = images;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载历史记录失败';
      console.error('加载解析历史失败:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function parseAndSave(file: File): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await parseImage(file);

      if (!result.success || !result.data) {
        error.value = result.error || '解析失败';
        return false;
      }

      // 设置当前图片
      currentImage.value = result.data;

      // 保存到历史记录
      await saveToHistory(result.data);

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '解析失败';
      console.error('解析图片失败:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveToHistory(image: ParsedImageData) {
    try {
      await db.init();

      // 检查是否已存在相同文件名的记录
      const existingIndex = parsedImages.value.findIndex(
        (img) => img.fileName === image.fileName
      );

      if (existingIndex !== -1) {
        // 删除旧记录（旧数据可能使用 previewUrl，需要释放）
        const oldImage = parsedImages.value[existingIndex];
        if (oldImage.previewUrl && oldImage.previewUrl !== image.previewData) {
          revokePreviewUrl(oldImage.previewUrl);
        }

        // 删除旧记录
        await db.delete(STORES.PARSED_IMAGES, oldImage.id);
        parsedImages.value.splice(existingIndex, 1);
      }

      // 保存新记录
      await db.put(STORES.PARSED_IMAGES, image);
      parsedImages.value.unshift(image);

      // 限制历史记录数量
      if (parsedImages.value.length > MAX_HISTORY_ITEMS) {
        const removed = parsedImages.value.splice(MAX_HISTORY_ITEMS);
        for (const img of removed) {
          // 兼容旧数据：如果存在 previewUrl 则释放
          if (img.previewUrl) {
            revokePreviewUrl(img.previewUrl);
          }
          await db.delete(STORES.PARSED_IMAGES, img.id);
        }
      }
    } catch (err) {
      console.error('保存到历史记录失败:', err);
    }
  }

  async function deleteFromHistory(id: string) {
    try {
      const image = parsedImages.value.find((img) => img.id === id);
      if (!image) return;

      // 兼容旧数据：如果存在 previewUrl 则释放
      if (image.previewUrl) {
        revokePreviewUrl(image.previewUrl);
      }

      // 从数据库删除
      await db.delete(STORES.PARSED_IMAGES, id);

      // 从列表移除
      parsedImages.value = parsedImages.value.filter((img) => img.id !== id);

      // 如果当前选中的是被删除的图片，清空当前图片
      if (currentImage.value?.id === id) {
        currentImage.value = null;
      }
    } catch (err) {
      console.error('删除历史记录失败:', err);
    }
  }

  function setCurrentImage(image: ParsedImageData | null) {
    currentImage.value = image;
  }

  function clearCurrentImage() {
    currentImage.value = null;
  }

  function clearError() {
    error.value = null;
  }

  /**
   * 从历史记录重新加载图片到当前视图
   */
  async function loadFromHistory(id: string): Promise<boolean> {
    const image = parsedImages.value.find((img) => img.id === id);
    if (!image) {
      error.value = '找不到该记录';
      return false;
    }

    currentImage.value = image;
    return true;
  }

  /**
   * 清空所有历史记录
   */
  async function clearAllHistory() {
    try {
      // 兼容旧数据：释放所有 previewUrl
      for (const image of parsedImages.value) {
        if (image.previewUrl) {
          revokePreviewUrl(image.previewUrl);
        }
      }

      // 清空数据库
      await db.clear(STORES.PARSED_IMAGES);

      // 清空列表
      parsedImages.value = [];
      currentImage.value = null;
    } catch (err) {
      console.error('清空历史记录失败:', err);
    }
  }

  /**
   * 批量导入魔法解析数据
   * 按 ID 去重，已有 ID 的记录自动跳过
   * @param items 待导入的解析图片数组
   * @returns 导入结果统计
   */
  async function bulkImportImages(items: ParsedImageData[]): Promise<ImportResult> {
    const existingIds = new Set(parsedImages.value.map((i) => i.id))
    const toImport = items.filter((item) => !existingIds.has(item.id))

    if (toImport.length === 0) {
      return { succeeded: 0, skipped: items.length, failed: 0 }
    }

    try {
      const cleanItems = JSON.parse(JSON.stringify(toImport))
      await db.bulkPut(STORES.PARSED_IMAGES, cleanItems)
      parsedImages.value = [...parsedImages.value, ...cleanItems]

      return {
        succeeded: toImport.length,
        skipped: items.length - toImport.length,
        failed: 0,
      }
    } catch (err) {
      console.error('[SpellStore] 批量导入失败:', err)
      return {
        succeeded: 0,
        skipped: items.length - toImport.length,
        failed: toImport.length,
      }
    }
  }

  return {
    // State
    parsedImages,
    currentImage,
    isLoading,
    error,

    // Getters
    sortedImages,
    recentImages,
    hasCurrentImage,

    // Actions
    loadHistory,
    parseAndSave,
    saveToHistory,
    deleteFromHistory,
    setCurrentImage,
    clearCurrentImage,
    clearError,
    loadFromHistory,
    clearAllHistory,
    bulkImportImages,
  };
});
