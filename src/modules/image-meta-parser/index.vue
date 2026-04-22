<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Upload, X, Copy, FilePlus, Trash2 } from 'lucide-vue-next'
import { useImageStore } from '../../stores/image'
import { usePromptStore } from '../../stores/prompt'
import { usePNGMetadata } from '../../services/pngMetadata'
import { useThumbnail } from '../../composables/useThumbnail'
import type { ParsedImageMetadata } from '../../types'

const imageStore = useImageStore()
const promptStore = usePromptStore()
const { parseImage } = usePNGMetadata()
const { generateThumbnail } = useThumbnail()

const isDragging = ref(false)
const isProcessing = ref(false)

// 存储生成的 URL 以便释放
const urlCache = new Map<string, string>()

function getImageUrl(blob: Blob): string {
  const key = blob.size + '-' + blob.type
  if (!urlCache.has(key)) {
    const url = URL.createObjectURL(blob)
    urlCache.set(key, url)
    return url
  }
  return urlCache.get(key)!
}

function revokeImageUrl(blob: Blob) {
  const key = blob.size + '-' + blob.type
  const url = urlCache.get(key)
  if (url) {
    URL.revokeObjectURL(url)
    urlCache.delete(key)
  }
}

onUnmounted(() => {
  urlCache.forEach(url => URL.revokeObjectURL(url))
  urlCache.clear()
})

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  
  const files = Array.from(e.dataTransfer?.files || [])
    .filter(file => file.type.startsWith('image/'))
  
  await processFiles(files)
}

async function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  await processFiles(files)
  input.value = ''
}

async function processFiles(files: File[]) {
  isProcessing.value = true
  
  for (const file of files) {
    try {
      const metadata = await parseImage(file)
      if (metadata) {
        const thumbnail = await generateThumbnail(file, 300)
        await imageStore.addParsedImage(
          file.name,
          file,
          thumbnail,
          metadata
        )
      }
    } catch (error) {
      console.error('Failed to process image:', file.name, error)
    }
  }
  
  isProcessing.value = false
}

async function importToPrompts(image: { 
  id: string
  fileName: string
  metadata: ParsedImageMetadata 
}) {
  const name = image.fileName.replace(/\.[^/.]+$/, '')
  await promptStore.importFromMetadata(
    name,
    image.metadata.positive,
    image.metadata.negative
  )
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
}

function formatMetadata(metadata: ParsedImageMetadata): string {
  const parts: string[] = []
  if (metadata.model) parts.push(`Model: ${metadata.model}`)
  if (metadata.sampler) parts.push(`Sampler: ${metadata.sampler}`)
  if (metadata.steps) parts.push(`Steps: ${metadata.steps}`)
  if (metadata.cfg) parts.push(`CFG: ${metadata.cfg}`)
  if (metadata.seed) parts.push(`Seed: ${metadata.seed}`)
  if (metadata.width && metadata.height) {
    parts.push(`Size: ${metadata.width}x${metadata.height}`)
  }
  return parts.join(' | ')
}
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-hidden">
    <!-- Header -->
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-foreground mb-2">图片 Meta 解析</h1>
      <p class="text-foreground-secondary text-sm">
        拖拽或选择 PNG 图片，自动提取 ComfyUI / Stable Diffusion 生成参数
      </p>
    </header>

    <!-- Drop Zone -->
    <div
      class="mb-6"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <label
        :class="[
          'flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300',
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-white/20 bg-background-secondary hover:border-primary/50 hover:bg-background-tertiary'
        ]"
      >
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload 
            :class="['w-10 h-10 mb-3 transition-colors', isDragging ? 'text-primary' : 'text-foreground-tertiary']" 
          />
          <p class="mb-2 text-sm text-foreground-secondary">
            <span class="font-semibold">点击上传</span> 或拖拽图片到此处
          </p>
          <p class="text-xs text-foreground-tertiary">支持 PNG 格式（ComfyUI / SD WebUI）</p>
        </div>
        <input 
          type="file" 
          class="hidden" 
          accept="image/png" 
          multiple
          @change="handleFileSelect"
        />
      </label>
    </div>

    <!-- Processing Indicator -->
    <div v-if="isProcessing" class="flex items-center justify-center py-4">
      <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
      <span class="text-foreground-secondary">正在解析图片...</span>
    </div>

    <!-- Results List -->
    <div class="flex-1 overflow-y-auto scrollbar-thin -mx-2 px-2">
      <div v-if="imageStore.parsedImages.length === 0" class="text-center py-12 text-foreground-tertiary">
        <FilePlus class="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>暂无解析记录</p>
        <p class="text-sm mt-1">上传图片开始解析</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="image in imageStore.parsedImages"
          :key="image.id"
          class="glass-panel p-4 animate-fade-in"
        >
          <div class="flex gap-4">
            <!-- Thumbnail -->
            <div class="shrink-0">
              <img
                :src="getImageUrl(image.thumbnailBlob)"
                class="w-24 h-24 object-cover rounded-lg bg-background-tertiary"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-medium text-foreground truncate">{{ image.fileName }}</h3>
                <div class="flex gap-1">
                  <button
                    @click="importToPrompts(image)"
                    class="p-1.5 text-foreground-tertiary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="导入到提示词管理"
                  >
                    <FilePlus class="w-4 h-4" />
                  </button>
                  <button
                    @click="imageStore.deleteParsedImage(image.id)"
                    class="p-1.5 text-foreground-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Positive Prompt -->
              <div class="mb-2">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium text-success">正向提示词</span>
                  <button
                    @click="copyToClipboard(image.metadata.positive)"
                    class="text-foreground-tertiary hover:text-foreground transition-colors"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
                <p class="text-sm text-foreground-secondary line-clamp-2 bg-background-tertiary/50 rounded px-2 py-1">
                  {{ image.metadata.positive || '无' }}
                </p>
              </div>

              <!-- Negative Prompt -->
              <div v-if="image.metadata.negative" class="mb-2">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium text-error">负向提示词</span>
                  <button
                    @click="copyToClipboard(image.metadata.negative)"
                    class="text-foreground-tertiary hover:text-foreground transition-colors"
                  >
                    <Copy class="w-3 h-3" />
                  </button>
                </div>
                <p class="text-sm text-foreground-secondary line-clamp-2 bg-background-tertiary/50 rounded px-2 py-1">
                  {{ image.metadata.negative }}
                </p>
              </div>

              <!-- Parameters -->
              <div v-if="formatMetadata(image.metadata)" class="text-xs text-foreground-tertiary">
                {{ formatMetadata(image.metadata) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear All Button -->
    <div v-if="imageStore.parsedImages.length > 0" class="mt-4 pt-4 border-t border-white/10 flex justify-end">
      <button
        @click="imageStore.clearAll"
        class="btn-secondary text-sm flex items-center gap-2"
      >
        <Trash2 class="w-4 h-4" />
        清空全部
      </button>
    </div>
  </div>
</template>
