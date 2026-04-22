<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Search, 
  Star, 
  Plus, 
  Trash2, 
  Copy, 
  Link2,
  X,
  Save,
  Users
} from 'lucide-vue-next'
import { useArtistStore } from '../../stores/artist'
import { useTagStore } from '../../stores/tag'
import type { Artist, ArtistChain } from '../../types'

const artistStore = useArtistStore()
const tagStore = useTagStore()

const activeTab = ref<'artists' | 'chains'>('artists')
const searchQuery = ref('')

// Chain builder
const isBuildingChain = ref(false)
const chainName = ref('')
const selectedArtistsForChain = ref<string[]>([])

// Edit chain
const editingChain = ref<ArtistChain | null>(null)

const filteredArtists = computed(() => {
  let result = artistStore.artists
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(a => a.name.toLowerCase().includes(query))
  }
  
  return result.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1
    return b.useCount - a.useCount
  })
})

function toggleFavorite(artist: Artist) {
  artistStore.toggleFavorite(artist.id)
}

function copyArtistName(artist: Artist) {
  navigator.clipboard.writeText(artist.name)
  artistStore.incrementUseCount(artist.id)
}

function copyChain(chain: ArtistChain) {
  const names = artistStore.getArtistsInChain(chain.id).map(a => a.name)
  navigator.clipboard.writeText(names.join(', '))
}

function startBuildingChain() {
  isBuildingChain.value = true
  chainName.value = ''
  selectedArtistsForChain.value = []
}

function cancelBuildingChain() {
  isBuildingChain.value = false
  chainName.value = ''
  selectedArtistsForChain.value = []
  editingChain.value = null
}

async function saveChain() {
  if (!chainName.value.trim() || selectedArtistsForChain.value.length < 2) return
  
  if (editingChain.value) {
    await artistStore.updateChain(editingChain.value.id, {
      name: chainName.value,
      artistIds: selectedArtistsForChain.value,
    })
  } else {
    await artistStore.createChain(chainName.value, selectedArtistsForChain.value)
  }
  
  cancelBuildingChain()
}

function editChain(chain: ArtistChain) {
  editingChain.value = chain
  chainName.value = chain.name
  selectedArtistsForChain.value = [...chain.artistIds]
  isBuildingChain.value = true
  activeTab.value = 'chains'
}

async function deleteChain(chainId: string) {
  if (confirm('确定要删除这个画师串吗？')) {
    await artistStore.deleteChain(chainId)
  }
}

function toggleArtistForChain(artistId: string) {
  const index = selectedArtistsForChain.value.indexOf(artistId)
  if (index > -1) {
    selectedArtistsForChain.value.splice(index, 1)
  } else {
    selectedArtistsForChain.value.push(artistId)
  }
}

function isArtistInChain(artistId: string): boolean {
  return selectedArtistsForChain.value.includes(artistId)
}

