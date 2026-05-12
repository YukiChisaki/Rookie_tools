<script setup lang="ts">
/**
 * Rookie Tools 根组件
 * 包含导航布局、主题切换、PWA 安装/更新功能、原图归档目录配置
 * @author Chisaki / 68142319
 * @since 2026-04-26
 */
import { ref, onMounted, computed, nextTick } from 'vue'
import {
  Tags,
  FileText,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Github,
  Download,
  RefreshCw,
  BookOpen,
  FolderPlus,
  FolderOpen,
  FolderX,
} from 'lucide-vue-next'
import { darkTheme, useMessage } from 'naive-ui'
import type { GlobalTheme } from 'naive-ui'
import { usePromptStore } from './stores/prompt'
import { useArtistStore } from './stores/artist'
import { usePwa } from './composables/usePwa'
import { useImageArchive } from './composables/useImageArchive'
import { themeOverrides, darkThemeOverrides } from './styles/naiveTheme'
import type { ModuleType } from './types'

// Modules
import TagSelector from './modules/tag-selector/index.vue'
import PromptManager from './modules/prompt-manager/index.vue'
import ArtistManager from './modules/artist-manager/index.vue'
import SpellParser from './modules/spell-parser/index.vue'
import Tutorial from './modules/tutorial/index.vue'

const currentModule = ref<ModuleType>('spell')

const modules = [
  { id: 'spell' as ModuleType, label: '魔法解析', icon: Sparkles },
  { id: 'tags' as ModuleType, label: '快速标签', icon: Tags },
  { id: 'prompts' as ModuleType, label: '私人画廊', icon: FileText },
  { id: 'artists' as ModuleType, label: '蜜汁配方', icon: Palette },
  { id: 'tutorial' as ModuleType, label: '使用教程', icon: BookOpen },
]

const promptStore = usePromptStore()
const artistStore = useArtistStore()

// PWA 安装与更新
const { canInstall, isInstalled, needUpdate, installApp, updateApp } = usePwa()

// 原图归档功能
const {
  isSupported: isArchiveSupported,
  isConfigured: isArchiveConfigured,
  directoryName: archiveDirectoryName,
  selectDirectory: selectArchiveDirectory,
  disconnect: disconnectArchive,
  initialize: initializeArchive,
} = useImageArchive()

// Dark mode toggle
const isDark = ref(false)

/** 延迟初始化的 message 实例（等 <n-message-provider> 挂载后） */
let msgInstance: ReturnType<typeof useMessage> | null = null

const themeIcon = computed(() => isDark.value ? Sun : Moon)

// Naive UI 主题
const naiveTheme = computed<GlobalTheme | null>(() => isDark.value ? darkTheme : null)
const currentThemeOverrides = computed(() => isDark.value ? darkThemeOverrides : themeOverrides)

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

/** PWA 安装/启动按钮点击处理 */
const handlePwaAction = async () => {
  const result = await installApp()
  switch (result) {
    case 'focused':
      // 已在 PWA 窗口中运行
      msgInstance?.success('正在运行中...', { duration: 3000 })
      break
    case 'installed':
      msgInstance?.info('应用已安装，请从桌面或任务栏启动', { duration: 3000 })
      break
    case 'accepted':
      msgInstance?.success('安装请求已发送，请确认浏览器弹窗', { duration: 3000 })
      break
    case 'dismissed':
      msgInstance?.warning('已取消安装', { duration: 2000 })
      break
    case 'unavailable':
      msgInstance?.warning('当前环境暂不支持自动安装（可能需要 HTTPS 或非 localhost 环境）', { duration: 4000 })
      break
    case 'error':
      msgInstance?.error('安装过程出错，请重试', { duration: 3000 })
      break
  }
}

// Initialize theme & PWA message provider
onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }

  // 延迟获取 message 实例，确保 <n-message-provider> 已渲染
  nextTick(() => {
    msgInstance = useMessage()
  })
})

