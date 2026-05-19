<template>
  <div class="sidebar">
    <SchemaTree @select-table="$emit('select-table', $event)" />
  </div>
</template>

<script setup lang="ts">
import SchemaTree from '../browser/SchemaTree.vue'

defineEmits<{
  'select-table': [payload: { schemaName: string; tableName: string }]
}>()
</script>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
