<script setup lang="ts">
import { ref } from 'vue';
import {
  Copy,
  Check,
  Box,
  Sliders,
  Sparkles,
  AlertCircle,
  Ruler,
  Trash2,
} from 'lucide-vue-next';
import type { ImageParameters } from '@/types';
import { formatParameter } from '@/services/spellParser';

interface Props {
  name: string;
  positive: string;
  negative: string;
  parameters?: ImageParameters;
  previewData?: string;
  showImage?: boolean;
  showActions?: boolean;
  showDelete?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  parameters: () => ({}),
  showImage: true,
  showActions: true,
  showDelete: false,
});

const emit = defineEmits<{
  (e: 'copy', text: string, type: 'positive' | 'negative' | 'full'): void;
  (e: 'delete'): void;
}>();

const copiedPositive = ref(false);
const copiedNegative = ref(false);

async function copyPositive() {
  await navigator.clipboard.writeText(props.positive);
  copiedPositive.value = true;
  emit('copy', props.positive, 'positive');
  setTimeout(() => (copiedPositive.value = false), 1500);
}

async function copyNegative() {
  await navigator.clipboard.writeText(props.negative);
  copiedNegative.value = true;
  emit('copy', props.negative, 'negative');
  setTimeout(() => (copiedNegative.value = false), 1500);
}

async function copyFull() {
  const full = `正向提示词: ${props.positive}\n\n负向提示词: ${props.negative}`;
  await navigator.clipboard.writeText(full);
  emit('copy', full, 'full');
}
</script>

<template>
  <div class="h-full min-h-[800px] flex flex-col">
    <!-- 内容区 -->
    <div class="flex-1 p-6">
      <div class="w-full space-y-6">
        <!-- 图片和信息 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 图片预览 -->
          <div v-if="showImage && previewData"
            class="h-full bg-card border border-border rounded-xl w-full flex flex-col min-h-0 max-h-[700px]">
            <div class="rounded-lg overflow-hidden flex-1 flex items-center justify-center min-h-0 p-4">
              <img :src="previewData" :alt="name" class="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          </div>

          <!-- 参数信息和提示词 -->
          <div class="space-y-4" :class="showImage && previewData ? '' : 'lg:col-span-2'">
            <!-- 生成参数 -->
            <div v-if="Object.keys(parameters).length > 0" class="p-4 rounded-xl border bg-card/50"
              style="border-color: rgba(52, 152, 219, 0.15)">
              <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full"
                  style="background: linear-gradient(135deg, #3498db 0%, #f368e0 100%)"></span>
                核心参数
              </h3>

              <!-- 模型 - 单独一行 -->
              <div v-if="parameters.model"
                class="flex items-center justify-between p-3 mb-2 bg-card rounded-lg border border-border/50">
                <div class="flex items-center gap-3">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Box class="w-3.5 h-3.5" />
                    模型
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('model', parameters.model) }}
                  </span>
                </div>
                <a :href="`https://civitai.com/search/models?query=${encodeURIComponent(parameters.model?.split('.')[0] || '')}`"
                  target="_blank" class="text-xs text-blue-500 hover:text-blue-400 transition-colors">
                  查找模型
                </a>
              </div>

              <!-- 其他参数网格 -->
              <div class="grid grid-cols-3 gap-2">
                <!-- 采样器 -->
                <div v-if="parameters.sampler"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sliders class="w-3.5 h-3.5" />
                    采样器
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('sampler', parameters.sampler) }}
                  </span>
                </div>

                <!-- 调度器 -->
                <div v-if="parameters.schedule || parameters.scheduler"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sliders class="w-3.5 h-3.5" />
                    调度器
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('scheduler', parameters.schedule || parameters.scheduler) }}
                  </span>
                </div>

                <!-- 步数 -->
                <div v-if="parameters.steps"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles class="w-3.5 h-3.5" />
                    步数
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('steps', parameters.steps) }}
                  </span>
                </div>

                <!-- CFG -->
                <div v-if="parameters.cfg"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sliders class="w-3.5 h-3.5" />
                    CFG
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('cfg', parameters.cfg) }}
                  </span>
                </div>

                <!-- 种子 -->
                <div v-if="parameters.seed"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle class="w-3.5 h-3.5" />
                    种子
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter('seed', parameters.seed) }}
                  </span>
                </div>

                <!-- 尺寸 -->
                <div v-if="parameters.width && parameters.height"
                  class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Ruler class="w-3.5 h-3.5" />
                    尺寸
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ parameters.width }}×{{ parameters.height }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 正向提示词 -->
            <!-- 正向提示词 -->
            <div v-if="positive" class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  正向提示词
                </label>
                <button v-if="showActions" @click="copyPositive"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors">
                  <Check v-if="copiedPositive" class="w-3.5 h-3.5" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  {{ copiedPositive ? '已复制' : '复制' }}
                </button>
              </div>
              <n-scrollbar class="bg-green-500/5 border border-green-500/20 rounded-xl" style="max-height: 200px">
                <p class="p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                  {{ positive }}
                </p>
              </n-scrollbar>
            </div>

            <!-- 负向提示词 -->
            <div v-if="negative" class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  负向提示词
                </label>
                <button v-if="showActions" @click="copyNegative"
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Check v-if="copiedNegative" class="w-3.5 h-3.5" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  {{ copiedNegative ? '已复制' : '复制' }}
                </button>
              </div>
              <n-scrollbar class="bg-red-500/5 border border-red-500/20 rounded-xl" style="max-height: 150px">
                <p class="p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
                  {{ negative }}
                </p>
              </n-scrollbar>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