onMounted(async () => {
  // Load existing data
  await Promise.all([
    promptStore.loadPrompts(),
    artistStore.loadArtists(),
    initializeArchive(),
  ])
})
</script>

<template>
  <div id="app">
    <n-config-provider :theme="naiveTheme" :theme-overrides="currentThemeOverrides">
      <n-dialog-provider>
        <n-message-provider>
          <div class="h-screen w-screen bg-background flex flex-col overflow-hidden">
            <!-- PWA 更新通知条 -->
            <Transition name="slide-down">
              <div v-if="needUpdate"
                class="relative z-50 flex items-center justify-center gap-3 px-6 py-2.5 bg-primary/10 border-b border-primary/20 backdrop-blur-sm">
                <span class="text-sm font-medium text-primary">发现新版本</span>
                <button @click="updateApp"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark transition-all duration-200 active:scale-95">
                  <RefreshCw class="w-3 h-3" />
                  立即刷新
                </button>
              </div>
            </Transition>

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
              <div class="flex gap-5">
                <a href="https://github.com/YukiChisaki/Rookie_tools" target="_blank" rel="noopener noreferrer"
                  class="mt-1 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  title="GitHub 项目地址">
                  <Github class="w-5 h-5" />
                </a>
                <!-- PWA 安装/启动按钮 -->
                <button v-if="canInstall" @click="handlePwaAction" :class="[
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                  isInstalled
                    ? 'text-primary bg-primary/10 hover:bg-primary/20'
                    : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                ]" :title="isInstalled ? '应用已安装' : '安装应用到桌面'">
                  <Download class="w-[18px] h-[18px]" />
                </button>
                <!-- 原图归档目录按钮 — 仅支持 File System Access API 时显示 -->
                <n-popover v-if="isArchiveSupported" trigger="click" placement="bottom-end" :show-arrow="false" :width="240">
                  <template #trigger>
                    <button :class="[
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 relative',
                      isArchiveConfigured
                        ? 'text-primary bg-primary/10 hover:bg-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    ]" :title="isArchiveConfigured ? '原图归档目录' : '设置原图归档目录'">
                      <FolderOpen v-if="isArchiveConfigured" class="w-[18px] h-[18px]" />
                      <FolderPlus v-else class="w-[18px] h-[18px]" />
                      <!-- 已配置时的绿色指示点 -->
                      <span v-if="isArchiveConfigured"
                        class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-card">
                      </span>
                    </button>
                  </template>
                  <div class="py-2">
                    <!-- 已配置状态 -->
                    <template v-if="isArchiveConfigured">
                      <div class="px-3 pb-2 mb-2 border-b border-border">
                        <p class="text-xs text-muted-foreground mb-1">归档目录</p>
                        <p class="text-sm font-medium text-foreground truncate">{{ archiveDirectoryName }}</p>
                      </div>
                      <button @click="selectArchiveDirectory"
                        class="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted rounded-lg transition-colors duration-200 flex items-center gap-2">
                        <FolderPlus class="w-4 h-4 text-muted-foreground" />
                        更换目录
                      </button>
                      <button @click="disconnectArchive"
                        class="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors duration-200 flex items-center gap-2">
                        <FolderX class="w-4 h-4" />
                        断开连接
                      </button>
                    </template>
                    <!-- 未配置状态 -->
                    <template v-else>
                      <div class="px-3 pb-2 mb-2 border-b border-border">
                        <p class="text-sm font-medium text-foreground mb-1">原图归档</p>
                        <p class="text-xs text-muted-foreground">将剪贴板粘贴的图片原图保存到本地目录</p>
                      </div>
                      <button @click="selectArchiveDirectory"
                        class="w-full px-3 py-2 text-left text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors duration-200 flex items-center gap-2">
                        <FolderPlus class="w-4 h-4" />
                        选择归档目录
                      </button>
                    </template>
                  </div>
                </n-popover>
                <!-- Theme Toggle Button -->
                <button @click="toggleTheme"
                  class="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  :title="isDark ? '浅色模式' : '深色模式'">
                  <component :is="themeIcon" class="w-[18px] h-[18px]" />
                </button>
              </div>

            </header>

            <!-- Main Content Area -->
            <div class="flex-1 flex overflow-hidden">
              <!-- Left Aside Sidebar with Navigation -->
              <aside class="w-[72px] lg:w-40 bg-card border-r border-border flex flex-col py-3 shrink-0">
                <nav class="flex-1 flex flex-col gap-1 px-2">
                  <button v-for="mod in modules" :key="mod.id" @click="currentModule = mod.id"
                    :class="['aside-nav-item', { 'nav-active': currentModule === mod.id }]">
                    <div class="nav-icon-wrapper">
                      <component :is="mod.icon" class="aside-nav-icon w-[18px] h-[18px] shrink-0" />
                    </div>
                    <span class="aside-nav-label">{{ mod.label }}</span>
                  </button>
                </nav>

                <!-- 开发者信息与 GitHub 链接 -->
                <div class="mt-auto mx-3 pt-3 border-t border-border/40">
                  <div class="flex items-center justify-center gap-1 py-2">
                    <span class="text-xs text-muted-foreground/70 font-medium tracking-wide">2026</span>
                    <span class="text-xs text-muted-foreground/50">©</span>
                    <a href="https://github.com/YukiChisaki" target="_blank" rel="noopener noreferrer"
                      class="text-xs font-medium text-muted-foreground/70 hover:text-primary transition-colors duration-200">
                      Chisaki
                    </a>
                  </div>
                  <!-- GitHub 项目链接 -->
                  <a href="https://github.com/YukiChisaki/Rookie_tools" target="_blank" rel="noopener noreferrer"
                    class="group flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all duration-200"
                    title="GitHub 项目地址">
                    <Github class="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
                    <span class="hidden lg:inline">GitHub</span>
                  </a>
                </div>
              </aside>

              <!-- Main Content -->
              <main class="flex-1 overflow-hidden bg-background">
                <Transition name="fade" mode="out-in">
                  <TagSelector v-if="currentModule === 'tags'" key="tags" />
                  <SpellParser v-else-if="currentModule === 'spell'" key="spell" />
                  <PromptManager v-else-if="currentModule === 'prompts'" key="prompts" />
                  <ArtistManager v-else-if="currentModule === 'artists'" key="artists" />
                  <Tutorial v-else-if="currentModule === 'tutorial'" key="tutorial" />
                </Transition>
              </main>
            </div>
          </div>
        </n-message-provider>
      </n-dialog-provider>
    </n-config-provider>

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

