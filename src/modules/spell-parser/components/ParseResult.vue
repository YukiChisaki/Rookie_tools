<script setup lang="ts">
import { ref } from 'vue';
import {
  Copy,
  Check,
  FileDown,
  X,
  Cpu,
  Ruler,
  Box,
  Sliders,
  Sparkles,
  AlertCircle
} from 'lucide-vue-next';
import type { ParsedImageData } from '@/types';
import { formatGeneratorName, formatParameter } from '@/services/spellParser';
import MetadataViewer from './MetadataViewer.vue';

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

const copiedPositive = ref(false);
const copiedNegative = ref(false);

async function copyPositive() {
  await navigator.clipboard.writeText(props.image.positivePrompt);
  copiedPositive.value = true;
  emit('copy', props.image.positivePrompt, 'positive');
  setTimeout(() => (copiedPositive.value = false), 1500);
}

async function copyNegative() {
  await navigator.clipboard.writeText(props.image.negativePrompt);
  copiedNegative.value = true;
  emit('copy', props.image.negativePrompt, 'negative');
  setTimeout(() => (copiedNegative.value = false), 1500);
}

async function copyFull() {
  const full = `正向提示词: ${props.image.positivePrompt}\n\n负向提示词: ${props.image.negativePrompt}`;
  await navigator.clipboard.writeText(full);
  emit('copy', full, 'full');
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

    <!-- 内容区 -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="w-full  space-y-6">
        <!-- 图片和信息 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[90vh]" style="height: 800px;">
          <!-- 图片预览 -->
          <div class="h-full bg-card border border-border rounded-xl w-full h-full max-h-full flex flex-col min-h-0">
            <div class="rounded-lg overflow-hidden flex-1 flex items-center justify-center min-h-0">
              <img
                v-if="image.previewData"
                :src="image.previewData"
                :alt="image.fileName"
                class="max-w-full max-h-full object-contain"
              />
              <img
                v-else-if="image.previewUrl"
                :src="image.previewUrl"
                :alt="image.fileName"
                class="max-w-full max-h-full object-contain"
              />
              <div v-else class="text-muted-foreground">
                无法加载图片
              </div>
            </div>
          </div>

          <!-- 参数信息和提示词 -->
          <div class="space-y-4 h-full max-h-full ">
            <!-- 生成参数 -->
            <div class="p-4 rounded-xl border bg-card/50" style="border-color: rgba(52,152,219,0.15);">
              <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full"
                  style="background: linear-gradient(135deg, #3498db 0%, #f368e0 100%);"></span>
                核心参数
              </h3>

              <!-- 模型 - 单独一行 -->
              <div v-if="image.parameters.model"
                class="flex items-center justify-between p-3 mb-2 bg-card rounded-lg border border-border/50">
                <div class="flex items-center gap-3">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Box class="w-3.5 h-3.5" />
                    模型
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('model', image.parameters.model) }}
                  </span>
                </div>
                <a :href="`https://civitai.com/search/models?query=${encodeURIComponent(image.parameters.model?.split('.')[0] || '')}`"
                  target="_blank" class="text-xs text-blue-500 hover:text-blue-400 transition-colors">
                  查找模型
                </a>
              </div>

              <!-- 其他参数网格 -->
              <div class="grid grid-cols-3 gap-2">
                <!-- 采样器 -->
                <div v-if="image.parameters.sampler"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sliders class="w-3.5 h-3.5" />
                    采样器
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('sampler', image.parameters.sampler) }}
                  </span>
                </div>

                <!-- 调度器 -->
                <div v-if="image.parameters.schedule"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sliders class="w-3.5 h-3.5" />
                    调度器
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('scheduler', image.parameters.schedule) }}
                  </span>
                </div>

                <!-- 步数 -->
                <div v-if="image.parameters.steps"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles class="w-3.5 h-3.5" />
                    步数
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('steps', image.parameters.steps) }}
                  </span>
                </div>
                <!-- CFG -->
                <div v-if="image.parameters.cfg"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sliders class="w-3.5 h-3.5" />
                    CFG Scale
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('cfg', image.parameters.cfg) }}
                  </span>
                </div>
                <!-- 种子 -->
                <div v-if="image.parameters.seed"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle class="w-3.5 h-3.5" />
                    种子
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('seed', image.parameters.seed) }}
                  </span>
                </div>
                <!-- 尺寸 - 宽高合并 -->
                <div v-if="image.parameters.width && image.parameters.height"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Ruler class="w-3.5 h-3.5" />
                    尺寸
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ image.parameters.width }}×{{ image.parameters.height }}
                  </span>
                </div>
              </div>

              <div v-if="Object.keys(image.parameters).length === 0"
                class="text-center py-4 text-sm text-muted-foreground">
                未检测到生成参数
              </div>
            </div>

            <!-- 正向提示词 -->
            <div v-if="image.positivePrompt" class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  正向提示词
                </label>
                <button @click="copyPositive"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors">
                  <Check v-if="copiedPositive" class="w-3.5 h-3.5" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  {{ copiedPositive ? '已复制' : '复制' }}
                </button>
              </div>
              <div class="p-4 bg-green-500/5 border border-green-500/20 rounded-xl  overflow-y-auto">
                <p class="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                  {{ image.positivePrompt }}
                </p>
              </div>
            </div>

            <!-- 负向提示词 -->
            <div v-if="image.negativePrompt" class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  负向提示词
                </label>
                <button @click="copyNegative"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Check v-if="copiedNegative" class="w-3.5 h-3.5" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  {{ copiedNegative ? '已复制' : '复制' }}
                </button>
              </div>
              <div class="p-2 bg-red-500/5 border border-red-500/20 rounded-xl max-h-[150px] overflow-y-auto">
                <p class="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                  {{ image.negativePrompt }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- 完整元数据 -->
        <MetadataViewer :metadata="image.rawMetadata" />
      </div>
    </div>
  </div>
</template>
