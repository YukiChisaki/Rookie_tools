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
  Users,
  Palette
} from 'lucide-vue-next'
import { useDialog, useMessage } from 'naive-ui'
import { useArtistStore } from '../../stores/artist'
import { useTagStore } from '../../stores/tag'
import type { Artist, ArtistChain } from '../../types'

const artistStore = useArtistStore()
const tagStore = useTagStore()
const dialog = useDialog()
const message = useMessage()

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

function deleteChain(chainId: string) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个画师串吗？此操作不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await artistStore.deleteChain(chainId)
      message.success('画师串已删除')
    },
  })
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
    <!-- <header class="mb-4">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background: linear-gradient(135deg, #3498db 0%, #f368e0 100%);">
          <Palette class="w-4 h-4 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-foreground">画师与画师串管理</h1>
      </div>
      <p class="text-muted-foreground text-sm ml-11">
        管理画师风格，创建画师组合串
      </p>
    </header> -->

    <!-- Tabs -->
    <div class="flex gap-1.5 mb-5 p-1.5 rounded-2xl bg-muted/50 border border-border">
      <button
        @click="activeTab = 'artists'"
        :class="[
          'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2',
          activeTab === 'artists'
            ? 'text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        ]"
        :style="activeTab === 'artists' ? 'background: linear-gradient(135deg, #3498db 0%, #5dade2 100%); box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);' : ''"
      >
        <Users class="w-4 h-4" />
        画师
        <span class="text-xs opacity-70 font-medium">({{ artistStore.artists.length }})</span>
      </button>
      <button
        @click="activeTab = 'chains'"
        :class="[
          'flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2',
          activeTab === 'chains'
            ? 'text-white shadow-md'
            : 'text-muted-foreground hover:text-foreground'
        ]"
        :style="activeTab === 'chains' ? 'background: linear-gradient(135deg, #f368e0 0%, #e056c8 100%); box-shadow: 0 2px 8px rgba(243, 104, 224, 0.3);' : ''"
      >
        <Link2 class="w-4 h-4" />
        画师串
        <span class="text-xs opacity-70 font-medium">({{ artistStore.artistChains.length }})</span>
      </button>
    </div>

    <!-- Artists Tab -->
    <div v-if="activeTab === 'artists'" class="flex-1 flex flex-col overflow-hidden">
      <!-- Search -->
      <div class="relative mb-4">
        <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            class="group relative rounded-2xl p-3 transition-all duration-200 cursor-pointer border hover:shadow-md hover:-translate-y-0.5"
            style="background: var(--card); border-color: var(--border);"
          >
            <!-- Favorite Button -->
            <button
              @click.stop="toggleFavorite(artist)"
              :class="[
                'absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 z-10',
                artist.isFavorite 
                  ? 'text-[#f59e0b] bg-[rgba(245,158,11,0.12)]' 
                  : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-[#f59e0b] hover:bg-[rgba(245,158,11,0.08)]'
              ]"
            >
              <Star class="w-3.5 h-3.5" :fill="artist.isFavorite ? 'currentColor' : 'none'" />
            </button>

            <!-- Artist Info -->
            <div 
              @click="copyArtistName(artist)"
            >
              <!-- Avatar Placeholder -->
              <div class="aspect-square rounded-xl flex items-center justify-center mb-2.5" style="background: linear-gradient(135deg, rgba(52,152,219,0.12) 0%, rgba(243,104,224,0.08) 100%);">
                <span class="text-2xl font-bold" style="color: #3498db;">
                  {{ artist.name.charAt(0).toUpperCase() }}
                </span>
              </div>
              <p class="text-sm font-medium text-foreground truncate text-center" :title="artist.name">
                {{ artist.name }}
              </p>
              <p class="text-xs text-muted-foreground text-center mt-0.5">
                使用 {{ artist.useCount }} 次
              </p>
            </div>
          </div>
        </div>

        <div v-if="filteredArtists.length === 0" class="text-center py-12">
          <div class="w-16 h-16 rounded-2xl bg-[rgba(52,152,219,0.06)] flex items-center justify-center mx-auto mb-4">
            <Users class="w-8 h-8 text-[#3498db]/40" />
          </div>
          <p class="text-muted-foreground font-medium">暂无画师数据</p>
          <p class="text-sm text-muted-foreground/70 mt-1">从标签系统导入画师数据</p>
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
        <div v-else class="glass-panel p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-foreground">
              {{ editingChain ? '编辑画师串' : '新建画师串' }}
            </h3>
            <button
              @click="cancelBuildingChain"
              class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-[#ef4444] rounded-lg transition-colors"
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
          
          <p class="text-sm text-muted-foreground mb-1">
            已选择 <span class="font-semibold text-[#3498db]">{{ selectedArtistsForChain.length }}</span> 位画师
          </p>
          <p v-if="selectedArtistsForChain.length > 0" class="text-xs text-[#3498db] mb-4 line-clamp-2 bg-[rgba(52,152,219,0.06)] rounded-lg px-3 py-2">
            {{ getArtistNamesForChain() }}
          </p>
          
          <div class="flex gap-2">
            <button
              @click="cancelBuildingChain"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            >
              取消
            </button>
            <button
              @click="saveChain"
              :disabled="!chainName.trim() || selectedArtistsForChain.length < 2"
              class="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:transform-none"
            >
              <Save class="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>

      <!-- Artist Selector (when building chain) -->
      <div v-if="isBuildingChain" class="flex-1 overflow-y-auto scrollbar-thin -mx-2 px-2 mb-4">
        <h4 class="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full" style="background: linear-gradient(135deg, #3498db 0%, #f368e0 100%);"></span>
          选择画师
        </h4>
        <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
          <button
            v-for="artist in artistStore.artists"
            :key="artist.id"
            @click="toggleArtistForChain(artist.id)"
            :class="[
              'p-2.5 rounded-xl text-sm truncate transition-all duration-200 font-medium',
              isArtistInChain(artist.id)
                ? 'text-white shadow-sm'
                : 'bg-card text-muted-foreground hover:text-foreground border border-border hover:border-[#3498db]/30'
            ]"
            :style="isArtistInChain(artist.id) ? 'background: linear-gradient(135deg, #3498db 0%, #5dade2 100%); box-shadow: 0 2px 8px rgba(52, 152, 219, 0.25);' : ''"
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
          class="glass-panel p-5"
        >
          <div class="flex items-start justify-between mb-2.5">
            <h3 class="font-bold text-foreground">{{ chain.name }}</h3>
            <div class="flex gap-1">
              <button
                @click="copyChain(chain)"
                class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-[#3498db] hover:bg-[rgba(52,152,219,0.08)] rounded-lg transition-colors"
              >
                <Copy class="w-4 h-4" />
              </button>
              <button
                @click="editChain(chain)"
                class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-[#3498db] hover:bg-[rgba(52,152,219,0.08)] rounded-lg transition-colors"
              >
                <Link2 class="w-4 h-4" />
              </button>
              <button
                @click="deleteChain(chain.id)"
                class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] rounded-lg transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p class="text-sm text-muted-foreground leading-relaxed">
            {{ artistStore.getArtistsInChain(chain.id).map(a => a.name).join(', ') }}
          </p>
        </div>

        <div v-if="artistStore.artistChains.length === 0" class="text-center py-12">
          <div class="w-16 h-16 rounded-2xl bg-[rgba(243,104,224,0.06)] flex items-center justify-center mx-auto mb-4">
            <Link2 class="w-8 h-8 text-[#f368e0]/40" />
          </div>
          <p class="text-muted-foreground font-medium">暂无画师串</p>
          <button
            @click="startBuildingChain"
            class="text-[#f368e0] hover:text-[#e056c8] text-sm mt-2 font-medium transition-colors"
          >
            创建第一个画师串
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
