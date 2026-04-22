<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown, Copy, Check } from 'lucide-vue-next';

interface Props {
  metadata: Record<string, unknown>;
}

const props = defineProps<Props>();

const isExpanded = ref(false);
const copied = ref(false);

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

async function copyMetadata() {
  const json = JSON.stringify(props.metadata, null, 2);
  await navigator.clipboard.writeText(json);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.length > 200 ? value.substring(0, 200) + '...' : value;
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value).substring(0, 200);
  }
  return String(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
</script>

<template>
  <div class="mt-6 border border-border rounded-xl overflow-hidden bg-card">
    <!-- 头部 -->
    <button
      @click="toggleExpand"
      class="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold text-foreground">完整元数据</span>
        <span class="text-xs text-muted-foreground">(JSON)</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click.stop="copyMetadata"
          class="p-1.5 rounded-lg hover:bg-muted transition-colors"
          title="复制 JSON"
        >
          <Check v-if="copied" class="w-4 h-4 text-green-500" />
          <Copy v-else class="w-4 h-4 text-muted-foreground" />
        </button>
        <ChevronDown
          class="w-5 h-5 text-muted-foreground transition-transform duration-200"
          :class="isExpanded ? 'rotate-180' : ''"
        />
      </div>
    </button>

    <!-- 内容 -->
    <div
      v-show="isExpanded"
      class="border-t border-border bg-muted/30 max-h-96 overflow-auto"
    >
      <pre class="p-4 text-xs font-mono text-foreground whitespace-pre-wrap break-all">{{
        JSON.stringify(metadata, null, 2)
      }}</pre>
    </div>
  </div>
</template>
