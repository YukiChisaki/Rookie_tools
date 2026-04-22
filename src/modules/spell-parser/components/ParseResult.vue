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
import type { ParsedImageData } from '../../../types';
import { formatGeneratorName, formatParameter } from '../../../services/spellParser';
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

// 参数列表
const paramList = [
  { key: 'model', label: '模型', icon: Box },
  { key: 'sampler', label: '采样器', icon: Sliders },
  { key: 'scheduler', label: '调度器', icon: Sliders },
  { key: 'steps', label: '步数', icon: Sparkles },
  { key: 'cfg', label: 'CFG Scale', icon: Sliders },
  { key: 'seed', label: '种子', icon: AlertCircle },
  { key: 'width', label: '宽度', icon: Ruler },
  { key: 'height', label: '高度', icon: Ruler },
] as const;
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- 头部 -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-border">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          style="background: linear-gradient(135deg, #3498db 0%, #5dade2 100%);"
        >
          <Cpu class="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-foreground">解析结果</h2>
          <p class="text-xs text-muted-foreground">
            {{ formatGeneratorName(image.generator) }} · {{ image.fileName }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="handleImport"
          class="btn-primary text-sm flex items-center gap-2"
        >
          <FileDown class="w-4 h-4" />
          导入提示词管理
        </button>
        <button
          @click="handleClose"
          class="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-y-auto p-6">
      <div class="max-w-5xl mx-auto space-y-6">
        <!-- 图片和信息 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 图片预览 -->
          <div class="bg-card border border-border rounded-xl overflow-hidden">
            <div class="aspect-square flex items-center justify-center bg-muted/30">
              <img
                :src="image.previewUrl"
                :alt="image.fileName"
                class="max-w-full max-h-full object-contain"
              />
            </div>
            <div class="p-3 border-t border-border">
              <p class="text-sm font-medium text-foreground truncate">
                {{ image.fileName }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ formatGeneratorName(image.generator) }}
              </p>
            </div>
          </div>

          <!-- 参数信息 -->
          <div class="space-y-4">
            <!-- 基本信息 -->
            <div
              class="p-4 rounded-xl border"
              style="background: linear-gradient(135deg, rgba(52,152,219,0.06) 0%, rgba(243,104,224,0.04) 100%); border-color: rgba(52,152,219,0.15);"
            >
              <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full" style="background: linear-gradient(135deg, #3498db 0%, #f368e0 100%);"></span>
                生成参数
              </h3>

              <div class="grid grid-cols-2 gap-3">
                <div
                  v-for="param in paramList"
                  :key="param.key"
                  v-show="image.parameters[param.key] !== undefined"
                  class="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border/50"
                >
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5">
                    <component :is="param.icon" class="w-3.5 h-3.5" />
                    {{ param.label }}
                  </span>
                  <span class="text-sm font-medium text-foreground">
                    {{ formatParameter(param.key, image.parameters[param.key]) }}
                  </span>
                </div>
              </div>

              <div
                v-if="Object.keys(image.parameters).length === 0"
                class="text-center py-4 text-sm text-muted-foreground"
              >
                未检测到生成参数
              </div>
            </div>
          </div>
        </div>

        <!-- 正向提示词 -->
        <div v-if="image.positivePrompt" class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              正向提示词
            </label>
            <button
              @click="copyPositive"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
            >
              <Check v-if="copiedPositive" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedPositive ? '已复制' : '复制' }}
            </button>
          </div>
          <div class="p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
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
            <button
              @click="copyNegative"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Check v-if="copiedNegative" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              {{ copiedNegative ? '已复制' : '复制' }}
            </button>
          </div>
          <div class="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <p class="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono">
              {{ image.negativePrompt }}
            </p>
          </div>
        </div>

        <!-- 完整元数据 -->
        <MetadataViewer :metadata="image.rawMetadata" />
      </div>
    </div>
  </div>
</template>
