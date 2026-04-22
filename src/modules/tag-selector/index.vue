<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Copy, X, Plus, Minus, Tag as TagIcon } from 'lucide-vue-next'
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
    <!-- <header class="mb-4">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #3498db 0%, #f368e0 100%);">
          <TagIcon class="w-4 h-4 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-foreground">标签选择器</h1>
      </div>
      <p class="text-muted-foreground text-sm ml-11">
        点击标签添加到选择，支持权重调整
      </p>
    </header> -->

    <!-- Search Bar -->
    <div class="relative mb-4">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        v-model="tagStore.searchQuery"
        @input="(e) => tagStore.setSearchQuery((e.target as HTMLInputElement).value)"
        type="text"
        placeholder="搜索标签..."
        class="input-field pl-10"
      />
    </div>

    <!-- Category Tabs -->
    <div class="flex gap-1.5 mb-4 overflow-x-auto scrollbar-thin pb-1">
      <button
        v-for="cat in categories"
        :key="cat"
        @click="tagStore.setSelectedCategory(cat)"
        :class="[
          'px-3.5 py-1.5 rounded-xl text-sm whitespace-nowrap transition-all duration-200 font-medium',
          tagStore.selectedCategory === cat
            ? 'text-white shadow-md'
            : 'bg-card text-muted-foreground hover:text-foreground border border-border'
        ]"
        :style="tagStore.selectedCategory === cat ? 'background: linear-gradient(135deg, #3498db 0%, #5dade2 100%); box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);' : ''"
      >
        {{ cat === 'all' ? '全部' : TAG_CATEGORY_LABELS[cat] }}
      </button>
    </div>

    <!-- Selected Tags Bar -->
    <div v-if="selectedTags.size > 0" class="mb-4 p-4 rounded-2xl border transition-all duration-200" style="background: linear-gradient(135deg, rgba(52,152,219,0.06) 0%, rgba(243,104,224,0.04) 100%); border-color: rgba(52,152,219,0.15);">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-semibold" style="color: #3498db;">已选择 {{ selectedTags.size }} 个标签</span>
        <div class="flex gap-1.5">
          <button
            @click="copySelectedTags"
            class="w-8 h-8 flex items-center justify-center text-[#3498db] hover:bg-[rgba(52,152,219,0.1)] rounded-lg transition-colors"
            title="复制到剪贴板"
          >
            <Copy class="w-4 h-4" />
          </button>
          <button
            @click="clearSelection"
            class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-colors"
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
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white shadow-sm"
          style="background: linear-gradient(135deg, #3498db 0%, #5dade2 100%);"
        >
          <span>{{ tagObj.name }}</span>
          <span v-if="tagObj.weight !== 1" class="text-white/80 text-xs">({{ tagObj.weight }})</span>
          <div class="flex items-center ml-1 border-l border-white/25 pl-1.5 gap-0.5">
            <button
              @click="updateWeight(tagObj.id, -0.1)"
              class="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors"
            >
              <Minus class="w-3 h-3" />
            </button>
            <button
              @click="updateWeight(tagObj.id, 0.1)"
              class="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors"
            >
              <Plus class="w-3 h-3" />
            </button>
            <button
              @click="removeTag(tagObj.id)"
              class="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-md transition-colors ml-0.5"
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
          <span v-if="selectedTags.has(tag.id)" class="text-xs opacity-80">
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
          <h3 class="text-sm font-bold text-muted-foreground mb-3 sticky top-0 bg-background py-2 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full" style="background: linear-gradient(135deg, #3498db 0%, #f368e0 100%);"></span>
            {{ TAG_CATEGORY_LABELS[category as TagCategory] }}
            <span class="text-muted-foreground/60 font-normal ml-1">({{ catTags.length }})</span>
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
              <span v-if="selectedTags.has(tag.id)" class="text-xs opacity-80">
                ({{ selectedTags.get(tag.id) }})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
