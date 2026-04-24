<script setup lang="ts">
/**
 * 蜜汁配方模块 — 画师串管理界面
 * 支持画师串 CRUD、图片关联、逗号分隔输入画师名、自动去重、瀑布流展示、双格式复制
 *
 * 交互设计：点击卡片直接进入编辑弹窗（编辑=预览），无独立详情弹窗
 *
 * @author CodeBuddy
 * @since 2026-04-24 21:14:00
 */
import { ref, computed, watch, onUnmounted } from 'vue'
import {
  Plus,
  Search,
  X,
  Palette,
  Trash2,
  ImageIcon,
  Copy,
  AtSign,
  ImagePlus,
  Parentheses,
} from 'lucide-vue-next'
import { MasonryWall } from '@yeger/vue-masonry-wall'
import { useDialog, useMessage } from 'naive-ui'
import { useArtistStore } from '../../stores/artist'
import type { ArtistChain } from '../../types'
import { compressImage } from '../../utils/imageCompressor'

// ============ Store & Hooks ============
const artistStore = useArtistStore()
const dialog = useDialog()
const message = useMessage()

// ============ 搜索与过滤 ============
const searchQuery = ref('')

watch(searchQuery, (val) => {
  artistStore.setSearchQuery(val)
})

const filteredChains = computed(() => artistStore.filteredChains)

// ============ 弹窗状态 ============
const showEditModal = ref(false)
const isCreating = ref(true)

// ============ 编辑表单 ============
interface EditFormType {
  id?: string
  name: string
  artistNames: string[]       // 画师名数组（动态标签）
  tags: string[]             // 卡片标签数组（动态标签）
  imageFile?: File | undefined
  thumbnailData?: string
  previewData?: string
}

const editForm = ref<EditFormType>({
  name: '',
  artistNames: [],
  tags: [],
})

// ============ 标签颜色工具函数 ============
/** Naive UI Tag 可用类型列表 */
const TAG_TYPES: readonly ('success' | 'info' | 'warning' | 'error' | 'default')[] = [
  'success', 'info', 'warning', 'error', 'default',
]

/** 基于索引哈希生成稳定的随机标签颜色 */
const getTagTypeForIndex = (index: number): 'success' | 'info' | 'warning' | 'error' | 'default' => {
  const hash = (index * 2654435761) & 0x7fffffff
  return TAG_TYPES[hash % TAG_TYPES.length]
}

// ============ 弹窗操作 ============

function openCreateModal() {
  isCreating.value = true
  editForm.value = { name: '', artistNames: [], tags: [] }
  showEditModal.value = true
}

/** 打开编辑弹窗（查看已有配方）— 编辑即预览 */
function openEditModal(chain: ArtistChain) {
  isCreating.value = false
  editForm.value = {
    id: chain.id,
    name: chain.name,
    artistNames: [...chain.artistNames],
    tags: chain.tags ? [...chain.tags] : [],
    thumbnailData: chain.thumbnailData,
    previewData: chain.previewData,
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editForm.value = { name: '', artistNames: [], tags: [] }
}

// ============ 图片上传逻辑 ============
const imageInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

const previewImageUrl = computed(() => {
  if (editForm.value.imageFile) return URL.createObjectURL(editForm.value.imageFile)
  return editForm.value.previewData || ''
})

const hasImagePreview = computed(() => !!previewImageUrl.value)

function processImageFile(file: File | null) {
  if (!file) return
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    message.error('仅支持 JPG/PNG/GIF/WebP 格式')
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    message.error('图片大小不能超过 20MB')
    return
  }
  editForm.value.imageFile = file
}

function triggerImageSelect() {
  imageInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  processImageFile(target.files?.[0] ?? null)
  target.value = ''
}

