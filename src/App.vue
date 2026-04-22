<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { 
  ImagePlus, 
  Tags, 
  FileText, 
  Palette,
  Sun,
  Moon
} from 'lucide-vue-next'
import { useTagStore } from './stores/tag'
import { usePromptStore } from './stores/prompt'
import { useArtistStore } from './stores/artist'
import { useImageStore } from './stores/image'
import { useTagLoader } from './composables/useTagLoader'
import { useArtistLoader } from './composables/useArtistLoader'
import type { ModuleType } from './types'

// Modules
import ImageMetaParser from './modules/image-meta-parser/index.vue'
import TagSelector from './modules/tag-selector/index.vue'
import PromptManager from './modules/prompt-manager/index.vue'
import ArtistManager from './modules/artist-manager/index.vue'

const currentModule = ref<ModuleType>('parser')

const modules = [
  { id: 'parser' as ModuleType, label: '图片解析', icon: ImagePlus },
  { id: 'tags' as ModuleType, label: '标签选择', icon: Tags },
  { id: 'prompts' as ModuleType, label: '提示词管理', icon: FileText },
  { id: 'artists' as ModuleType, label: '画师管理', icon: Palette },
]

const tagStore = useTagStore()
const promptStore = usePromptStore()
const artistStore = useArtistStore()
const imageStore = useImageStore()

// Dark mode toggle
const isDark = ref(false)

const themeIcon = computed(() => isDark.value ? Sun : Moon)

function toggleTheme() {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

// Initialize theme
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

// Auto-load tags and artists
useTagLoader()
useArtistLoader()

onMounted(async () => {
  // Load existing data
  await Promise.all([
    promptStore.loadPrompts(),
    artistStore.loadArtists(),
    imageStore.loadParsedImages(),
  ])
})
</script>

<template>
  <div class="h-screen w-screen bg-background flex flex-col overflow-hidden">
    <!-- Top Header Bar -->
    <header class="h-[60px] bg-background-secondary border-b border-border flex items-center justify-between px-6 shrink-0">
      <!-- Logo with Blue Background -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
          <span class="text-white font-bold text-xl leading-none">R</span>
        </div>
        <div class="flex flex-col">
          <h1 class="text-foreground font-semibold text-lg leading-tight">Rookie Tools</h1>
          <span class="text-foreground-tertiary text-xs">ComfyUI Prompt Toolbox</span>
        </div>
      </div>

      <!-- Theme Toggle Button -->
      <button
        @click="toggleTheme"
        class="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-muted transition-all duration-200"
        :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
      >
        <component :is="themeIcon" class="w-5 h-5" />
      </button>
    </header>

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Left Aside Sidebar with Navigation -->
      <aside class="w-20 lg:w-56 bg-background-secondary border-r border-border flex flex-col py-4 shrink-0">
        <nav class="flex-1 flex flex-col gap-1 px-2">
          <button
            v-for="mod in modules"
            :key="mod.id"
            @click="currentModule = mod.id"
            :class="['aside-nav-item', { active: currentModule === mod.id }]"
          >
            <component :is="mod.icon" class="aside-nav-icon w-5 h-5 shrink-0" />
            <span class="aside-nav-label">{{ mod.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-hidden bg-background">
        <Transition name="fade" mode="out-in">
          <ImageMetaParser v-if="currentModule === 'parser'" key="parser" />
          <TagSelector v-else-if="currentModule === 'tags'" key="tags" />
          <PromptManager v-else-if="currentModule === 'prompts'" key="prompts" />
          <ArtistManager v-else-if="currentModule === 'artists'" key="artists" />
        </Transition>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Aside Navigation Styles */
.aside-nav-item {
  @apply flex items-center gap-3 px-3 py-3 rounded-xl text-foreground-secondary
         hover:text-foreground hover:bg-muted transition-all duration-200 cursor-pointer;
}

.aside-nav-item.active {
  @apply bg-primary/10 border border-primary/30;
}

.aside-nav-item.active .aside-nav-label {
  @apply text-primary;
}

/* Pink icon color */
.aside-nav-icon {
  @apply text-secondary;
}

.aside-nav-item.active .aside-nav-icon {
  @apply text-secondary;
}

/* Label hidden on small screens, visible on large */
.aside-nav-label {
  @apply hidden lg:block text-sm font-medium;
}
</style>
