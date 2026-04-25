<template>
  <div class="h-full w-full flex justify-center items-center">
    <!-- -->
  <n-empty size="large" description="建设中...">
    <template #extra>
      <n-button>
        {{ text }}
      </n-button>
    </template>
  </n-empty>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const text = ref("看看别的");
</script>