function handleDragOver(e: DragEvent) {
  e.preventDefault(); e.stopPropagation()
  isDragOver.value = true
}
function handleDragLeave(e: DragEvent) {
  e.preventDefault(); e.stopPropagation()
  isDragOver.value = false
}
function handleDrop(e: DragEvent) {
  e.preventDefault(); e.stopPropagation()
  isDragOver.value = false
  processImageFile(e.dataTransfer?.files[0] ?? null)
}
function handleRemoveImage() {
  editForm.value.imageFile = undefined
}

// ============ 保存 ============
async function saveChain() {
  const form = editForm.value
  if (!form.name.trim()) { message.warning('请输入配方名称'); return }

  // 复用 cleanedArtistNames 数据源，同步回写去重结果到表单
  const names = cleanedArtistNames.value
  if (names.length === 0) { message.warning('请至少输入一个画师名称'); return }
  form.artistNames = names

  const tags = [...new Set(form.tags.map((t) => t.trim()).filter((t) => t.length > 0))]
  form.tags = tags

  let thumbnailData = form.thumbnailData
  let previewData = form.previewData

  if (form.imageFile) {
    try {
      const compressed = await compressImage(form.imageFile)
      thumbnailData = compressed.thumbnailData
      previewData = compressed.previewData
    } catch {
      message.error('图片压缩失败，请重试')
      return
    }
  }

  if (isCreating.value) {
    await artistStore.createChain(form.name.trim(), names, thumbnailData, previewData, tags)
    message.success('配方已创建')
  } else if (form.id) {
    await artistStore.updateChain(form.id, {
      name: form.name.trim(),
      artistNames: names,
      tags: tags.length > 0 ? tags : undefined,
      thumbnailData,
      previewData,
    })
    message.success('配方已保存')
  }
  closeEditModal()
}

// ============ 删除 ============
function deleteChain(id: string) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个配方吗？此操作不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await artistStore.deleteChain(id)
      if (showEditModal.value && editForm.value.id === id) closeEditModal()
      message.success('配方已删除')
    },
  })
}

// ============ 复制功能（基于当前编辑表单数据） ============

// ============ 1. 核心格式化逻辑 (纯函数，易于单元测试) ============

type ArtistFormatter = (names: string[]) => string

const formatters: Record<'normal' | 'anima', ArtistFormatter> = {
  normal: (names) => names.map((n) => `(artist:${n}:1)`).join(', '),
  anima: (names) => names.map((n) => `@${n}`).join(', ')
}

// ============ 2. 数据源 ============

/**
 * 唯一数据源：去重 + 小写化后的画师名数组
 * 优化：加入兜底空数组保护，使用 Boolean 简化 filter
 */
const cleanedArtistNames = computed(() => {
  const names = editForm.value?.artistNames || []
  return [...new Set(
    names.map((n) => n.trim().toLowerCase()).filter(Boolean)
  )]
})

// ============ 3. 复制功能 Composable (Vue 3 最佳实践) ============

/**
 * 将"文案状态"、"定时器清理"、"异常处理"封装起来
 *
 * @author CodeBuddy
 * @since 2026-04-25 00:22:00
 */
function useCopyAction(resetText: string) {
  const text = ref(resetText)
  let timer: ReturnType<typeof setTimeout> | null = null

  const doCopy = async (content: string): Promise<void> => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      // text.value = '已复制 ✓'
      message.success('已复制到剪贴板')
    } catch (err) {
      console.error('Clipboard write failed:', err)
      message.error('复制失败，请手动复制')
      return // 失败则不执行状态重置逻辑
    }

    // 清理遗留定时器，防止连续点击时的状态闪烁
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      text.value = resetText
    }, 1500)
  }

  // 组件卸载时清理残留定时器，防内存泄漏
  onUnmounted(() => { if (timer) clearTimeout(timer) })

  return { text, doCopy }
}

// ============ 4. 业务使用 ============

// 实例化按钮状态与操作
const normalCopyBtn = useCopyAction('SDXL')
const animaCopyBtn = useCopyAction('Anima')

// 瀑布流卡片专用按钮状态（短文本版本）
const cardNormalCopyBtn = useCopyAction('XL')
const cardAnimaCopyBtn = useCopyAction('AM')

