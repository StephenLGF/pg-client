<template>
  <TableData :schema-name="schema" :table-name="table" />
</template>

<script setup lang="ts">
import TableData from '../components/browser/TableData.vue'

defineProps<{
  schema: string
  table: string
}>()
</script>
