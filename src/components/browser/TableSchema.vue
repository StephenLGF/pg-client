<template>
  <div class="table-schema">
    <el-table :data="columns" stripe border size="small">
      <el-table-column prop="column_name" label="Column" :min-width="140" />
      <el-table-column prop="data_type" label="Type" :min-width="120" />
      <el-table-column prop="is_nullable" label="Nullable" width="80" />
      <el-table-column prop="column_default" label="Default" :min-width="120" show-overflow-tooltip />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDatabase } from '../../composables/useDatabase'
import { useConnections } from '../../composables/useConnections'
import type { ColumnInfo } from '../../types'

const props = defineProps<{
  schemaName: string
  tableName: string
}>()

const route = useRoute()
const { fetchColumns } = useDatabase()
const { ensureConnection } = useConnections()
const columns = ref<ColumnInfo[]>([])

async function load() {
  const connectionId = route.params.connectionId as string
  const database = route.params.database as string
  if (!connectionId || !database) return

  const conn = await ensureConnection(connectionId)
  if (!conn) return

  columns.value = await fetchColumns(conn.id, database, props.schemaName, props.tableName)
}

watch(() => [props.schemaName, props.tableName], load)
onMounted(load)
</script>
