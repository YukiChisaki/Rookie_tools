<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-vue-next';

interface Props {
  isLoading?: boolean;
}

interface Emits {
  (e: 'upload', file: File): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isDragOver = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file && isValidImage(file)) {
    emit('upload', file);
  }
  // 重置 input 以便可以重复选择同一文件
  input.value = '';
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;

  const file = event.dataTransfer?.files[0];
  if (file && isValidImage(file)) {
    emit('upload', file);
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;
}

function isValidImage(file: File): boolean {
  return file.type.startsWith('image/');
}

function triggerFileInput() {
  fileInput.value?.click();
}

// 全局拖拽处理
function handleGlobalDragOver(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = true;
}

function handleGlobalDrop(event: DragEvent) {
  event.preventDefault();
  isDragOver.value = false;
}

function handleGlobalDragLeave(event: DragEvent) {
  // 只有当离开窗口时才重置
  if (event.relatedTarget === null) {
    isDragOver.value = false;
  }
}

onMounted(() => {
  window.addEventListener('dragover', handleGlobalDragOver);
  window.addEventListener('drop', handleGlobalDrop);
  window.addEventListener('dragleave', handleGlobalDragLeave);
});

onUnmounted(() => {
  window.removeEventListener('dragover', handleGlobalDragOver);
  window.removeEventListener('drop', handleGlobalDrop);
  window.removeEventListener('dragleave', handleGlobalDragLeave);
});
</script>

<template>
  <div
    class="relative h-full flex flex-col items-center justify-center p-8"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
  >
    <!-- 全局拖拽提示遮罩 -->
    <div
      v-if="isDragOver"
      class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
    >
      <div class="bg-card border-2 border-dashed border-primary rounded-2xl p-12 text-center shadow-lg">
        <Upload class="w-16 h-16 text-primary mx-auto mb-4" />
        <p class="text-xl font-semibold text-foreground">松开鼠标上传图片</p>
      </div>
    </div>

    <!-- 上传区域 -->
    <div
      @click="triggerFileInput"
      :class="[
        'w-full max-w-xl cursor-pointer transition-all duration-300',
        'border-2 border-dashed rounded-2xl p-12 text-center',
        'hover:border-primary hover:bg-primary/5',
        isDragOver
          ? 'border-primary bg-primary/10 scale-[1.02]'
          : 'border-border bg-card'
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      />

      <div v-if="props.isLoading" class="flex flex-col items-center">
        <Loader2 class="w-16 h-16 text-primary animate-spin mb-4" />
        <p class="text-lg font-medium text-foreground">正在解析图片...</p>
      </div>

      <div v-else class="flex flex-col items-center">
        <div
          class="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors"
          :class="isDragOver ? 'bg-primary/20' : 'bg-primary/10'"
        >
          <ImageIcon
            class="w-10 h-10 transition-colors"
            :class="isDragOver ? 'text-primary' : 'text-primary/70'"
          />
        </div>

        <h3 class="text-xl font-semibold text-foreground mb-2">
          点击上传或将图片拖到页面任意位置
        </h3>

        <p class="text-sm text-muted-foreground mb-4">
          支持 PNG、JPEG、WebP 等格式，浏览器本地处理不上传云端
        </p>

        <div class="flex items-center gap-2 text-xs text-muted-foreground/70">
          <span class="px-2 py-1 bg-muted rounded">ComfyUI</span>
          <span class="px-2 py-1 bg-muted rounded">WebUI</span>
          <span class="px-2 py-1 bg-muted rounded">NovelAI</span>
        </div>
      </div>
    </div>

    <!-- 提示信息 -->
    <p class="mt-6 text-xs text-muted-foreground text-center">
      支持解析 ComfyUI、WebUI、NovelAI 等生成的图片元数据
    </p>
  </div>
</template>
