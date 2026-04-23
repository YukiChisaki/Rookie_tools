<script setup lang="ts">
import { ref, computed } from 'vue';
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
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  parameters: () => ({}),
  showImage: true,
  showActions: true,
  showDelete: false,
  editable: true,
});

const emit = defineEmits<{
  (e: 'copy', text: string, type: 'positive' | 'negative' | 'full'): void;
  (e: 'delete'): void;
  (e: 'save', data: { name: string; positive: string; negative: string; parameters: ImageParameters }): void;
  (e: 'cancel'): void;
}>();

// 表单数据模型
const formData = ref({
  name: props.name,
  positive: props.positive,
  negative: props.negative,
  parameters: {
    model: props.parameters?.model || '',
    sampler: props.parameters?.sampler || '',
    scheduler: props.parameters?.schedule || props.parameters?.scheduler || '',
    steps: props.parameters?.steps,
    cfg: props.parameters?.cfg,
    seed: props.parameters?.seed,
    width: props.parameters?.width,
    height: props.parameters?.height,
  } as ImageParameters,
});

const copiedPositive = ref(false);
const copiedNegative = ref(false);

async function copyPositive() {
  await navigator.clipboard.writeText(formData.value.positive);
  copiedPositive.value = true;
  emit('copy', formData.value.positive, 'positive');
  setTimeout(() => (copiedPositive.value = false), 1500);
}

async function copyNegative() {
  await navigator.clipboard.writeText(formData.value.negative);
  copiedNegative.value = true;
  emit('copy', formData.value.negative, 'negative');
  setTimeout(() => (copiedNegative.value = false), 1500);
}

async function copyFull() {
  const full = `正向提示词: ${formData.value.positive}\n\n负向提示词: ${formData.value.negative}`;
  await navigator.clipboard.writeText(full);
  emit('copy', full, 'full');
}

function handleSave() {
  emit('save', {
    name: formData.value.name,
    positive: formData.value.positive,
    negative: formData.value.negative,
    parameters: formData.value.parameters,
  });
}

function handleCancel() {
  emit('cancel');
}

// 尺寸计算属性
const sizeValue = computed({
  get() {
    const w = formData.value.parameters.width;
    const h = formData.value.parameters.height;
    if (w && h) return `${w}×${h}`;
    return '';
  },
  set(val: string) {
    const parts = val.split('×');
    if (parts.length === 2) {
      formData.value.parameters.width = parseInt(parts[0]) || undefined;
      formData.value.parameters.height = parseInt(parts[1]) || undefined;
    }
  },
});
</script>

