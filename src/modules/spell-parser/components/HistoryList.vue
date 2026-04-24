<script setup lang="ts">
import { computed } from 'vue';
import { Trash2, Image as ImageIcon, Clock } from 'lucide-vue-next';
import type { ParsedImageData } from '../../../types';
import { formatGeneratorName } from '../../../services/spellParser';

interface Props {
  images: ParsedImageData[];
  currentId?: string;
}

interface Emits {
  (e: 'select', image: ParsedImageData): void;
  (e: 'delete', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const sortedImages = computed(() => {
  return [...props.images].sort((a, b) => b.createdAt - a.createdAt);
});

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于 1 分钟
  if (diff < 60000) {
    return '刚刚';
  }

  // 小于 1 小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }

  // 小于 24 小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }

  // 小于 7 天
  if (diff < 604800000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }

  return date.toLocaleDateString('zh-CN');
}

function handleSelect(image: ParsedImageData) {
  emit('select', image);
}

function handleDelete(event: MouseEvent, id: string) {
  event.stopPropagation();
  emit('delete', id);
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 头部 -->
    <div class="p-4 border-b border-border">
      <h2 class="text-lg font-bold text-foreground">解析历史</h2>
      <p class="text-xs text-muted-foreground">
        共 <span class="font-bold">{{ sortedImages.length }}</span> 条记录
      </p>
    </div>

    <!-- 列表 -->
    <n-scrollbar class="flex-1">
      <div class="p-2 space-y-1">
        <div
          v-for="image in sortedImages"
          :key="image.id"
          @click="handleSelect(image)"
          :class="[
            'group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200',
            currentId === image.id
              ? 'bg-primary/10 border border-primary/20'
              : 'hover:bg-muted border border-transparent'
          ]"
        >
          <!-- 缩略图 -->
          <div class="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            <img
              v-if="image.thumbnailData"
              :src="image.thumbnailData"
              :alt="image.fileName"
              class="w-full h-full object-cover"
            />
            <img
              v-else-if="image.previewUrl"
              :src="image.previewUrl"
              :alt="image.fileName"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <ImageIcon class="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-foreground truncate">
              {{ image.fileName }}
            </p>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs text-muted-foreground">
                {{ formatGeneratorName(image.generator) }}
              </span>
              <span class="text-xs text-muted-foreground flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ formatTime(image.createdAt) }}
              </span>
            </div>
          </div>

          <!-- 删除按钮 -->
          <button
            @click="(e) => handleDelete(e, image.id)"
            class="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>

        <!-- 空状态 -->
        <div v-if="images.length === 0" class="text-center py-10">
          <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
            <ImageIcon class="w-6 h-6 text-muted-foreground/50" />
          </div>
          <p class="text-sm text-muted-foreground">暂无解析记录</p>
          <p class="text-xs text-muted-foreground/70 mt-1">
            上传图片开始解析
          </p>
        </div>
      </div>
    </n-scrollbar>
  </div>
</template>