// 执行复制入口：传入格式化后的文本
const copyNormalFormat = () => normalCopyBtn.doCopy(formatters.normal(cleanedArtistNames.value))
const copyAnimaFormat = () => animaCopyBtn.doCopy(formatters.anima(cleanedArtistNames.value))

// ============ 5. 预览状态 (安全的纯 Getter) ============

/**
 * 安全获取预览文本 — 空态兜底 + 纯函数计算
 * 直接返回字符串而非 computed，避免与复制操作产生耦合
 */
function getPreview(names: string[], formatter: ArtistFormatter): string {
  if (!names.length) return '暂无画师'
  return formatter(names)
}

/** 模板中通过 cleanedArtistNames + formatters 组合使用 */
const normalCopyPreview = computed(() => getPreview(cleanedArtistNames.value, formatters.normal))
const animaCopyPreview = computed(() => getPreview(cleanedArtistNames.value, formatters.anima))


// ============ 逗号分隔输入逻辑 ============

/** 画师配方输入框的临时文本 */
const artistInputText = ref('')

/** 卡片标签输入框的临时文本 */
const tagInputText = ref('')

/**
 * 处理画师配方输入：回车时按逗号分割，去重后追加到 editForm.artistNames
 * @author Chisaki / 68142319
 * @since 2026-04-25 01:26:00
 */
function handleArtistInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    parseAndAddItems(artistInputText.value, 'artist')
    artistInputText.value = ''
  }
}

/**
 * 处理卡片标签输入：回车时按逗号分割，去重后追加到 editForm.tags
 * @author Chisaki / 68142319
 * @since 2026-04-25 01:26:00
 */
function handleTagInputKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    parseAndAddItems(tagInputText.value, 'tag')
    tagInputText.value = ''
  }
}

/**
 * 通用解析逻辑：按中英文逗号分割、trim、过滤空值、去重后追加到对应数组
 *
 * @param rawInput 原始输入文本
 * @param type 目标类型：'artist' → artistNames | 'tag' → tags
 */
function parseAndAddItems(rawInput: string, type: 'artist' | 'tag') {
  const items = rawInput.split(/[,，]/).map((s) => s.trim()).filter((s) => s.length > 0)
  const targetArr = type === 'artist' ? editForm.value.artistNames : editForm.value.tags
  const existingSet = new Set(targetArr.map((t) => t.toLowerCase()))
  for (const item of items) {
    if (!existingSet.has(item.toLowerCase())) {
      existingSet.add(item.toLowerCase())
      targetArr.push(item)
    }
  }
}

/**
 * 移除指定索引的标签项（通用）
 * @author Chisaki / 68142319
 * @since 2026-04-25 01:26:00
 */
