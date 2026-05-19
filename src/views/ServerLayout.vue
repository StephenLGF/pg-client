<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import { useConnections } from '../composables/useConnections'
import { useDatabase } from '../composables/useDatabase'

const route = useRoute()
const { ensureConnection } = useConnections()
const { fetchDatabases, fetchSchemas, fetchTables } = useDatabase()

watch(
  [() => route.params.connectionId, () => route.params.database],
  async ([connectionId, database]) => {
    // 确保连接（如果没有 connectionId 会清空 activeConnection）
    const conn = await ensureConnection(connectionId as string | undefined)

    // 获取数据库列表（如果没有 connectionId 会清空 databases）
    await fetchDatabases(conn?.id)

    // 获取 schema 下拉选项（默认使用 public）
    await fetchSchemas(conn?.id, database as string | undefined)
  },
  { immediate: true }
)

watch(
  [() => route.params.connectionId, () => route.params.database, () => route.params.schema],
  async ([connectionId, database, schema]) => {
    const conn = await ensureConnection(connectionId as string | undefined)
    await fetchTables(conn?.id, database as string | undefined, schema as string | undefined)
  },
  { immediate: true }
)
</script>
