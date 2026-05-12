<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSpellStore } from '../../stores/spell';
import { usePromptStore } from '../../stores/prompt';
import { CheckCircle2, FolderPlus } from 'lucide-vue-next';
import { useDialog, useMessage } from 'naive-ui';
import ImageUploader from '@/components/ui/ImageUploader.vue';
import ParseResult from './components/ParseResult.vue';
import HistoryList from './components/HistoryList.vue';
import DataIOButtons from '../../components/ui/DataIOButtons.vue';
import { useImageArchive } from '../../composables/useImageArchive';
import type { ImageSource } from '../../composables/useImageArchive';

const spellStore = useSpellStore();
const promptStore = usePromptStore();
const dialog = useDialog();
const message = useMessage();

// 原图归档功能
const { isSupported: isArchiveSupported, isConfigured: isArchiveConfigured, selectDirectory, saveImage } = useImageArchive();

// Toast 提示状态
const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
});
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, type: 'success' | 'error' = 'success') {
  // 清除之前的定时器
  if (toastTimer) clearTimeout(toastTimer);

  toast.value = { show: true, message, type };

  // 3秒后自动关闭
  toastTimer = setTimeout(() => {
    toast.value.show = false;
  }, 3000);
}

// 加载历史记录
onMounted(() => {
  spellStore.loadHistory();
});

// 处理文件上传 — 接收 source 参数区分图片来源
async function handleFileUpload(file: File, source: ImageSource) {
  // 剪贴板来源的图片自动归档原图
  if (source === 'clipboard') {
    // 未配置归档目录时引导用户选择
    if (isArchiveSupported.value && !isArchiveConfigured.value) {
      dialog.info({
        title: '设置原图归档目录',
        content: '检测到您粘贴了图片，可以将原图自动保存到本地目录中。是否现在选择归档目录？',
        positiveText: '选择目录',
        negativeText: '暂不设置',
        onPositiveClick: async () => {
          const success = await selectDirectory();
          if (success) {
            message.success('归档目录已设置，后续粘贴的图片将自动保存原图');
            // 设置成功后归档当前图片
            saveImage(file, 'spell-parser', 'clipboard');
          }
        },
      });
    } else if (isArchiveConfigured.value) {
      // 已配置则直接归档
      saveImage(file, 'spell-parser', 'clipboard');
    }
  }

  // 执行正常的解析流程
  await spellStore.parseAndSave(file);
}

// 从历史记录选择
async function handleSelectFromHistory(image: import('../../types').ParsedImageData) {
  await spellStore.loadFromHistory(image.id);
}

// 删除历史记录
function handleDeleteHistory(id: string) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这条解析记录吗？此操作不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await spellStore.deleteFromHistory(id);
      message.success('解析记录已删除');
    },
  });
}

// 导入到提示词管理
async function handleImportToPrompts() {
  if (!spellStore.currentImage) return;

  const image = spellStore.currentImage;
  const name = image.fileName.replace(/\.[^/.]+$/, '') || '解析的提示词';

  // 详细日志：检查所有要导入的数据
  console.log('[SpellParser] ========== 开始导入到提示词管理 ==========');
  console.log('[SpellParser] 图片基本信息:', {
    image,
  });
  // console.log('[SpellParser] 提示词数据:', {
  //   positivePrompt: image.positivePrompt?.substring(0, 100) || '(空)',
  //   positivePromptLength: image.positivePrompt?.length || 0,
  //   negativePrompt: image.negativePrompt?.substring(0, 100) || '(空)',
  //   negativePromptLength: image.negativePrompt?.length || 0,
  // });
  // console.log('[SpellParser] 参数数据:', {
  //   hasParameters: !!image.parameters,
  //   parameters: image.parameters ? JSON.stringify(image.parameters, null, 2) : '(undefined)',
  // });
  // console.log('[SpellParser] 图片数据:', {
  //   hasThumbnailData: !!image.thumbnailData,
  //   hasPreviewData: !!image.previewData,
  //   thumbnailDataLength: image.thumbnailData?.length,
  //   previewDataLength: image.previewData?.length,
  // });
  console.log('[SpellParser] ========== 调用 importFromMetadata ==========');

  // 传递图片数据到提示词管理
  const newPrompt = await promptStore.importFromMetadata(
    name,
    image.positivePrompt,
    image.negativePrompt,
    image.thumbnailData,
    image.previewData,
    image.parameters
  );

  console.log('[SpellParser] ========== 导入完成 ==========');
  console.log('[SpellParser] 已导入的提示词:', {
    id: newPrompt.id,
    name: newPrompt.name,
    positive: newPrompt.positive?.substring(0, 100) || '(空)',
    positiveLength: newPrompt.positive?.length || 0,
    negative: newPrompt.negative?.substring(0, 100) || '(空)',
    negativeLength: newPrompt.negative?.length || 0,
    hasParameters: !!newPrompt.parameters,
    parameters: newPrompt.parameters ? JSON.stringify(newPrompt.parameters, null, 2) : '(undefined)',
    hasThumbnail: !!newPrompt.thumbnailData,
    hasPreview: !!newPrompt.previewData,
  });

  // 显示成功提示
  showToast('已导入到提示词管理');
}

// 复制提示词
function handleCopy(text: string, type: 'positive' | 'negative' | 'full') {
  // 复制操作已在组件内完成，这里可以添加额外的反馈
  console.log(`已复制 ${type}:`, text.substring(0, 50) + '...');
}

// 关闭解析结果
function handleCloseResult() {
  spellStore.clearCurrentImage();
}
</script>

<template>
  <div class="h-full flex">
    <!-- 左侧历史记录 -->
    <div class="w-60 bg-card border-r border-border flex flex-col shrink-0">
      <!-- 左侧顶栏：标题 + 导入导出 -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-border">
        <span class="text-sm font-semibold text-foreground">历史记录</span>
        <DataIOButtons module="spell" />
      </div>
      <HistoryList :images="spellStore.sortedImages" :current-id="spellStore.currentImage?.id"
        @select="handleSelectFromHistory" @delete="handleDeleteHistory" />
    </div>

    <!-- 右侧主区域 -->
    <div class="flex-1 overflow-hidden">
      <!-- 上传区域 -->
      <ImageUploader v-if="!spellStore.hasCurrentImage" :is-loading="spellStore.isLoading" @upload="handleFileUpload" />

      <!-- 解析结果 -->
      <ParseResult v-else-if="spellStore.currentImage" :image="spellStore.currentImage" @copy="handleCopy"
        @import="handleImportToPrompts" @close="handleCloseResult" />
    </div>

    <!-- 错误提示 -->
    <div v-if="spellStore.error"
      class="fixed bottom-6 right-6 z-50 bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
      <span class="text-sm">{{ spellStore.error }}</span>
      <button @click="spellStore.clearError"
        class="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full">
        ×
      </button>
    </div>

    <!-- 成功提示 Toast -->
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-2 opacity-0">
      <div v-if="toast.show"
        class="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border" :class="[
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        ]">
        <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5 text-green-500" />
        <span class="text-sm font-medium">{{ toast.message }}</span>
      </div>
    </Transition>
  </div>
</template>