function removeTagItem(type: 'artist' | 'tag', index: number) {
  const arr = type === 'artist' ? editForm.value.artistNames : editForm.value.tags
  arr.splice(index, 1)
}
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <div class="h-full flex flex-col ">
    <!-- ==================== Block 1: 顶栏导航区 ==================== -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 gap-3 shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-bold text-foreground">蜜汁配方</h2>
        <span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
          {{ filteredChains.length }} 个配方
        </span>
      </div>
      <div class="flex items-center gap-3 flex-1">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input v-model="searchQuery" type="text" placeholder="搜索配方..." class="input-field pl-10 text-sm w-full" />
        </div>
        <button @click="openCreateModal" class="btn-primary text-sm flex items-center gap-2 shrink-0">
          <Plus class="w-4 h-4" />
          新建配方
        </button>
      </div>
    </div>

    <!-- ==================== Block 2: 瀑布流图片卡片区 ==================== -->
    <n-scrollbar class="flex-1">
      <div class="p-6">
        <!-- 空状态 -->
        <div v-if="filteredChains.length === 0"
          class="flex flex-col items-center justify-center text-muted-foreground min-h-[400px]">
          <div
            class="w-20 h-20 rounded-2xl bg-[rgba(52,152,219,0.06)] dark:bg-[rgba(52,152,219,0.12)] flex items-center justify-center mb-5">
            <Palette class="w-10 h-10 text-[#3498db]/30" />
          </div>
          <p class="font-medium">{{ searchQuery ? '未找到匹配的配方' : '暂无画师串' }}</p>
          <button v-if="!searchQuery" @click="openCreateModal" class="btn-primary mt-5 flex items-center gap-2">
            <Plus class="w-4 h-4" />
            新建第一个配方
          </button>
        </div>

        <!-- 瀑布流卡片 -->
        <MasonryWall v-else :items="filteredChains" :column-width="220" :gap="16" :ssr-columns="1">
          <template #default="{ item: chain }">
            <div
              class="group bg-card border border-dotted border-[--secondary] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ">
              <!-- 图片区域 — 点击直接进入编辑弹窗 -->
              <div class="bg-muted/50 relative overflow-hidden" @click="openEditModal(chain)">
                <img v-if="chain.previewData" :src="chain.previewData" :alt="chain.name"
                  class="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" />
                <div v-else class="aspect-square flex items-center justify-center">
                  <div
                    class="w-16 h-16 rounded-2xl bg-[rgba(52,152,219,0.08)] dark:bg-[rgba(52,152,219,0.15)] flex items-center justify-center">
                    <ImageIcon class="w-8 h-8 text-[#3498db]/40" />
                  </div>
                </div>
                <!-- Hover 顶部遮罩：日期 + 来源标签 -->
                <div class="absolute inset-x-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div class="flex items-center justify-between px-3 py-2 bg-black/40">
                    <span class="text-sm text-white/90">{{ formatDate(chain.updatedAt) }}</span>
                    <button @click.stop="deleteChain(chain.id)"
                      class="w-7 h-7 bg-white text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center flex-shrink-0">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <!-- Hover 底部遮罩：名称 + 数量 + 删除 -->
                <div
                  class="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div class="flex items-center justify-between gap-2 px-3 py-2 bg-black/40">
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                      <h3 class="font-medium text-white text-sm truncate" :title="chain.name">{{ chain.name }}</h3>
                      <span class="text-xs text-white/70 bg-white/15 px-1.5 py-0.5 rounded-md shrink-0">
                        {{ chain.artistNames.length }}
                      </span>
                    </div>
                    <!-- 复制 -->
                    <div class="flex items-center gap-2.5 flex-wrap">
                      <n-popover trigger="hover" placement="bottom" :show-arrow="false">
                        <template #trigger>
                          <button
                            @click.stop="cardNormalCopyBtn.doCopy(formatters.normal(chain.artistNames.map(n => n.trim().toLowerCase()).filter(Boolean)))"
                            class="!p-1 text-sm  rounded-xl flex items-center gap-1 font-medium bg-[--primary] text-white hover:!bg-white hover:!text-primary  hover:-translate-y-0.5 transition-all duration-200">
                            <Parentheses class="w-4 h-4" />
                            {{ cardNormalCopyBtn.text }}
                          </button>
                        </template>
                        <div class="max-w-[280px] text-xs leading-relaxed">
                          <p class="text-muted-foreground mb-1">配方预览：</p>
                          <p class="font-mono text-foreground break-all bg-muted/60 rounded-md px-2 py-1.5">{{
                            getPreview([...new Set(chain.artistNames.map(n => n.trim().toLowerCase()).filter(Boolean))],
                              formatters.normal)
                          }}</p>
                        </div>
                      </n-popover>
                      <n-popover trigger="hover" placement="bottom" :show-arrow="false">
                        <template #trigger>
                          <button
                            @click.stop="cardAnimaCopyBtn.doCopy(formatters.anima(chain.artistNames.map(n => n.trim().toLowerCase()).filter(Boolean)))"
                            class="!p-1 text-sm flex items-center gap-1 font-medium rounded-xl bg-pink-500 text-white hover:bg-white hover:text-pink-500 transition-all duration-200 hover:-translate-y-0.5">
                            <AtSign class="w-4 h-4" />
                            {{ cardAnimaCopyBtn.text }}
                          </button>
                        </template>
                        <div class="max-w-[280px] text-xs leading-relaxed">
                          <p class="text-muted-foreground mb-1">配方预览：</p>
                          <p class="font-mono text-foreground break-all bg-muted/60 rounded-md px-2 py-1.5">{{
                            getPreview([...new Set(chain.artistNames.map(n => n.trim().toLowerCase()).filter(Boolean))],
                              formatters.anima)
                          }}</p>
                        </div>
                      </n-popover>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </template>
        </MasonryWall>
      </div>
    </n-scrollbar>

    <n-modal v-model:show="showEditModal" preset="card" :mask-closable="true" :closable="true"
      style="width: 920px; border-radius: 24px; overflow: hidden;" :segmented="{ content: true, footer: 'soft' }"
      class="artist-edit-modal">
      <template #header>
        <div class=" flex items-center gap-3 w-full pr-6">
          <div
            class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Palette class="w-5 h-5 text-primary" />
          </div>
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <h2 class="text-lg font-bold text-foreground truncate">
              {{ isCreating ? '新建配方' : editForm.name || '编辑配方' }}
            </h2>
            <span v-if="!isCreating"
              class="shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-pink-500/15 to-purple-500/15 text-pink-400 border border-pink-500/20 backdrop-blur-sm">
              手动创建
            </span>
          </div>
        </div>
      </template>

      <!-- 左右分栏布局 -->
      <div class="flex gap-5 -mx-2">
        <!-- 左侧图片上传区 -->
        <div
          class="image-upload-zone flex-shrink-0 w-[380px] h-[72vh] relative rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300 ease-out"
          :class="{ 'is-drag-over': isDragOver }" @click="triggerImageSelect" @dragover="handleDragOver"
          @dragleave="handleDragLeave" @drop="handleDrop">
          <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="handleFileChange" />

          <!-- 有图预览 -->
          <template v-if="hasImagePreview">
            <img :src="previewImageUrl" alt="Preview"
              class="w-full h-full object-contain bg-gradient-to-br from-muted/50 to-muted/30" />
            <!-- Hover 更换遮罩 -->
            <div
              class="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out flex flex-col items-center justify-end gap-3 pb-8 pointer-events-none">
              <div
                class="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <ImagePlus class="w-7 h-7 text-white" />
              </div>
              <p class="text-sm text-white font-medium tracking-wide">点击或拖拽更换图片</p>
              <p class="text-xs text-white/50">支持 JPG、PNG、GIF、WebP</p>
            </div>
          </template>

          <!-- 无图占位 -->
          <div v-else
            class="w-full h-full flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-muted/40 via-muted/20 to-muted/40 border border-dashed border-border/60 group-hover:border-[--secondary] transition-all duration-300">
            <div class="relative mb-5">
              <div
                class="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center group-hover:from-primary/25 group-hover:to-primary/10 transition-all duration-300 shadow-lg shadow-primary/5 group-hover:shadow-primary/20 group-hover:scale-105">
                <ImagePlus class="w-10 h-10 text-primary/70 group-hover:text-primary transition-colors duration-300" />
              </div>
              <div
                class="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full animate-pulse border-2 border-background">
              </div>
            </div>
            <p
              class="text-sm font-semibold text-foreground/90 mb-2 group-hover:text-primary transition-colors duration-300">
              点击或拖拽图片到此区域
            </p>
            <p class="text-xs text-muted-foreground text-center max-w-[200px] leading-relaxed">
              支持 JPG、PNG、GIF、WebP 格式<br />最大支持 20MB
            </p>
          </div>
        </div>

        <!-- 右侧：内容区（高度与左侧图片对齐） -->
        <div class="flex min-w-0 flex-1 h-[72vh] overflow-hidden">
          <n-scrollbar class="flex-1 pr-2">
            <div class="space-y-5 py-1">

              <!-- ========== 表单区（新建/编辑共用） ========== -->

              <!-- 配方名称 -->
              <div class="group-form rounded-xl p-4 border border-[--secondary]">
                <label class="flex items-center gap-2 text-sm font-semibold text-foreground mb-2.5">
                  <div class="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"></div>
                  配方名称
                  <span class="text-xs font-normal text-muted-foreground">(必填)</span>
                </label>
                <n-input v-model:value="editForm.name" type="text" placeholder="给这个配方起个名字..." clearable />
              </div>

              <!-- 画师配方（逗号分隔输入 + Tag 展示） -->
              <div class="group-form rounded-xl p-4 border border-[--secondary]">
                <label class="flex items-center gap-2 text-sm font-semibold text-foreground mb-2.5">
                  <div class="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-purple-400"></div>
                  画师配方
                  <span
                    class="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {{ editForm.artistNames.length }}
                  </span>
                </label>
                <!-- 输入框：Naive UI n-input，自动适配深色模式 -->
                <n-input v-model:value="artistInputText" type="text" placeholder="输入画师名，逗号分隔，回车确认..." class="mb-2.5"
                  clearable @keydown="handleArtistInputKeydown" />
                <!-- Tag 展示区：Naive UI n-tag 组件 -->
                <div v-if="editForm.artistNames.length > 0" class="flex flex-wrap gap-1.5">
                  <n-tag v-for="(name, idx) in editForm.artistNames" :key="idx" :type="getTagTypeForIndex(idx)"
                    :bordered="false" closable @close="removeTagItem('artist', idx)">
                    {{ name }}
                  </n-tag>
                </div>
                <p v-else class="text-xs text-muted-foreground/50 italic">暂无画师，请在上方输入</p>
              </div>

              <!-- 卡片标签（逗号分隔输入 + Tag 展示） -->
              <div class="group-form rounded-xl p-4 border border-[--secondary]">
                <label class="flex items-center gap-2 text-sm font-semibold text-foreground mb-2.5">
                  <div class="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"></div>
                  卡片标签
                  <span class="text-xs font-normal text-muted-foreground">(可选)</span>
                </label>
                <!-- 输入框：Naive UI n-input，自动适配深色模式 -->
                <n-input v-model:value="tagInputText" type="text" placeholder="输入标签，逗号分隔，回车确认..." clearable
                  class="mb-2.5" @keydown="handleTagInputKeydown" />
                <!-- Tag 展示区：Naive UI n-tag 组件 -->
                <div v-if="editForm.tags.length > 0" class="flex flex-wrap gap-1.5">
                  <n-tag v-for="(tag, idx) in editForm.tags" :key="idx"
                    :type="getTagTypeForIndex(editForm.artistNames.length + idx)" :bordered="false" closable
                    @close="removeTagItem('tag', idx)">
                    {{ tag }}
                  </n-tag>
                </div>
                <p v-else class="text-xs text-muted-foreground/50 italic">暂无标签，请在上方输入</p>
              </div>

              <!-- 画师 Tag 展示 + 复制按钮 -->
              <div v-if="!isCreating && editForm.id"
                class="bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-xl p-4 space-y-3 border border-[--secondary]">
                <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Copy class="w-4 h-4 text-primary" />
                  配方复制
                </div>
                <div class="flex items-center gap-2.5 flex-wrap">
                  <n-popover trigger="hover" placement="bottom" :show-arrow="false">
                    <template #trigger>
                      <button @click="copyNormalFormat"
                        class="btn-primary !py-2 !px-4 text-sm flex items-center gap-1 font-medium shadow-lg shadow-primary/20 hover:!bg-white hover:!text-primary hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200">
                        <Parentheses class="w-4 h-4" />
                        {{ normalCopyBtn.text }}
                      </button>
                    </template>
                    <div class="max-w-[280px] text-xs leading-relaxed">
                      <p class="text-muted-foreground mb-1">配方预览：</p>
                      <p class="font-mono text-foreground break-all bg-muted/60 rounded-md px-2 py-1.5">{{
                        normalCopyPreview
                      }}</p>
                    </div>
                  </n-popover>
                  <n-popover trigger="hover" placement="bottom" :show-arrow="false">
                    <template #trigger>
                      <button @click="copyAnimaFormat"
                        class="!py-2 !px-4 text-sm flex items-center gap-1 font-medium rounded-xl bg-pink-500 text-white hover:bg-white hover:text-pink-500 transition-all duration-200 hover:-translate-y-0.5">
                        <AtSign class="w-4 h-4" />
                        {{ animaCopyBtn.text }}
                      </button>
                    </template>
                    <div class="max-w-[280px] text-xs leading-relaxed">
                      <p class="text-muted-foreground mb-1">配方预览：</p>
                      <p class="font-mono text-foreground break-all bg-muted/60 rounded-md px-2 py-1.5">{{
                        animaCopyPreview
                      }}</p>
                    </div>
                  </n-popover>
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between w-full !px-2">
          <!-- 编辑模式左侧：删除按钮 -->
          <n-button v-if="!isCreating && editForm.id" type="error" ghost size="large" round
            @click="deleteChain(editForm.id!)" class="hover:!bg-red-500/10">
            <template #icon>
              <Trash2 class="w-4 h-4" />
            </template>
            删除配方
          </n-button>
          <div v-else class="w-16"></div>

          <!-- 右侧：取消 + 保存 -->
          <div class="flex items-center gap-3">
            <n-button size="large" round @click="closeEditModal" class="!px-6 font-medium hover:!bg-muted">
              取消
            </n-button>
            <n-button size="large" round type="primary" @click="saveChain"
              class="!px-8 font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 transition-all duration-200">
              {{ isCreating ? '新 建' : '保 存' }}
            </n-button>
          </div>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
