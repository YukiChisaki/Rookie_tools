/**
 * 画师串管理 Store（蜜汁配方模块）
 * 负责画师串的 CRUD 操作、搜索过滤和数据持久化
 * @author CodeBuddy
 * @since 2026-04-24 21:14:00
 */

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { db } from '../services/db';
import type { ArtistChain } from '../types';
import { STORES } from '../types';

export const useArtistStore = defineStore('artist', () => {
  // ============ State ============
  const artistChains = ref<ArtistChain[]>([]);
  const isLoading = ref(false);
  const searchQuery = ref('');

  // ============ Getters ============

  /** 按 updatedAt 降序排列的画师串列表 */
  const sortedChains = computed(() => {
    return [...artistChains.value].sort((a, b) => b.updatedAt - a.updatedAt);
  });

  /** 
   * 超级模糊搜索：按 searchQuery 过滤画师串列表
   * 支持搜索：配方名称、画师名、卡片标签
   * 支持空格分词：多关键词 AND 语义（每个关键词必须命中至少一个字段）
   */
  const filteredChains = computed(() => {
    if (!searchQuery.value.trim()) return sortedChains.value;

    // 按空格拆分多个关键词，过滤空值
    const keywords = searchQuery.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (keywords.length === 0) return sortedChains.value;

    return sortedChains.value.filter((chain) => {
      // 每个关键词都必须命中至少一个字段（AND 语义）
      return keywords.every((kw) => {
        // 1. 搜索配方名称
        if (chain.name.toLowerCase().includes(kw)) return true;

        // 2. 搜索画师名
        if (chain.artistNames.some((name) => name.toLowerCase().includes(kw))) return true;

        // 3. 搜索卡片标签（tags）
        if (chain.tags?.some((tag) => tag.toLowerCase().includes(kw))) return true;

        return false;
      });
    });
  });

  /** 根据 ID 获取单个画师串 */
  const getChainById = computed(() => (id: string) => {
    return artistChains.value.find((c) => c.id === id);
  });

  // ============ Actions ============

  /**
   * 从 IndexedDB 加载画师串数据
   * 包含防御性旧数据迁移逻辑：检测到旧版 artistIds 字段时映射为空数组
   */
  async function loadArtists() {
    isLoading.value = true;
    try {
      const chains = await db.getAll<ArtistChain>(STORES.ARTIST_CHAINS);
      // 防御性迁移：旧版数据可能含有 artistIds 字段，需转换为新格式
      artistChains.value = chains.map((chain) => {
        const oldChain = chain as Record<string, unknown>;
        if ('artistIds' in oldChain && !('artistNames' in oldChain)) {
          return {
            ...chain,
            artistNames: [],
            updatedAt: chain.updatedAt || chain.createdAt,
          } as ArtistChain;
        }
        return chain;
      });
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 创建新的画师串
   * @param name 配方名称
   * @param artistNames 画师名称数组
   * @param thumbnailData 可选的缩略图 Base64 数据
   * @param previewData 可选的预览图 Base64 数据
   * @param tags 可选的自定义标签数组
   */
  async function createChain(
    name: string,
    artistNames: string[],
    thumbnailData?: string,
    previewData?: string,
    tags?: string[]
  ): Promise<ArtistChain> {
    const now = Date.now();
    const chain: ArtistChain = {
      id: crypto.randomUUID(),
      name,
      artistNames,
      thumbnailData,
      previewData,
      tags: tags && tags.length > 0 ? tags : undefined,
      createdAt: now,
      updatedAt: now,
    };
    await db.put(STORES.ARTIST_CHAINS, chain);
    artistChains.value.push(chain);
    return chain;
  }

  /**
   * 更新画师串
   * @param id 画师串 ID
   * @param updates 要更新的字段（部分更新）
   */
  async function updateChain(id: string, updates: Partial<ArtistChain>) {
    const chain = artistChains.value.find((c) => c.id === id);
    if (!chain) return;

    const updated = { ...chain, ...updates, updatedAt: Date.now() };
    await db.put(STORES.ARTIST_CHAINS, updated);
    const index = artistChains.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      artistChains.value[index] = updated;
    }
  }

  /**
   * 删除画师串
   * @param id 画师串 ID
   */
  async function deleteChain(id: string) {
    await db.delete(STORES.ARTIST_CHAINS, id);
    artistChains.value = artistChains.value.filter((c) => c.id !== id);
  }

  /** 设置搜索关键词 */
  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  return {
    artistChains,
    isLoading,
    searchQuery,
    sortedChains,
    filteredChains,
    getChainById,
    loadArtists,
    createChain,
    updateChain,
    deleteChain,
    setSearchQuery,
  };
});
