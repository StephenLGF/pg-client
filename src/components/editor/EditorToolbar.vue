<template>
  <div class="editor-toolbar">
    <el-button
      type="primary"
      :icon="CaretRight"
      :loading="loading"
      size="small"
      @click="$emit('run')"
    >
      Run (Ctrl+Enter)
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { CaretRight } from '@element-plus/icons-vue'

defineProps<{
  loading: boolean
}>()

defineEmits<{
  run: []
}>()
</script>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}
</style>
