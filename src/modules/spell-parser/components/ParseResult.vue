<script setup lang="ts">
import {
  FileDown,
  X,
  Cpu,
} from 'lucide-vue-next';
import type { ParsedImageData } from '../../../types';
import { formatGeneratorName } from '../../../services/spellParser';
import MetadataViewer from './MetadataViewer.vue';
import PromptDetailViewer from '../../../components/PromptDetailViewer.vue';

interface Props {
  image: ParsedImageData;
}

interface Emits {
  (e: 'copy', text: string, type: 'positive' | 'negative' | 'full'): void;
  (e: 'import'): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

function handleCopy(text: string, type: 'positive' | 'negative' | 'full') {
  emit('copy', text, type);
}

function handleImport() {
  emit('import');
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 头部 -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-border">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center"
          style="background: linear-gradient(135deg, #3498db 0%, #5dade2 100%);">
          <Cpu class="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-foreground">解析结果</h2>
          <p class="text-xs text-muted-foreground">
            {{ formatGeneratorName(image.generator) }}
            ·
            {{ image.fileName }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button @click="handleImport" class="btn-primary text-sm flex items-center gap-2">
          <FileDown class="w-4 h-4" />
          导入提示词管理
        </button>
        <button @click="handleClose"
          class="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- 内容区 - 复用 PromptDetailViewer -->
    <div class="flex-1 overflow-y-auto">
      <PromptDetailViewer :name="image.fileName" :positive="image.positivePrompt" :negative="image.negativePrompt"
        :parameters="image.parameters" :preview-data="image.previewData" :show-image="true" :show-actions="true"
        @copy="handleCopy" />

      <!-- 完整元数据 -->
      <MetadataViewer :metadata="image.rawMetadata" />

    </div>
  </div>
</template>
