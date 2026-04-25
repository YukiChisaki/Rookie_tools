<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  Plus,
  Search,
  X,
  FileText,
  Trash2,
  ImageIcon,
  Copy,
  Archive,
  ImagePlus,
} from 'lucide-vue-next';
import { MasonryWall } from '@yeger/vue-masonry-wall';
import { useDialog, useMessage } from 'naive-ui';
import { usePromptStore } from '../../stores/prompt';
import type { PromptRecord, ImageParameters } from '../../types';
import { compressImage } from '../../utils/imageCompressor';

const promptStore = usePromptStore();
const dialog = useDialog();
const message = useMessage();

// Debug: 检查提示词数据
onMounted(() => {
  console.log('[PromptManager] 加载的提示词数量:', promptStore.prompts.length);
  promptStore.prompts.forEach((p, i) => {
    console.log(`[PromptManager] 提示词 ${i}:`, {
      p,
      id: p.id,
      name: p.name,
      hasThumbnail: !!p.thumbnailData,
      thumbnailLength: p.thumbnailData?.length || 0,
      thumbnailPreview: p.thumbnailData?.substring(0, 50) + '...',
    });
  });
});

// 搜索和筛选
const searchQuery = ref('');
const filteredPrompts = computed(() => {
  if (!searchQuery.value.trim()) return promptStore.sortedPrompts;
  const query = searchQuery.value.toLowerCase();
  return promptStore.sortedPrompts.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.positive.toLowerCase().includes(query)
  );
});

// 弹窗状态
const showDetailModal = ref(false);
const showEditModal = ref(false);
const selectedPrompt = ref<PromptRecord | null>(null);
const isCreating = ref(false);

// 编辑表单
const editForm = ref<{
  id?: string;
  name: string;
  positive: string;
  negative: string;
  imageFile?: File;
  thumbnailData?: string;
  previewData?: string;
}>({
  name: '',
  positive: '',
  negative: '',
});

// 打开详情弹窗
function openDetailModal(prompt: PromptRecord) {
  selectedPrompt.value = prompt;
  showDetailModal.value = true;
}

// 关闭详情弹窗
function closeDetailModal() {
  showDetailModal.value = false;
  selectedPrompt.value = null;
}

// 打开新建弹窗
function openCreateModal() {
  isCreating.value = true;
  editForm.value = {
    name: '新建提示词',
    positive: '',
    negative: '',
  };
  showEditModal.value = true;
}

// 打开编辑弹窗
function openEditModal(prompt: PromptRecord) {
  isCreating.value = false;
  editForm.value = {
    id: prompt.id,
    name: prompt.name,
    positive: prompt.positive,
    negative: prompt.negative,
    thumbnailData: prompt.thumbnailData,
    previewData: prompt.previewData,
  };
  showDetailModal.value = false;
  showEditModal.value = true;
}

// 关闭编辑弹窗
function closeEditModal() {
  showEditModal.value = false;
  editForm.value = {
    name: '',
    positive: '',
    negative: '',
  };
}

// 图片上传相关 - 使用原生拖拽 + input，避免 n-upload 状态管理问题
const imageInputRef = ref<HTMLInputElement | null>(null);
const isDragOver = ref(false);

// 图片预览URL
const previewImageUrl = computed(() => {
  if (editForm.value.imageFile) {
    return URL.createObjectURL(editForm.value.imageFile);
  }
  return editForm.value.previewData || '';
});

// 是否有预览图
const hasImagePreview = computed(() => !!previewImageUrl.value);

// 校验并设置图片文件
function processImageFile(file: File | null) {
  if (!file) return;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    message.error('仅支持 JPG/PNG/GIF/WebP 格式');
    return;
  }

  if (file.size > 20 * 1024 * 1024) {
    message.error('图片大小不能超过 20MB');
    return;
  }

  editForm.value.imageFile = file;
}

// 点击触发 input 选择文件
function triggerImageSelect() {
  imageInputRef.value?.click();
}

// input 文件变化
function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0] ?? null;
  processImageFile(file);
  // 重置 input 以便重复选择同一文件
  target.value = '';
}

// 拖拽事件
function handleDragOver(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = true;
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = false;
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  isDragOver.value = false;
  const file = e.dataTransfer?.files[0] ?? null;
  processImageFile(file);
}

// 移除图片
function handleRemoveImage() {
  editForm.value.imageFile = undefined;
}