/* 更新通知条滑入/滑出动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Aside Navigation Styles */
.aside-nav-item {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-muted-foreground;
}

.dark .aside-nav-item {
  @apply text-muted-foreground;
}

.aside-nav-item:hover {
  @apply bg-muted text-foreground;
}

.dark .aside-nav-item:hover {
  @apply bg-muted text-foreground;
}

.aside-nav-item.nav-active {
  @apply bg-primary/10 border border-primary/20 text-primary;
}

.dark .aside-nav-item.nav-active {
  @apply bg-primary/15 border border-primary/30 text-primary;
}

.aside-nav-item.nav-active .aside-nav-label {
  @apply text-primary font-semibold;
}

/* Nav icon wrapper */
.nav-icon-wrapper {
  @apply flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200 bg-secondary/40;
}

.aside-nav-item:hover .nav-icon-wrapper {
  @apply bg-secondary;
}

.aside-nav-item.nav-active .nav-icon-wrapper {
  @apply bg-primary/15;
}

/* Nav icon color - use accent color */
.aside-nav-icon {
  @apply text-accent;
}

.aside-nav-item.nav-active .aside-nav-icon {
  @apply text-primary;
}

/* Label hidden on small screens, visible on large */
.aside-nav-label {
  @apply hidden lg:block text-sm font-medium;
}
</style>