function getArtistNamesForChain(): string {
  return selectedArtistsForChain.value
    .map(id => artistStore.getArtistById(id)?.name)
    .filter(Boolean)
    .join(', ')
}
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-hidden">
    <!-- Header -->
    <header class="mb-4">
      <h1 class="text-2xl font-semibold text-foreground mb-2">画师与画师串管理</h1>
      <p class="text-foreground-secondary text-sm">
        管理画师风格，创建画师组合串
      </p>
    </header>

    <!-- Tabs -->
    <div class="flex gap-1 mb-4 p-1 bg-background-tertiary rounded-xl">
      <button
        @click="activeTab = 'artists'"
        :class="[
          'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
          activeTab === 'artists'
            ? 'bg-primary text-white'
            : 'text-foreground-secondary hover:text-foreground'
        ]"
      >
        <div class="flex items-center justify-center gap-2">
          <Users class="w-4 h-4" />
          画师
          <span class="text-xs opacity-70">({{ artistStore.artists.length }})</span>
        </div>
      </button>
      <button
        @click="activeTab = 'chains'"
        :class="[
          'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
          activeTab === 'chains'
            ? 'bg-primary text-white'
            : 'text-foreground-secondary hover:text-foreground'
        ]"
      >
        <div class="flex items-center justify-center gap-2">
          <Link2 class="w-4 h-4" />
          画师串
          <span class="text-xs opacity-70">({{ artistStore.artistChains.length }})</span>
        </div>
      </button>
    </div>

    <!-- Artists Tab -->
    <div v-if="activeTab === 'artists'" class="flex-1 flex flex-col overflow-hidden">
      <!-- Search -->
      <div class="relative mb-4">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索画师..."
          class="input-field pl-10"
        />
      </div>

      <!-- Artists Grid -->
      <div class="flex-1 overflow-y-auto scrollbar-thin -mx-2 px-2">
        <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          <div
            v-for="artist in filteredArtists"
            :key="artist.id"
            class="group relative bg-background-secondary rounded-xl p-3 hover:bg-background-tertiary transition-colors border border-transparent hover:border-white/10"
          >
            <!-- Favorite Button -->
            <button
              @click="toggleFavorite(artist)"
              :class="[
                'absolute top-2 right-2 p-1 rounded-lg transition-colors z-10',
                artist.isFavorite 
                  ? 'text-warning bg-warning/20' 
                  : 'text-foreground-tertiary opacity-0 group-hover:opacity-100 hover:text-warning'
              ]"
            >
              <Star class="w-4 h-4" :fill="artist.isFavorite ? 'currentColor' : 'none'" />
            </button>

            <!-- Artist Info -->
            <div 
              @click="copyArtistName(artist)"
              class="cursor-pointer"
            >
              <!-- Avatar Placeholder -->
              <div class="aspect-square rounded-lg bg-gradient-to-br from-primary/30 to-primary-dark/30 flex items-center justify-center mb-2">
                <span class="text-2xl font-bold text-primary-light">
                  {{ artist.name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <p class="text-sm text-foreground truncate text-center" :title="artist.name">
                {{ artist.name }}
              </p>
              <p class="text-xs text-foreground-tertiary text-center">
                使用 {{ artist.useCount }} 次
              </p>
            </div>
          </div>
        </div>

        <div v-if="filteredArtists.length === 0" class="text-center py-12 text-foreground-tertiary">
          <Users class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无画师数据</p>
          <p class="text-sm mt-1">从标签系统导入画师数据</p>
        </div>
      </div>
    </div>

    <!-- Chains Tab -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- Build Chain Button -->
      <div class="mb-4">
        <button
          v-if="!isBuildingChain"
          @click="startBuildingChain"
          class="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus class="w-4 h-4" />
          新建画师串
        </button>

        <!-- Chain Builder -->
        <div v-else class="glass-panel p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-medium text-foreground">
              {{ editingChain ? '编辑画师串' : '新建画师串' }}
            </h3>
            <button
              @click="cancelBuildingChain"
              class="p-1 text-foreground-tertiary hover:text-error"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
          
          <input
            v-model="chainName"
            type="text"
            placeholder="输入画师串名称..."
            class="input-field mb-3"
          />
          
          <p class="text-sm text-foreground-secondary mb-2">
            已选择 {{ selectedArtistsForChain.length }} 位画师
          </p>
          <p v-if="selectedArtistsForChain.length > 0" class="text-xs text-primary mb-3 line-clamp-2">
            {{ getArtistNamesForChain() }}
          </p>
          
          <div class="flex gap-2">
            <button
              @click="cancelBuildingChain"
              class="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              @click="saveChain"
              :disabled="!chainName.trim() || selectedArtistsForChain.length < 2"
              class="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save class="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>

      <!-- Artist Selector (when building chain) -->
      <div v-if="isBuildingChain" class="flex-1 overflow-y-auto scrollbar-thin -mx-2 px-2 mb-4">
        <h4 class="text-sm font-medium text-foreground-secondary mb-2">选择画师</h4>
        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          <button
            v-for="artist in artistStore.artists"
            :key="artist.id"
            @click="toggleArtistForChain(artist.id)"
            :class="[
              'p-2 rounded-lg text-sm truncate transition-colors',
              isArtistInChain(artist.id)
                ? 'bg-primary text-white'
                : 'bg-background-tertiary text-foreground-secondary hover:bg-white/10'
            ]"
          >
            {{ artist.name }}
          </button>
        </div>
      </div>

      <!-- Chains List -->
      <div v-else class="flex-1 overflow-y-auto scrollbar-thin -mx-2 px-2 space-y-3">
        <div
          v-for="chain in artistStore.artistChains"
          :key="chain.id"
          class="glass-panel p-4"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-medium text-foreground">{{ chain.name }}</h3>
            <div class="flex gap-1">
              <button
                @click="copyChain(chain)"
                class="p-1.5 text-foreground-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Copy class="w-4 h-4" />
              </button>
              <button
                @click="editChain(chain)"
                class="p-1.5 text-foreground-tertiary hover:text-info hover:bg-info/10 rounded-lg transition-colors"
              >
                <Link2 class="w-4 h-4" />
              </button>
              <button
                @click="deleteChain(chain.id)"
                class="p-1.5 text-foreground-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p class="text-sm text-foreground-secondary">
            {{ artistStore.getArtistsInChain(chain.id).map(a => a.name).join(', ') }}
          </p>
        </div>

        <div v-if="artistStore.artistChains.length === 0" class="text-center py-12 text-foreground-tertiary">
          <Link2 class="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>暂无画师串</p>
          <button
            @click="startBuildingChain"
            class="text-primary hover:underline text-sm mt-2"
          >
            创建第一个画师串
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