// 保存提示词
async function savePrompt() {
  // TODO: 1. 解析原图数据 2. 保存提示词
  const form = editForm.value;

  let thumbnailData = form.thumbnailData;
  let previewData = form.previewData;

  // 如果有新选择的图片，压缩处理
  if (form.imageFile) {
    try {
      console.log('[PromptManager] 开始压缩图片:', form.imageFile.name);
      const compressed = await compressImage(form.imageFile);
      thumbnailData = compressed.thumbnailData;
      previewData = compressed.previewData;
      console.log('[PromptManager] 图片压缩完成:', {
        thumbnailLength: thumbnailData?.length,
        previewLength: previewData?.length,
        thumbnailPreview: thumbnailData?.substring(0, 50) + '...',
      });
    } catch (error) {
      console.error('[PromptManager] 图片压缩失败:', error);
      message.error('图片压缩失败: ' + (error instanceof Error ? error.message : '未知错误'));
      return;
    }
  }

  console.log('[PromptManager] 保存提示词:', {
    isCreating: isCreating.value,
    hasThumbnail: !!thumbnailData,
    thumbnailLength: thumbnailData?.length,
  });

  if (isCreating.value) {
    // TODO:解析图片并创建新提示词
    const newPrompt = await promptStore.createPrompt({
      name: form.name,
      positive: form.positive,
      negative: form.negative,
      thumbnailData,
      previewData,
    });
    console.log('[PromptManager] 新提示词已创建:', {
      id: newPrompt.id,
      hasThumbnail: !!newPrompt.thumbnailData,
    });
  } else if (form.id) {
    // 更新现有提示词
    await promptStore.updatePrompt(form.id, {
      name: form.name,
      positive: form.positive,
      negative: form.negative,
      thumbnailData,
      previewData,
    });
    console.log('[PromptManager] 提示词已更新');
  }

  closeEditModal();
}

// 删除提示词
function deletePrompt(id: string) {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个提示词吗？此操作不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await promptStore.deletePrompt(id);
      if (selectedPrompt.value?.id === id) {
        closeDetailModal();
      }
      if (showEditModal.value && editForm.value.id === id) {
        closeEditModal();
      }
      message.success('提示词已删除');
    },
  });
}

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

// 处理复制事件
function handleCopy(text: string, type: 'positive' | 'negative' | 'full') {
  console.log(`已复制 ${type}:`, text.substring(0, 50) + '...');
}

// 处理详情弹窗的保存事件
async function handleSaveFromDetail(data: { name: string; positive: string; negative: string; parameters: ImageParameters }) {
  if (!selectedPrompt.value) return;

  await promptStore.updatePrompt(selectedPrompt.value.id, {
    name: data.name,
    positive: data.positive,
    negative: data.negative,
    parameters: data.parameters,
  });

  message.success('提示词已保存');
  closeDetailModal();
}

