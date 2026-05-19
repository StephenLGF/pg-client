<template>
  <div class="result-status">
    <span>{{ result.rowCount }} rows</span>
    <span class="separator">|</span>
    <span>{{ result.duration }}ms</span>
    <span class="separator">|</span>
    <span>{{ result.command }}</span>
  </div>
</template>

<script setup lang="ts">
import type { QueryResult } from '../../types'

defineProps<{
  result: QueryResult
}>()
</script>

<style scoped>
.result-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;
  color: #888;
}

.separator {
  color: #555;
}
</style>