/* ========== 弹窗全局样式 ========== */

/* 覆盖 Naive UI Modal 默认样式，打造精致玻璃拟态效果 */
:deep(.n-card) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%) !important;
  backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid rgba(226, 232, 240, 0.8) !important;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.15),
    0 12px 24px -8px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset !important;
}

/* 暗色模式适配 */
:global(.dark) :deep(.n-card) {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%) !important;
  border-color: rgba(51, 65, 85, 0.6) !important;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.4),
    0 12px 24px -8px rgba(0, 0, 0, 0.25),
    0 0 80px -20px rgba(99, 102, 241, 0.1) !important;
}

/* Header 样式 */
:deep(.n-card-header) {
  padding: 20px 24px 16px !important;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

:global(.dark) :deep(.n-card-header) {
  border-bottom-color: rgba(51, 65, 85, 0.4);
}

/* Content 区域 */
:deep(.n-card__content) {
  padding: 16px 24px !important;
}

/* Footer 样式 */
:deep(.n-card-footer) {
  padding: 16px 24px 20px !important;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  background: linear-gradient(to top, rgba(248, 250, 252, 0.8), transparent);
}

:global(.dark) :deep(.n-card-footer) {
  border-top-color: rgba(51, 65, 85, 0.4);
  background: linear-gradient(to top, rgba(15, 23, 42, 0.3), transparent);
}

/* 关闭按钮美化 */
:deep(.n-card-header__close) {
  width: 32px !important;
  height: 32px !important;
  border-radius: 10px !important;
  transition: all 0.2s ease;
}

:deep(.n-card-header__close:hover) {
  background: rgba(239, 68, 68, 0.1) !important;
  transform: rotate(90deg);
}

:deep(.n-card-header__close:hover .n-base-close-icon) {
  color: #ef4444 !important;
}

/* ========== 图片上传区样式 ========== */
.image-upload-zone {
  border: 2.5px dashed rgba(148, 163, 184, 0.35);
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(241, 245, 249, 0.3) 100%);
  position: relative;
  overflow: hidden;
}

