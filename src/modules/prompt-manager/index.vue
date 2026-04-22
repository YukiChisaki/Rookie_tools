<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus, 
  Save, 
  Copy, 
  Trash2, 
  FileText, 
  Search,
  X
} from 'lucide-vue-next'
import { usePromptStore } from '../../stores/prompt'
import type { PromptRecord } from '../../types'

const promptStore = usePromptStore()

const searchQuery = ref('')
const isEditing = ref(false)
const editingPrompt = ref<PromptRecord | null>(null)

const filteredPrompts = computed(() => {
  if (!searchQuery.value.trim()) return promptStore.sortedPrompts
  const query = searchQuery.value.toLowerCase()
  return promptStore.sortedPrompts.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.positive.toLowerCase().includes(query)
  )
})

function createNewPrompt() {
  editingPrompt.value = promptStore.createEmptyPrompt()
  isEditing.value = true
}

function editPrompt(prompt: PromptRecord) {
  editingPrompt.value = { ...prompt }
  isEditing.value = true
}

async function savePrompt() {
  if (!editingPrompt.value) return
  
  if (promptStore.prompts.find(p => p.id === editingPrompt.value!.id)) {
    await promptStore.updatePrompt(editingPrompt.value.id, {
      name: editingPrompt.value.name,
      positive: editingPrompt.value.positive,
      negative: editingPrompt.value.negative,
    })
  } else {
    await promptStore.createPrompt({
      name: editingPrompt.value.name,
      positive: editingPrompt.value.positive,
      negative: editingPrompt.value.negative,
    })
  }
  
  isEditing.value = false
  editingPrompt.value = null
}

function cancelEdit() {
  isEditing.value = false
  editingPrompt.value = null
}

async function deletePrompt(id: string) {
  if (confirm('确定要删除这个提示词吗？')) {
    await promptStore.deletePrompt(id)
    if (editingPrompt.value?.id === id) {
      cancelEdit()
    }
  }
}

function copyPrompt(prompt: PromptRecord, type: 'positive' | 'negative' | 'full') {
  let text = ''
  if (type === 'positive') text = prompt.positive
  else if (type === 'negative') text = prompt.negative
  else text = `正向: ${prompt.positive}\n负向: ${prompt.negative}`
  
  navigator.clipboard.writeText(text)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="h-full flex">
    <!-- Sidebar - Prompt List -->
    <div class="w-80 bg-background-secondary border-r border-white/10 flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-white/10">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-foreground">提示词列表</h2>
          <button
            @click="createNewPrompt"
            class="p-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索提示词..."
            class="input-field pl-10 text-sm"
          />
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        <div
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          @click="editPrompt(prompt)"
          :class="[
            'p-3 rounded-lg cursor-pointer transition-colors',
            editingPrompt?.id === prompt.id
              ? 'bg-primary/20 border border-primary/30'
              : 'hover:bg-background-tertiary border border-transparent'
          ]"
        >
          <div class="flex items-start justify-between mb-1">
            <h3 class="font-medium text-foreground truncate flex-1">{{ prompt.name }}</h3>
            <button
              @click.stop="deletePrompt(prompt.id)"
              class="p-1 text-foreground-tertiary hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-xs text-foreground-secondary line-clamp-2 mb-1">
            {{ prompt.positive || '无正向提示词' }}
          </p>
          <div class="flex items-center gap-2 text-xs text-foreground-tertiary">
            <span>{{ formatDate(prompt.updatedAt) }}</span>
            <span v-if="prompt.source === 'parsed'" class="px-1.5 py-0.5 bg-primary/20 text-primary rounded">
              解析
            </span>
          </div>
        </div>

        <div v-if="filteredPrompts.length === 0" class="text-center py-8 text-foreground-tertiary">
          <FileText class="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p class="text-sm">暂无提示词</p>
          <button
            @click="createNewPrompt"
            class="text-primary hover:underline text-sm mt-2"
          >
            创建新的提示词
          </button>
        </div>
      </div>
    </div>

    <!-- Main - Editor -->
    <div class="flex-1 flex flex-col p-6 overflow-hidden">
      <div v-if="!isEditing" class="flex-1 flex flex-col items-center justify-center text-foreground-tertiary">
        <FileText class="w-16 h-16 mb-4 opacity-30" />
        <p>选择左侧提示词进行编辑，或创建新的提示词</p>
        <button
          @click="createNewPrompt"
          class="btn-primary mt-4 flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          新建提示词
        </button>
      </div>

      <template v-else-if="editingPrompt">
        <!-- Editor Header -->
        <div class="flex items-center justify-between mb-4">
          <input
            v-model="editingPrompt.name"
            type="text"
            class="text-xl font-semibold bg-transparent border-none outline-none text-foreground placeholder:text-foreground-tertiary"
            placeholder="输入提示词名称..."
          />
          <div class="flex gap-2">
            <button
              @click="cancelEdit"
              class="btn-secondary text-sm"
            >
              取消
            </button>
            <button
              @click="savePrompt"
              class="btn-primary text-sm flex items-center gap-2"
            >
              <Save class="w-4 h-4" />
              保存
            </button>
          </div>
        </div>

        <!-- Positive Prompt -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-success">正向提示词</label>
            <button
              @click="copyPrompt(editingPrompt, 'positive')"
              class="p-1.5 text-foreground-tertiary hover:text-foreground hover:bg-white/5 rounded transition-colors"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <textarea
            v-model="editingPrompt.positive"
            rows="4"
            class="input-field resize-none font-mono text-sm"
            placeholder="输入正向提示词..."
          ></textarea>
        </div>

        <!-- Negative Prompt -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-error">负向提示词</label>
            <button
              @click="copyPrompt(editingPrompt, 'negative')"
              class="p-1.5 text-foreground-tertiary hover:text-foreground hover:bg-white/5 rounded transition-colors"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <textarea
            v-model="editingPrompt.negative"
            rows="3"
            class="input-field resize-none font-mono text-sm"
            placeholder="输入负向提示词..."
          ></textarea>
        </div>

        <!-- Quick Actions -->
        <div class="mt-auto pt-4 border-t border-white/10">
          <div class="flex items-center justify-between">
            <span class="text-xs text-foreground-tertiary">
              创建时间: {{ formatDate(editingPrompt.createdAt) }}
            </span>
            <button
              @click="copyPrompt(editingPrompt, 'full')"
              class="btn-secondary text-sm flex items-center gap-2"
            >
              <Copy class="w-4 h-4" />
              复制全部
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
