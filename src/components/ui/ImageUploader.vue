<!--
  @author Chisaki (ID: 68142319)
  @since 2026-04-27 14:50:00
  通用图片上传组件 - 基于 Naive UI n-upload + n-upload-dragger
  拖拽和点击上传由 n-upload 内置处理，粘贴上传需手动监听
-->
<script setup lang="ts">
import type { UploadCustomRequestOptions } from 'naive-ui'
import { Image as ImageIcon, Loader2 } from 'lucide-vue-next'

/** 组件 Props 定义 */
interface Props {
    /** 是否处于加载状态（如正在解析图片） */
    isLoading?: boolean
    /** 接受的文件类型，默认 image/* */
    accept?: string
    /** 最大文件数量，默认 1 */
    max?: number
    /** 主标题文字 */
    title?: string
    /** 描述文字 */
    description?: string
}

/** 组件 Emits 定义 */
interface Emits {
    (e: 'upload', file: File): void
}

const props = withDefaults(defineProps<Props>(), {
    isLoading: false,
    accept: 'image/*',
    max: 1,
    title: '点击上传、拖拽或粘贴图片',
    description: '支持 PNG、JPEG、WebP 等格式，可拖拽或按 Ctrl+V 粘贴图片',
})

const emit = defineEmits<Emits>()

/**
 * 自定义上传请求 - 拦截 n-upload 的上传流程
 * 不执行真正的网络请求，直接从 file 对象中获取原生 File 并 emit
 */
const handleCustomRequest = (options: UploadCustomRequestOptions) => {
    const { file, onFinish } = options
    const rawFile = file.file

    if (rawFile && rawFile.type.startsWith('image/')) {
        emit('upload', rawFile)
    }

    // 标记完成，避免 n-upload 内部状态异常
    onFinish()
}

/**
 * 全局粘贴事件处理
 * n-upload 不内置粘贴功能，需手动监听 window paste 事件
 */
const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) return

    for (const item of items) {
        if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file) {
                emit('upload', file)
                break
            }
        }
    }
}

onMounted(() => {
    window.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
    window.removeEventListener('paste', handlePaste)
})
</script>

<template>
    <div class="relative h-full flex flex-col items-center justify-center p-8">
        <!-- 上传区域 - 拖拽和点击由 n-upload 内置处理 -->
        <div class="w-full max-w-xl">
            <n-upload :custom-request="handleCustomRequest" :accept="props.accept" :max="props.max"
                :show-file-list="false" directory-dnd>
                <n-upload-dragger class="transition-all duration-300 rounded-2xl" :style="{
                    padding: '3rem',
                }">
                    <!-- 加载状态 -->
                    <div v-if="props.isLoading" class="flex flex-col items-center">
                        <Loader2 class="w-16 h-16 text-primary animate-spin mb-4" />
                        <p class="text-lg font-medium text-foreground">正在解析图片...</p>
                    </div>

                    <!-- 正常状态 -->
                    <div v-else class="flex flex-col items-center">
                        <!-- 图标区 -->
                        <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                            style="background-color: var(--primary-light)">
                            <ImageIcon class="w-10 h-10 text-primary opacity-70" />
                        </div>

                        <!-- 标题 -->
                        <h3 class="text-xl font-semibold text-foreground mb-2">
                            {{ props.title }}
                        </h3>

                        <!-- 描述 -->
                        <p class="text-sm text-muted-foreground mb-4">
                            {{ props.description }}
                        </p>

                        <!-- 标签区 - 通过 slot 可覆盖 -->
                        <slot name="tags">
                            <div class="flex items-center gap-2 text-xs text-muted-foreground">
                                <span class="px-2 py-1 bg-muted rounded">ComfyUI</span>
                                <span class="px-2 py-1 bg-muted rounded">WebUI</span>
                                <span class="px-2 py-1 bg-muted rounded">NovelAI</span>
                            </div>
                        </slot>
                    </div>
                </n-upload-dragger>
            </n-upload>
        </div>

        <!-- 底部提示 -->
        <slot name="footer">
            <p class="mt-6 text-xs text-muted-foreground text-center">
                支持解析 ComfyUI、WebUI、NovelAI 等生成的图片元数据
            </p>
        </slot>
    </div>
</template>
