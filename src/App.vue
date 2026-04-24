<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Tags,
  FileText,
  Palette,
  Sun,
  Moon,
  Sparkles
} from 'lucide-vue-next'
import { darkTheme } from 'naive-ui'
import type { GlobalTheme } from 'naive-ui'
import { useTagStore } from './stores/tag'
import { usePromptStore } from './stores/prompt'
import { useArtistStore } from './stores/artist'
import { useTagLoader } from './composables/useTagLoader'
import { themeOverrides, darkThemeOverrides } from './styles/naiveTheme'
import type { ModuleType } from './types'

// Modules
import TagSelector from './modules/tag-selector/index.vue'
import PromptManager from './modules/prompt-manager/index.vue'
import ArtistManager from './modules/artist-manager/index.vue'
import SpellParser from './modules/spell-parser/index.vue'

const currentModule = ref<ModuleType>('spell')

const modules = [
  { id: 'spell' as ModuleType, label: '魔法解析', icon: Sparkles },
  { id: 'tags' as ModuleType, label: '快速标签', icon: Tags },
  { id: 'prompts' as ModuleType, label: '私人画廊', icon: FileText },
  { id: 'artists' as ModuleType, label: '蜜汁配方', icon: Palette },
]

const tagStore = useTagStore()
const promptStore = usePromptStore()
const artistStore = useArtistStore()

// Dark mode toggle
const isDark = ref(false)

const themeIcon = computed(() => isDark.value ? Sun : Moon)

// Naive UI 主题
const naiveTheme = computed<GlobalTheme | null>(() => isDark.value ? darkTheme : null)
const currentThemeOverrides = computed(() => isDark.value ? darkThemeOverrides : themeOverrides)

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

// Auto-load tags
useTagLoader()

onMounted(async () => {
  // Load existing data
  await Promise.all([
    promptStore.loadPrompts(),
    artistStore.loadArtists(),
  ])
})
</script>

<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="currentThemeOverrides">
    <n-dialog-provider>
      <n-message-provider>
        <div class="h-screen w-screen bg-background flex flex-col overflow-hidden">
          <!-- Top Header Bar -->
          <header class="h-[64px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
            <!-- Logo -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                style="background: linear-gradient(135deg, #3498db 0%, #f368e0 100%); box-shadow: 0 4px 14px rgba(52, 152, 219, 0.35);">
                <span class="text-white font-bold text-xl leading-none">R</span>
              </div>
              <div class="flex flex-col">
                <h1 class="text-foreground font-bold text-lg leading-tight tracking-tight">Rookie Tools</h1>
              </div>
            </div>

            <!-- Theme Toggle Button -->
            <button @click="toggleTheme"
              class="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              :title="isDark ? '浅色模式' : '深色模式'">
              <component :is="themeIcon" class="w-[18px] h-[18px]" />
            </button>
          </header>

          <!-- Main Content Area -->
          <div class="flex-1 flex overflow-hidden">
            <!-- Left Aside Sidebar with Navigation -->
            <aside class="w-[72px] lg:w-40 bg-card border-r border-border flex flex-col py-3 shrink-0">
              <nav class="flex-1 flex flex-col gap-1 px-2">
                <button v-for="mod in modules" :key="mod.id" @click="currentModule = mod.id"
                  :class="['aside-nav-item', { active: currentModule === mod.id }]">
                  <div class="nav-icon-wrapper">
                    <component :is="mod.icon" class="aside-nav-icon w-[18px] h-[18px] shrink-0" />
                  </div>
                  <span class="aside-nav-label">{{ mod.label }}</span>
                </button>
              </nav>
            </aside>

            <!-- Main Content -->
            <main class="flex-1 overflow-hidden bg-background">
              <Transition name="fade" mode="out-in">
                <!-- <TagSelector v-if="currentModule === 'tags'" key="tags" /> -->
                <SpellParser v-if="currentModule === 'spell'" key="spell" />
                <PromptManager v-else-if="currentModule === 'prompts'" key="prompts" />
                <ArtistManager v-else-if="currentModule === 'artists'" key="artists" />
              </Transition>
            </main>
          </div>
        </div>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
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
  @apply flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer;
  color: #64748b;
}

.dark .aside-nav-item {
  color: #94a3b8;
}

.aside-nav-item:hover {
  background-color: #f1f5f9;
  color: #1e293b;
}

.dark .aside-nav-item:hover {
  background-color: #334155;
  color: #f8fafc;
}

.aside-nav-item.active {
  background-color: rgba(52, 152, 219, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.dark .aside-nav-item.active {
  background-color: rgba(52, 152, 219, 0.15);
  border: 1px solid rgba(52, 152, 219, 0.3);
}

.aside-nav-item.active .aside-nav-label {
  color: #3498db;
  font-weight: 600;
}

/* Nav icon wrapper */
.nav-icon-wrapper {
  @apply flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200;
  background-color: rgba(243, 104, 224, 0.1);
}

.aside-nav-item:hover .nav-icon-wrapper {
  background-color: rgba(243, 104, 224, 0.15);
}

.aside-nav-item.active .nav-icon-wrapper {
  background-color: rgba(52, 152, 219, 0.15);
}

/* Pink icon color */
.aside-nav-icon {
  color: #f368e0;
}

.aside-nav-item.active .aside-nav-icon {
  color: #3498db;
}

/* Label hidden on small screens, visible on large */
.aside-nav-label {
  @apply hidden lg:block text-sm font-medium;
}
</style>
