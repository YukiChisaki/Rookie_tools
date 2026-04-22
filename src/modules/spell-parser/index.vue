<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSpellStore } from '../../stores/spell';
import { usePromptStore } from '../../stores/prompt';
import { CheckCircle2 } from 'lucide-vue-next';
import ImageUploader from './components/ImageUploader.vue';
import ParseResult from './components/ParseResult.vue';
import HistoryList from './components/HistoryList.vue';

const spellStore = useSpellStore();
const promptStore = usePromptStore();

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

// 处理文件上传
async function handleFileUpload(file: File) {
  await spellStore.parseAndSave(file);
}

// 从历史记录选择
async function handleSelectFromHistory(image: import('../../types').ParsedImageData) {
  await spellStore.loadFromHistory(image.id);
}

// 删除历史记录
async function handleDeleteHistory(id: string) {
  await spellStore.deleteFromHistory(id);
}

// 导入到提示词管理
async function handleImportToPrompts() {
  if (!spellStore.currentImage) return;

  const image = spellStore.currentImage;
  const name = image.fileName.replace(/\.[^/.]+$/, '') || '解析的提示词';

  await promptStore.importFromMetadata(
    name,
    image.positivePrompt,
    image.negativePrompt
  );

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
      <HistoryList
        :images="spellStore.sortedImages"
        :current-id="spellStore.currentImage?.id"
        @select="handleSelectFromHistory"
        @delete="handleDeleteHistory"
      />
    </div>

    <!-- 右侧主区域 -->
    <div class="flex-1 overflow-hidden">
      <!-- 上传区域 -->
      <ImageUploader
        v-if="!spellStore.hasCurrentImage"
        :is-loading="spellStore.isLoading"
        @upload="handleFileUpload"
      />

      <!-- 解析结果 -->
      <ParseResult
        v-else-if="spellStore.currentImage"
        :image="spellStore.currentImage"
        @copy="handleCopy"
        @import="handleImportToPrompts"
        @close="handleCloseResult"
      />
    </div>

    <!-- 错误提示 -->
    <div
      v-if="spellStore.error"
      class="fixed bottom-6 right-6 z-50 bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3"
    >
      <span class="text-sm">{{ spellStore.error }}</span>
      <button
        @click="spellStore.clearError"
        class="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-full"
      >
        ×
      </button>
    </div>

    <!-- 成功提示 Toast -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="toast.show"
        class="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border"
        :class="[
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        ]"
      >
        <CheckCircle2
          v-if="toast.type === 'success'"
          class="w-5 h-5 text-green-500"
        />
        <span class="text-sm font-medium">{{ toast.message }}</span>
      </div>
    </Transition>
  </div>
</template>
