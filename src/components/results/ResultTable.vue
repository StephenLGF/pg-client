<template>
  <div class="result-table">
    <el-table
      :data="result.rows"
      stripe
      border
      size="small"
      max-height="400"
      style="width: 100%"
    >
      <el-table-column
        v-for="col in result.columns"
        :key="col.name"
        :prop="col.name"
        :label="col.name"
        :min-width="120"
        show-overflow-tooltip
      />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { QueryResult } from '../../types'

defineProps<{
  result: QueryResult
}>()
</script>

<style scoped>
.result-table {
  margin-top: 8px;
  flex-shrink: 0;
}
</style>
