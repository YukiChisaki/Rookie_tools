<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Copy, X, Plus, Minus } from 'lucide-vue-next'
import { useTagStore } from '../../stores/tag'
import { TAG_CATEGORY_LABELS, type TagCategory, type Tag } from '../../types'

const tagStore = useTagStore()

const selectedTags = ref<Map<string, number>>(new Map()) // tagId -> weight
const copiedTags = ref<string[]>([])

const categories: (TagCategory | 'all')[] = [
  'all',
  'artist',
  'style',
  'quality',
  'composition',
  'lighting',
  'character',
  'environment',
]

const displayedTags = computed(() => {
  if (tagStore.selectedCategory === 'all' && !tagStore.searchQuery) {
    // Show all tags grouped by category
    return tagStore.tagsByCategory
  }
  return null
})

function toggleTag(tag: Tag) {
  if (selectedTags.value.has(tag.id)) {
    selectedTags.value.delete(tag.id)
  } else {
    selectedTags.value.set(tag.id, 1)
    tagStore.incrementTagUse(tag.id)
  }
}

function updateWeight(tagId: string, delta: number) {
  const current = selectedTags.value.get(tagId) || 1
  const newWeight = Math.max(0.1, Math.min(2, Math.round((current + delta) * 10) / 10))
  selectedTags.value.set(tagId, newWeight)
}

function removeTag(tagId: string) {
  selectedTags.value.delete(tagId)
}

function formatTagWithWeight(tag: Tag): string {
  const weight = selectedTags.value.get(tag.id) || 1
  if (weight === 1) return tag.name
  return `(${tag.name}:${weight})`
}

function copySelectedTags() {
  const text = Array.from(selectedTags.value.entries())
    .map(([tagId, weight]) => {
      const tag = tagStore.getTagById(tagId)
      if (!tag) return ''
      if (weight === 1) return tag.name
      return `(${tag.name}:${weight})`
    })
    .filter(Boolean)
    .join(', ')
  
  navigator.clipboard.writeText(text)
  copiedTags.value = Array.from(selectedTags.value.keys())
  setTimeout(() => copiedTags.value = [], 1000)
}

function clearSelection() {
  selectedTags.value.clear()
}

function getSelectedTagObjects(): (Tag & { weight: number })[] {
  return Array.from(selectedTags.value.entries())
    .map(([id, weight]) => {
      const tag = tagStore.getTagById(id)
      return tag ? { ...tag, weight } : null
    })
    .filter(Boolean) as (Tag & { weight: number })[]
}
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-hidden">
    <!-- Header -->
    <header class="mb-4">
      <h1 class="text-2xl font-semibold text-foreground mb-2">标签选择器</h1>
      <p class="text-foreground-secondary text-sm">
        点击标签添加到选择，支持权重调整
      </p>
    </header>

    <!-- Search Bar -->
    <div class="relative mb-4">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
      <input
        v-model="tagStore.searchQuery"
        @input="(e) => tagStore.setSearchQuery((e.target as HTMLInputElement).value)"
        type="text"
        placeholder="搜索标签..."
        class="input-field pl-10"
      />
    </div>

    <!-- Category Tabs -->
    <div class="flex gap-1 mb-4 overflow-x-auto scrollbar-thin pb-1">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="tagStore.setSelectedCategory(cat)"
        :class="[
          'px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors',
          tagStore.selectedCategory === cat
            ? 'bg-primary text-white'
            : 'bg-background-tertiary text-foreground-secondary hover:bg-white/10'
        ]"
      >
        {{ cat === 'all' ? '全部' : TAG_CATEGORY_LABELS[cat] }}
      </button>
    </div>

    <!-- Selected Tags Bar -->
    <div v-if="selectedTags.size > 0" class="mb-4 p-3 bg-primary/10 rounded-xl border border-primary/20">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-primary">已选择 {{ selectedTags.size }} 个标签</span>
        <div class="flex gap-2">
          <button
            @click="copySelectedTags"
            class="p-1.5 text-primary hover:bg-primary/20 rounded-lg transition-colors"
            title="复制到剪贴板"
          >
            <Copy class="w-4 h-4" />
          </button>
          <button
            @click="clearSelection"
            class="p-1.5 text-foreground-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
            title="清空选择"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="tagObj in getSelectedTagObjects()"
          :key="tagObj.id"
          class="flex items-center gap-1 px-2 py-1 bg-primary text-white rounded-lg text-sm"
        >
          <span>{{ tagObj.name }}</span>
          <span v-if="tagObj.weight !== 1" class="text-primary-light text-xs">({{ tagObj.weight }})</span>
          <div class="flex items-center ml-1 border-l border-white/20 pl-1">
            <button
              @click="updateWeight(tagObj.id, -0.1)"
              class="p-0.5 hover:bg-white/20 rounded"
            >
              <Minus class="w-3 h-3" />
            </button>
            <button
              @click="updateWeight(tagObj.id, 0.1)"
              class="p-0.5 hover:bg-white/20 rounded"
            >
              <Plus class="w-3 h-3" />
            </button>
            <button
              @click="removeTag(tagObj.id)"
              class="p-0.5 hover:bg-white/20 rounded ml-1"
            >
              <X class="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tags Grid -->
    <div class="flex-1 overflow-y-auto scrollbar-thin -mx-2 px-2">
      <!-- Search Results -->
      <div v-if="tagStore.searchQuery || tagStore.selectedCategory !== 'all'" class="flex flex-wrap gap-2">
        <button
          v-for="tag in tagStore.filteredTags"
          :key="tag.id"
          @click="toggleTag(tag)"
          :class="[
            'tag-chip',
            { selected: selectedTags.has(tag.id) }
          ]"
        >
          {{ tag.name }}
          <span v-if="selectedTags.has(tag.id)" class="text-xs">
            ({{ selectedTags.get(tag.id) }})
          </span>
        </button>
      </div>

      <!-- Grouped by Category -->
      <div v-else class="space-y-6">
        <div
          v-for="(catTags, category) in displayedTags"
          :key="category"
        >
          <h3 class="text-sm font-medium text-foreground-secondary mb-3 sticky top-0 bg-background py-2">
            {{ TAG_CATEGORY_LABELS[category as TagCategory] }}
            <span class="text-foreground-tertiary ml-1">({{ catTags.length }})</span>
          </h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in catTags"
              :key="tag.id"
              @click="toggleTag(tag)"
              :class="[
                'tag-chip',
                { selected: selectedTags.has(tag.id) }
              ]"
            >
              {{ tag.name }}
              <span v-if="selectedTags.has(tag.id)" class="text-xs">
                ({{ selectedTags.get(tag.id) }})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
