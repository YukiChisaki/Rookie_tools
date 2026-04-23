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
} from 'lucide-vue-next';
import { MasonryWall } from '@yeger/vue-masonry-wall';
import { useDialog, useMessage } from 'naive-ui';
import { usePromptStore } from '../../stores/prompt';
import type { PromptRecord } from '../../types';
import PromptDetailViewer from '../../components/PromptDetailViewer.vue';
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

// 处理图片选择
function handleImageSelect(data: { fileList: { file: File }[] }) {
  const file = data.fileList[0]?.file;
  if (file) {
    editForm.value.imageFile = file;
  }
}

// 保存提示词
async function savePrompt() {
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
    // 创建新提示词
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
    <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
      <div class="flex items-center gap-3">
        <h2 class="text-lg font-bold text-foreground">提示词管理</h2>
        <span class="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
          {{ filteredPrompts.length }} 个提示词
        </span>
      </div>

      <div class="flex items-center gap-3">
        <!-- 搜索框 -->
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input v-model="searchQuery" type="text" placeholder="搜索提示词..." class="input-field pl-10 text-sm w-64" />
        </div>

        <!-- 新建按钮 -->
        <button @click="openCreateModal" class="btn-primary text-sm flex items-center gap-2">
          <Plus class="w-4 h-4" />
          新建提示词
        </button>
      </div>
    </div>

    <!-- 卡片网格 -->
    <div class="flex-1 overflow-y-auto p-6">
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
            class="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[rgba(52,152,219,0.3)]">
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
                  <span v-else class="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white/90 bg-white/20">
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
      <div class="max-h-[70vh] overflow-y-auto">
        <PromptDetailViewer v-if="selectedPrompt" :name="selectedPrompt.name" :positive="selectedPrompt.positive"
          :negative="selectedPrompt.negative" :parameters="selectedPrompt.parameters"
          :preview-data="selectedPrompt.previewData" :show-image="false" :show-actions="true" :show-delete="true"
          @copy="handleCopy" @delete="deletePrompt(selectedPrompt.id)" />
      </div>
    </n-modal>

    <!-- 编辑/新建弹窗 -->
    <n-modal v-model:show="showEditModal" preset="card" style="width: 672px; max-width: 95vw" :mask-closable="false"
      :closable="false" class="prompt-edit-modal">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-lg font-bold text-foreground">
            {{ isCreating ? '新建提示词' : '编辑提示词' }}
          </h2>
          <n-button quaternary circle size="small" @click="closeEditModal">
            <template #icon>
              <X class="w-5 h-5" />
            </template>
          </n-button>
        </div>
      </template>

      <!-- 表单内容 -->
      <div class="max-h-[60vh] overflow-y-auto p-2 space-y-5">
        <!-- 名称 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            提示词名称
          </label>
          <n-input v-model:value="editForm.name" placeholder="输入提示词名称..." />
        </div>

        <!-- 图片上传 -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">
            预览图片
          </label>
          <div class="flex items-center gap-4">
            <div v-if="editForm.previewData || editForm.imageFile"
              class="w-24 h-24 rounded-lg overflow-hidden border border-border">
              <img v-if="editForm.imageFile" :src="URL.createObjectURL(editForm.imageFile)"
                class="w-full h-full object-cover" />
              <img v-else-if="editForm.previewData" :src="editForm.previewData" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1">
              <n-upload accept="image/*" :show-file-list="false" @change="handleImageSelect">
                <n-button>
                  <template #icon>
                    <ImageIcon class="w-4 h-4" />
                  </template>
                  {{ editForm.previewData || editForm.imageFile ? '更换图片' : '选择图片' }}
                </n-button>
              </n-upload>
              <p class="text-xs text-muted-foreground mt-2">
                支持 PNG、JPG、WebP 格式，图片将被压缩后存储
              </p>
            </div>
          </div>
        </div>

        <!-- 正向提示词 -->
        <div>
          <label class="text-sm font-bold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            正向提示词
          </label>
          <n-input v-model:value="editForm.positive" type="textarea" :rows="5" placeholder="输入正向提示词..." />
        </div>

        <!-- 负向提示词 -->
        <div>
          <label class="text-sm font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            负向提示词
          </label>
          <n-input v-model:value="editForm.negative" type="textarea" :rows="4" placeholder="输入负向提示词..." />
        </div>
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
              {{ isCreating ? '创建' : '保存' }}
            </n-button>
          </div>
        </div>
      </template>
    </n-modal>
  </div>
</template>