<template>
  <div class="h-full min-h-[800px] flex flex-col overflow-y-auto">
    <!-- 内容区 -->
    <div class="flex-1 p-6">
      <div class="w-full space-y-6 overflow-y-auto">
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
            <div class="p-4 rounded-xl border bg-card/50"
              style="border-color: rgba(52, 152, 219, 0.15)">
              <h3 class="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span class="w-1.5 h-1.5 rounded-full"
                  style="background: linear-gradient(135deg, #3498db 0%, #f368e0 100%)"></span>
                核心参数
              </h3>

              <!-- 名称 - 可编辑 -->
              <div class="flex items-center justify-between p-3 mb-2 bg-card rounded-lg border border-border/50 hover:border-blue-400/40 transition-colors group">
                <div class="flex items-center gap-3 flex-1">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <Box class="w-3.5 h-3.5" />
                    名称
                  </span>
                  <input
                    v-model="formData.name"
                    type="text"
                    class="flex-1 text-sm font-medium text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50 hover:bg-white/5 focus:bg-white/10 rounded px-1 py-0.5 -ml-1 transition-colors"
                    placeholder="输入名称..."
                  />
                </div>
              </div>

              <!-- 模型 - 可编辑 -->
              <div class="flex items-center justify-between p-3 mb-2 bg-card rounded-lg border border-border/50 hover:border-blue-400/40 transition-colors group">
                <div class="flex items-center gap-3 flex-1">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <Box class="w-3.5 h-3.5" />
                    模型
                  </span>
                  <input
                    v-model="formData.parameters.model"
                    type="text"
                    class="flex-1 text-sm font-medium text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/50 hover:bg-white/5 focus:bg-white/10 rounded px-1 py-0.5 -ml-1 transition-colors"
                    placeholder="输入模型..."
                  />
                </div>
                <a :href="`https://civitai.com/search/models?query=${encodeURIComponent(formData.parameters.model?.split('.')[0] || '')}`"
                  target="_blank" class="text-xs text-blue-500 hover:text-blue-400 transition-colors ml-2">
                  查找模型
                </a>
              </div>

              <!-- 其他参数网格 -->
              <div class="grid grid-cols-3 gap-2">
                <!-- 采样器 - 可编辑 -->
                <div class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover:border-blue-400/40 transition-colors group">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <Sliders class="w-3.5 h-3.5" />
                    采样器
                  </span>
                  <input
                    v-model="formData.parameters.sampler"
                    type="text"
                    class="text-sm font-medium text-foreground bg-transparent border-none outline-none text-right w-20 placeholder:text-muted-foreground/50 hover:bg-white/5 focus:bg-white/10 rounded px-1 py-0.5 -mr-1 transition-colors"
                    placeholder="-"
                  />
                </div>

                <!-- 调度器 - 可编辑 -->
                <div class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover:border-blue-400/40 transition-colors group">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <Sliders class="w-3.5 h-3.5" />
                    调度器
                  </span>
                  <input
                    v-model="formData.parameters.scheduler"
                    type="text"
                    class="text-sm font-medium text-foreground bg-transparent border-none outline-none text-right w-20 placeholder:text-muted-foreground/50 hover:bg-white/5 focus:bg-white/10 rounded px-1 py-0.5 -mr-1 transition-colors"
                    placeholder="-"
                  />
                </div>

                <!-- 步数 - 可编辑 -->
                <div class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover:border-blue-400/40 transition-colors group">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <Sparkles class="w-3.5 h-3.5" />
                    步数
                  </span>
                  <input
                    v-model.number="formData.parameters.steps"
                    type="number"
                    class="text-sm font-medium text-foreground bg-transparent border-none outline-none text-right w-16 placeholder:text-muted-foreground/50 hover:bg-white/5 focus:bg-white/10 rounded px-1 py-0.5 -mr-1 transition-colors"
                    placeholder="-"
                  />
                </div>

                <!-- CFG - 可编辑 -->
                <div class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover:border-blue-400/40 transition-colors group">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <Sliders class="w-3.5 h-3.5" />
                    CFG
                  </span>
                  <input
                    v-model.number="formData.parameters.cfg"
                    type="number"
                    step="0.1"
                    class="text-sm font-medium text-foreground bg-transparent border-none outline-none text-right w-16 placeholder:text-muted-foreground/50 hover:bg-white/5 focus:bg-white/10 rounded px-1 py-0.5 -mr-1 transition-colors"
                    placeholder="-"
                  />
                </div>

                <!-- 种子 - 可编辑 -->
                <div class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover:border-blue-400/40 transition-colors group">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <AlertCircle class="w-3.5 h-3.5" />
                    种子
                  </span>
                  <input
                    v-model.number="formData.parameters.seed"
                    type="number"
                    class="text-sm font-medium text-foreground bg-transparent border-none outline-none text-right w-20 placeholder:text-muted-foreground/50 hover:bg-white/5 focus:bg-white/10 rounded px-1 py-0.5 -mr-1 transition-colors"
                    placeholder="-"
                  />
                </div>

                <!-- 尺寸 - 可编辑 -->
                <div class="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50 hover:border-blue-400/40 transition-colors group">
                  <span class="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <Ruler class="w-3.5 h-3.5" />
                    尺寸
                  </span>
                  <input
                    v-model="sizeValue"
                    type="text"
                    class="text-sm font-medium text-foreground bg-transparent border-none outline-none text-right w-24 placeholder:text-muted-foreground/50 hover:bg-white/5 focus:bg-white/10 rounded px-1 py-0.5 -mr-1 transition-colors"
                    placeholder="宽×高"
                  />
                </div>
              </div>
            </div>

            <!-- 正向提示词 - 可编辑 -->
            <div class="space-y-2">
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
              <textarea
                v-model="formData.positive"
                :rows="5"
                class="w-full p-4 bg-green-500/5 border border-green-500/20 rounded-xl text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono resize-y outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 hover:border-green-500/30 transition-all placeholder:text-muted-foreground/40"
                placeholder="输入正向提示词..."
              />
            </div>

            <!-- 负向提示词 - 可编辑 -->
            <div class="space-y-2">
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
              <textarea
                v-model="formData.negative"
                :rows="4"
                class="w-full p-4 bg-red-500/5 border border-red-500/20 rounded-xl text-sm text-foreground whitespace-pre-wrap leading-relaxed font-mono resize-y outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 hover:border-red-500/30 transition-all placeholder:text-muted-foreground/40"
                placeholder="输入负向提示词..."
              />
            </div>

            <!-- 保存/取消按钮 -->
            <div class="flex items-center justify-end gap-3 pt-4">
              <button
                @click="handleCancel"
                class="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                取消
              </button>
              <button
                @click="handleSave"
                class="px-4 py-2 text-sm font-medium text-white bg-[#3498db] hover:bg-[#2980b9] rounded-lg transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
