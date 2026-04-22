import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { db } from '../services/db';
import type { Tag, TagCategory } from '../types';
import { STORES } from '../types';

export const useTagStore = defineStore('tag', () => {
  // State
  const tags = ref<Tag[]>([]);
  const isLoading = ref(false);
  const searchQuery = ref('');
  const selectedCategory = ref<TagCategory | 'all'>('all');

  // Getters
  const filteredTags = computed(() => {
    let result = tags.value;

    if (selectedCategory.value !== 'all') {
      result = result.filter(tag => tag.category === selectedCategory.value);
    }

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase();
      result = result.filter(tag => 
        tag.name.toLowerCase().includes(query) ||
        tag.aliases.some(alias => alias.toLowerCase().includes(query))
      );
    }

    return result.sort((a, b) => b.useCount - a.useCount);
  });

  const tagsByCategory = computed(() => {
    const grouped: Record<TagCategory, Tag[]> = {
      artist: [],
      style: [],
      quality: [],
      composition: [],
      lighting: [],
      character: [],
      environment: [],
    };

    tags.value.forEach(tag => {
      grouped[tag.category].push(tag);
    });

    // Sort each category by useCount
    Object.keys(grouped).forEach(key => {
      grouped[key as TagCategory].sort((a, b) => b.useCount - a.useCount);
    });

    return grouped;
  });

  const getTagById = computed(() => (id: string) => {
    return tags.value.find(tag => tag.id === id);
  });

  // Actions
  async function loadTags() {
    isLoading.value = true;
    try {
      tags.value = await db.getAll<Tag>(STORES.TAGS);
    } finally {
      isLoading.value = false;
    }
  }

  async function addTag(tag: Omit<Tag, 'id' | 'useCount'>) {
    const newTag: Tag = {
      ...tag,
      id: crypto.randomUUID(),
      useCount: 0,
    };
    await db.put(STORES.TAGS, newTag);
    tags.value.push(newTag);
    return newTag;
  }

  async function updateTag(id: string, updates: Partial<Tag>) {
    const tag = tags.value.find(t => t.id === id);
    if (!tag) return;

    const updated = { ...tag, ...updates };
    await db.put(STORES.TAGS, updated);
    const index = tags.value.findIndex(t => t.id === id);
    if (index !== -1) {
      tags.value[index] = updated;
    }
  }

  async function incrementTagUse(id: string) {
    const tag = tags.value.find(t => t.id === id);
    if (!tag) return;

    tag.useCount++;
    await db.put(STORES.TAGS, tag);
  }

  async function importTags(newTags: Omit<Tag, 'id' | 'useCount'>[]) {
    const tagsToAdd: Tag[] = newTags.map(tag => ({
      ...tag,
      id: crypto.randomUUID(),
      useCount: 0,
    }));

    await db.bulkPut(STORES.TAGS, tagsToAdd);
    tags.value = await db.getAll<Tag>(STORES.TAGS);
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query;
  }

  function setSelectedCategory(category: TagCategory | 'all') {
    selectedCategory.value = category;
  }

  return {
    tags,
    isLoading,
    searchQuery,
    selectedCategory,
    filteredTags,
    tagsByCategory,
    getTagById,
    loadTags,
    addTag,
    updateTag,
    incrementTagUse,
    importTags,
    setSearchQuery,
    setSelectedCategory,
  };
});