.image-upload-zone::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, transparent 30%, rgba(99, 102, 241, 0.03) 70%);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-upload-zone:hover::before,
.image-upload-zone.is-drag-over::before {
  opacity: 1;
}

.image-upload-zone:hover {
  border-color: rgba(99, 102, 241, 0.45);
  background: linear-gradient(135deg, rgba(238, 242, 255, 0.7) 0%, rgba(224, 231, 255, 0.4) 100%);
  box-shadow: 0 8px 32px -8px rgba(99, 102, 241, 0.15);
}

.image-upload-zone.is-drag-over {
  border-color: #6366f1;
  background: linear-gradient(135deg, rgba(199, 210, 254, 0.5) 0%, rgba(165, 180, 252, 0.3) 100%);
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), 0 12px 40px -8px rgba(99, 102, 241, 0.25);
  transform: scale(1.005);
}

/* 暗色模式图片上传区 */
:global(.dark) .image-upload-zone {
  border-color: rgba(71, 85, 105, 0.4);
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%);
}

:global(.dark) .image-upload-zone:hover {
  border-color: rgba(129, 140, 248, 0.5);
  background: linear-gradient(135deg, rgba(49, 46, 129, 0.3) 0%, rgba(76, 29, 149, 0.2) 100%);
}

:global(.dark) .image-upload-zone.is-drag-over {
  border-color: #818cf8;
  background: linear-gradient(135deg, rgba(79, 70, 229, 0.25) 0%, rgba(109, 40, 217, 0.15) 100%);
}

