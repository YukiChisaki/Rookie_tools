<script setup lang="ts">
/**
 * 通用数据导入导出按钮组件
 * 提供统一的导入/导出按钮外观和交互，内嵌 useDataIO composable
 *
 * @author Chisaki
 * @since 2026-05-12 16:37:00
 */
import { ref } from 'vue'
import { Download, Upload } from 'lucide-vue-next'
import { useDataIO } from '../../composables/useDataIO'
import type { DataIOModuleType } from '../../types/data-io'
import type { PromptRecord } from '../../types'
import { usePromptStore } from '../../stores/prompt'
import type { ArtistChain } from '../../types'
import { useArtistStore } from '../../stores/artist'
import type { ParsedImageData } from '../../types'
import { useSpellStore } from '../../stores/spell'

const props = defineProps<{
    /** 当前模块标识 */
    module: DataIOModuleType
}>()

// 隐藏的文件输入引用
const fileInputRef = ref<HTMLInputElement | null>(null)

/**
 * 根据模块类型创建 useDataIO 实例
 * 使用工厂模式避免在模板中重复判断模块类型
 */
const createDataIO = () => {
    if (props.module === 'prompts') {
        const store = usePromptStore()
        return useDataIO<PromptRecord>({
            moduleName: 'prompts',
            getAllData: () => store.prompts,
            bulkImport: (items) => store.bulkImportPrompts(items),
            getExistingIds: () => new Set(store.prompts.map((p) => p.id)),
        })
    }

    if (props.module === 'artists') {
        const store = useArtistStore()
        return useDataIO<ArtistChain>({
            moduleName: 'artists',
            getAllData: () => store.artistChains,
            bulkImport: (items) => store.bulkImportChains(items),
            getExistingIds: () => new Set(store.artistChains.map((c) => c.id)),
        })
    }

    if (props.module === 'spell') {
        const store = useSpellStore()
        return useDataIO<ParsedImageData>({
            moduleName: 'spell',
            getAllData: () => store.parsedImages,
            bulkImport: (items) => store.bulkImportImages(items),
            getExistingIds: () => new Set(store.parsedImages.map((i) => i.id)),
        })
    }

    throw new Error(`不支持的模块类型: ${props.module}`)
}

const { isExporting, isImporting, exportData, confirmAndImport } = createDataIO()

/** 触发文件选择器 */
const triggerFileInput = () => {
    fileInputRef.value?.click()
}

/** 处理文件选择变更 */
const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0] ?? null
    if (file) {
        confirmAndImport(file)
    }
    // 重置 input 以便重复选择同一文件
    target.value = ''
}
</script>

<template>
    <div class="flex items-center gap-2">
        <!-- 隐藏的文件输入 -->
        <input ref="fileInputRef" type="file" accept=".json" class="hidden" @change="handleFileChange" />

        <!-- 导入按钮 -->
        <n-button size="small" :loading="isImporting" type="tertiary" :disabled="isImporting || isExporting"
            @click="triggerFileInput">
            <template #icon>
                <Upload class="w-4 h-4" />
            </template>
            导入
        </n-button>

        <!-- 导出按钮 -->
        <n-button size="small" type="tertiary" :loading="isExporting" :disabled="isImporting || isExporting"
            @click="exportData">
            <template #icon>
                <Download class="w-4 h-4" />
            </template>
            导出
        </n-button>
    </div>
</template>