// 复制全部提示词
async function copyFullPrompt() {
  if (!selectedPrompt.value) return;
  const full = `正向提示词: ${selectedPrompt.value.positive}\n\n负向提示词: ${selectedPrompt.value.negative}`;
  await navigator.clipboard.writeText(full);
  message.success('已复制全部提示词');
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b gap-3 border-border bg-card/50">
      <!-- 左侧 -->
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-bold text-foreground">提示词管理</h2>
        <span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
          {{ filteredPrompts.length }} 个提示词
        </span>
      </div>
      <!-- 右侧 -->
      <div class="flex items-center gap-3 flex-1">
        <!-- 搜索框 -->
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input v-model="searchQuery" type="text" placeholder="搜索提示词..." class="input-field pl-10 text-sm w-[60%]" />
        </div>

        <!-- TODO:批量导入 -->
        <n-button @click="() => console.log('批量导入')" disabled type="info" class="text-sm flex items-center gap-2">
          <Plus class="w-4 h-4" />
          TODO批量导入
        </n-button>
        <!-- 新建按钮 -->
        <button @click="openCreateModal" class="btn-primary text-sm flex items-center gap-2">
          <Plus class="w-4 h-4" />
          新建提示词
        </button>
      </div>
    </div>

    <!-- 卡片网格 -->
    <n-scrollbar class="flex-1">
      <div class="p-6">
        <!-- 空状态 -->
        <div v-if="filteredPrompts.length === 0"
          class="h-full flex flex-col items-center justify-center text-muted-foreground">
          <div class="w-20 h-20 rounded-2xl bg-[rgba(52,152,219,0.06)] flex items-center justify-center mb-5">
            <FileText class="w-10 h-10 text-[#3498db]/30" />
          </div>
          <p class="font-medium">
            {{ searchQuery ? '未找到匹配的提示词' : '暂无提示词' }}
          </p>
          <button v-if="!searchQuery" @click="openCreateModal" class="btn-primary mt-5 flex items-center gap-2">
            <Plus class="w-4 h-4" />
            新建提示词
          </button>
        </div>

        <!-- 瀑布流布局 -->
        <MasonryWall v-else :items="filteredPrompts" :column-width="220" :gap="16" :ssr-columns="1">
          <template #default="{ item: prompt }">
            <div
              class="group bg-card border border-dotted border-[--primary]  rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <!-- 图片区域 -->
              <div class="bg-muted/50 relative overflow-hidden" @click="openDetailModal(prompt)">
                <img v-if="prompt.previewData" :src="prompt.previewData" :alt="prompt.name"
                  class="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" />
                <div v-else class="aspect-square flex items-center justify-center">
                  <div class="w-16 h-16 rounded-2xl bg-[rgba(52,152,219,0.08)] flex items-center justify-center">
                    <ImageIcon class="w-8 h-8 text-[#3498db]/40" />
                  </div>
                </div>

                <!-- Hover 遮罩层 - 顶部信息 -->
                <div class="absolute inset-x-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div class="flex items-center justify-between bg-black/40  px-3 py-2">
                    <span class="text-sm text-white/90">
                      {{ formatDate(prompt.updatedAt) }}
                    </span>
                    <span v-if="prompt.source === 'parsed'"
                      class="px-2 py-0.5 rounded-md text-sm font-semibold text-white bg-[#3498db]">
                      魔法
                    </span>
                    <span v-else class="px-2 py-0.5 rounded-md text-sm font-semibold text-white bg-[#f368e0]">
                      手动
                    </span>
                  </div>
                </div>
                <!-- Hover 遮罩层 - 底部信息 -->
                <div
                  class="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div class="flex items-center justify-between gap-2 bg-black/40 px-3 py-2">
                    <h3 class="font-medium text-white text-sm truncate flex-1" :title="prompt.name">
                      {{ prompt.name }}
                    </h3>
                    <button @click.stop="deletePrompt(prompt.id)"
                      class="w-7 h-7 bg-white text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center flex-shrink-0">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </MasonryWall>
      </div>
    </n-scrollbar>

    <!-- 详情弹窗 -->
    <n-modal v-model:show="showDetailModal" preset="card" style="width: 900px; max-width: 95vw" :mask-closable="true"
      class="prompt-detail-modal">
      <template #header>
        <div class="flex items-center justify-between w-full pr-8">
          <div class="flex items-center gap-3">
            <h2 class="text-lg font-bold text-foreground">
              {{ selectedPrompt?.name }}
            </h2>
            <span v-if="selectedPrompt?.source === 'parsed'"
              class="px-2 py-0.5 rounded-lg text-xs font-semibold text-[#3498db] bg-[rgba(52,152,219,0.1)]">
              魔法
            </span>
          </div>
          <!-- <div class="flex items-center gap-2">
            <button @click="copyFullPrompt()" class="btn-secondary text-sm flex items-center gap-2">
              <Copy class="w-4 h-4" />
              复制全部
            </button>
          </div> -->
        </div>
      </template>

      <!-- 弹窗内容 -->
      <n-scrollbar style="max-height: 70vh">
        <!-- TODO:图片标签crud与点击复制 -->
        <PromptDetailForm v-if="selectedPrompt" :name="selectedPrompt.name" :positive="selectedPrompt.positive"
          :negative="selectedPrompt.negative" :parameters="selectedPrompt.parameters"
          :preview-data="selectedPrompt.previewData" :show-image="false" :show-actions="true" :show-delete="true"
          @copy="handleCopy" @delete="deletePrompt(selectedPrompt.id)" @save="handleSaveFromDetail"
          @cancel="closeDetailModal" />
      </n-scrollbar>
    </n-modal>

    <!-- 新建弹窗 -->
    <n-modal v-model:show="showEditModal" preset="card" style="width: 800px; max-width: 95vw" :mask-closable="false"
      :closable="false" class="prompt-edit-modal">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-lg font-bold text-foreground">
            新建提示词
          </h2>
          <n-button quaternary circle size="small" @click="closeEditModal">
            <template #icon>
              <X class="w-5 h-5" />
            </template>
          </n-button>
        </div>
      </template>

      <div class="flex gap-6">
        <!-- 左侧: 图片上传区域 (原生拖拽 + input) -->
        <div
          class="image-upload-zone flex-shrink-0 w-[280px] h-[60vh] relative rounded-xl overflow-hidden group cursor-pointer transition-all duration-200"
          :class="{ 'is-drag-over': isDragOver }" @click="triggerImageSelect" @dragover="handleDragOver"
          @dragleave="handleDragLeave" @drop="handleDrop">
          <!-- 隐藏的 file input -->
          <input ref="imageInputRef" type="file" accept="image/*" class="hidden" @change="handleFileChange" />

          <!-- 有预览图 -->
          <template v-if="hasImagePreview">
            <img :src="previewImageUrl" alt="Preview" class="w-full h-full object-contain bg-muted/30 rounded-xl" />

            <!-- Hover 覆盖层 -->
            <div
              class="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 pointer-events-none">
              <ImagePlus class="w-10 h-10 text-white/80" />
              <p class="text-sm text-white font-medium">点击或拖拽更换图片</p>
              <p class="text-xs text-white/50">支持 JPG、PNG、GIF、WebP</p>
            </div>

            <!-- 删除按钮 -->
            <button
              class="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all duration-200 z-10"
              @click.stop="handleRemoveImage">
              <X class="w-4 h-4" />
            </button>
          </template>

          <!-- 无图占位 -->
          <div v-else class="w-full h-full flex flex-col items-center justify-center rounded-xl">
            <div
              class="w-16 h-16 rounded-2xl bg-[rgba(52,152,219,0.1)] flex items-center justify-center mb-4 group-hover:bg-[rgba(52,152,219,0.18)] transition-colors duration-200">
              <ImagePlus class="w-8 h-8 text-[#3498db]/70 group-hover:text-[#3498db] transition-colors duration-200" />
            </div>
            <p
              class="text-sm font-medium text-foreground mb-1 group-hover:text-[#3498db] transition-colors duration-200">
              点击或拖拽图片到此区域</p>
            <p class="text-xs text-muted-foreground">支持 JPG、PNG、GIF、WebP 格式，最大 20MB</p>
          </div>
        </div>

        <!-- 右侧: 表单内容 -->
        <n-scrollbar class="flex-1 min-w-0" style="max-height: 60vh">
          <div class="pr-1 space-y-5">
            <!-- 名称 -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                提示词名称
              </label>
              <n-input v-model:value="editForm.name" placeholder="输入提示词名称..." />
            </div>


            <!-- 正向提示词 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  正面提示词
                </label>
              </div>
              <textarea v-model="editForm.positive" :rows="5" placeholder="输入正面提示词..."
                class="prompt-textarea prompt-textarea--positive" />
            </div>

            <!-- 负向提示词 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  负面提示词
                </label>
              </div>
              <textarea v-model="editForm.negative" :rows="4" placeholder="输入负面提示词..."
                class="prompt-textarea prompt-textarea--negative" />
            </div>
          </div>
        </n-scrollbar>
      </div>


      <template #footer>
        <div class="flex items-center justify-between w-full">
          <n-button v-if="!isCreating && editForm.id" type="error" ghost @click="deletePrompt(editForm.id!)">
            <template #icon>
              <Trash2 class="w-4 h-4" />
            </template>
            删除
          </n-button>
          <div v-else></div>
          <div class="flex items-center gap-3">
            <n-button @click="closeEditModal">
              取消
            </n-button>
            <n-button type="primary" @click="savePrompt">
              创建
            </n-button>
          </div>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.image-upload-zone {
  border: 2px dashed rgba(148, 163, 184, 0.4);
  background-color: transparent;
}

.image-upload-zone:hover {
  border-color: #3498db;
  background-color: rgba(52, 152, 219, 0.04);
}

.image-upload-zone.is-drag-over {
  border-color: #3498db;
  background-color: rgba(52, 152, 219, 0.08);
}

/* 原生 textarea 基础样式 */
.prompt-textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.7;
  border: 1px solid transparent;
  border-radius: 10px;
  outline: none;
  resize: vertical;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.prompt-textarea::placeholder {
  color: #94a3b8;
}

/* 浅色主题（默认） */
.prompt-textarea {
  background-color: rgba(241, 245, 249, 0.95);
  color: #334155;
}

/* 深色主题 - 使用 .dark class 匹配 naive-ui 主题切换 */
.dark .prompt-textarea {
  background-color: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
}

.dark .prompt-textarea::placeholder {
  color: #64748b;
}

/* 正向提示词 - 绿色边框 */
.prompt-textarea--positive {
  border-color: rgba(34, 197, 94, 0.5);
}

.prompt-textarea--positive:focus,
.prompt-textarea--positive:hover {
  border-color: #22c55e;
  /* box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); */
}

/* 负向提示词 - 红色边框 */
.prompt-textarea--negative {
  border-color: rgba(239, 68, 68, 0.5);
}

.prompt-textarea--negative:focus,
.prompt-textarea--negative:hover {
  border-color: #ef4444;
  /* box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2); */
}
</style>
