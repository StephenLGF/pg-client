<template>
  <div class="header-content">
    <span class="header-title">PG Client</span>
    <el-tag type="success" size="small">{{ activeConnection?.name || 'Local' }}</el-tag>
    <el-button size="small" text style="color: #ccc; margin-left: auto" @click="$emit('disconnect')">
      断开连接
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { useConnections } from '../../composables/useConnections'

const { activeConnection } = useConnections()

defineEmits<{
  disconnect: []
}>()
</script>

<style scoped>
.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}
</style>
