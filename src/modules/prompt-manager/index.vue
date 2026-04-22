<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus, 
  Save, 
  Copy, 
  Trash2, 
  FileText, 
  Search,
  X,
  PenLine
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
    <div class="w-80 bg-card border-r border-border flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-border">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold text-foreground">提示词列表</h2>
          <button
            @click="createNewPrompt"
            class="w-8 h-8 flex items-center justify-center text-white rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            style="background: linear-gradient(135deg, #3498db 0%, #5dade2 100%); box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>
        <div class="relative">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            'p-3 rounded-xl cursor-pointer transition-all duration-200 group',
            editingPrompt?.id === prompt.id
              ? 'border shadow-sm'
              : 'hover:bg-muted border border-transparent'
          ]"
          :style="editingPrompt?.id === prompt.id ? 'background: linear-gradient(135deg, rgba(52,152,219,0.08) 0%, rgba(243,104,224,0.04) 100%); border-color: rgba(52,152,219,0.2);' : ''"
        >
          <div class="flex items-start justify-between mb-1.5">
            <h3 class="font-semibold text-foreground truncate flex-1 text-sm">{{ prompt.name }}</h3>
            <button
              @click.stop="deletePrompt(prompt.id)"
              class="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-[rgba(239,68,68,0.08)]"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
            {{ prompt.positive || '无正向提示词' }}
          </p>
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{{ formatDate(prompt.updatedAt) }}</span>
            <span v-if="prompt.source === 'parsed'" class="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-[#3498db] bg-[rgba(52,152,219,0.1)]">
              解析
            </span>
          </div>
        </div>

        <div v-if="filteredPrompts.length === 0" class="text-center py-10">
          <div class="w-12 h-12 rounded-xl bg-[rgba(52,152,219,0.06)] flex items-center justify-center mx-auto mb-3">
            <FileText class="w-6 h-6 text-[#3498db]/40" />
          </div>
          <p class="text-sm text-muted-foreground font-medium">暂无提示词</p>
          <button
            @click="createNewPrompt"
            class="text-[#3498db] hover:text-[#2980b9] text-sm mt-2 font-medium transition-colors"
          >
            创建新的提示词
          </button>
        </div>
      </div>
    </div>

    <!-- Main - Editor -->
    <div class="flex-1 flex flex-col p-6 overflow-hidden">
      <div v-if="!isEditing" class="flex-1 flex flex-col items-center justify-center text-muted-foreground">
        <div class="w-20 h-20 rounded-2xl bg-[rgba(52,152,219,0.06)] flex items-center justify-center mb-5">
          <PenLine class="w-10 h-10 text-[#3498db]/30" />
        </div>
        <p class="font-medium">选择左侧提示词进行编辑，或创建新的提示词</p>
        <button
          @click="createNewPrompt"
          class="btn-primary mt-5 flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          新建提示词
        </button>
      </div>

      <template v-else-if="editingPrompt">
        <!-- Editor Header -->
        <div class="flex items-center justify-between mb-5">
          <input
            v-model="editingPrompt.name"
            type="text"
            class="text-xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground flex-1 mr-4"
            placeholder="输入提示词名称..."
          />
          <div class="flex gap-2">
            <button
              @click="cancelEdit"
              class="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
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
        <div class="mb-5">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-bold text-[#22c55e] flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
              正向提示词
            </label>
            <button
              @click="copyPrompt(editingPrompt, 'positive')"
              class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <textarea
            v-model="editingPrompt.positive"
            rows="5"
            class="input-field resize-none font-mono text-sm leading-relaxed"
            placeholder="输入正向提示词..."
          ></textarea>
        </div>

        <!-- Negative Prompt -->
        <div class="mb-5">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-bold text-[#ef4444] flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
              负向提示词
            </label>
            <button
              @click="copyPrompt(editingPrompt, 'negative')"
              class="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Copy class="w-4 h-4" />
            </button>
          </div>
          <textarea
            v-model="editingPrompt.negative"
            rows="4"
            class="input-field resize-none font-mono text-sm leading-relaxed"
            placeholder="输入负向提示词..."
          ></textarea>
        </div>

        <!-- Quick Actions -->
        <div class="mt-auto pt-4 border-t border-border">
          <div class="flex items-center justify-between">
            <span class="text-xs text-muted-foreground">
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