/* ========== 卡片式输入框样式（参考 PromptDetailForm） ========== */

/* 输入框容器 - 基础状态 */
.input-group {
  position: relative;
}

.input-group::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(135deg, transparent 40%, rgba(99, 102, 241, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 0;
}

.input-group:hover::before,
.input-group:focus-within::before {
  opacity: 1;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(168, 85, 247, 0.03));
}

/* 输入框容器 hover 时添加微光阴影 */
.input-group:hover {
  box-shadow:
    0 4px 12px -4px rgba(99, 102, 241, 0.08),
    0 2px 4px -2px rgba(0, 0, 0, 0.04);
}

.input-group:focus-within {
  border-color: rgba(96, 165, 250, 0.6) !important;
  box-shadow:
    0 0 0 3px rgba(96, 165, 250, 0.1),
    0 8px 24px -4px rgba(99, 102, 241, 0.15);
}

/* 图标动画 */
.input-group:hover .w-4 {
  transform: scale(1.05);
  color: #6366f1;
}

.input-group .w-4 {
  transition: all 0.25s ease;
}

/* 暗色模式适配 */
:global(.dark) .input-group {
  background-color: rgba(30, 41, 59, 0.5);
}

:global(.dark) .input-group:hover {
  box-shadow:
    0 4px 12px -4px rgba(129, 140, 248, 0.12),
    0 2px 4px -2px rgba(0, 0, 0, 0.2);
}

:global(.dark) .input-group:focus-within {
  border-color: rgba(129, 140, 248, 0.5) !important;
  box-shadow:
    0 0 0 3px rgba(129, 140, 248, 0.1),
    0 8px 24px -4px rgba(129, 140, 248, 0.12);
}

/* ========== 动画效果 ========== */

/* 弹窗入场动画 */
.artist-edit-modal :deep(.n-card) {
  animation: modalSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(16px);
  }

  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* 表单区域交错淡入 */
.group-form {
  animation: fadeInUp 0.4s ease-out backwards;
}

.group-form:nth-of-type(1) {
  animation-delay: 0.05s;
}

.group-form:nth-of-type(2) {
  animation-delay: 0.1s;
}

.group-form:nth-of-type(3) {
  animation-delay: 0.15s;
}

.modal-input-wrapper:nth-child(3) {
  animation-delay: 0.15s;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
