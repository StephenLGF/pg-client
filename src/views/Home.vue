<template>
  <ConnectionManager @connect="onConnect" />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import ConnectionManager from '../components/connections/ConnectionManager.vue'
import { useConnections } from '../composables/useConnections'
import type { DbConnection } from '../types'

const router = useRouter()
const { selectConnection } = useConnections()

function onConnect(conn: DbConnection) {
  selectConnection(conn)
  router.push({ name: 'server', params: { connectionId: conn.id } })
}
</script>
