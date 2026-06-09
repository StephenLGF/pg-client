<template>
  <div class="app-root">
    <div class="global-header">
      <span class="global-title">PG Client</span>
      <div class="global-header-right">
        <el-tag v-if="activeConnection" type="success" size="small">{{ activeConnection.name }}</el-tag>
        <el-button v-if="activeConnection" size="small" text @click="onDisconnect">断开连接</el-button>
        <ThemeSwitcher />
      </div>
    </div>
    <div class="app-content">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useConnections } from './composables/useConnections'
import ThemeSwitcher from './components/ThemeSwitcher.vue'

const router = useRouter()
const { disconnect, activeConnection } = useConnections()

function onDisconnect() {
  disconnect()
  router.push('/')
}
</script>

<style>
html.dark {
  color-scheme: dark;
}

html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Light theme (default) */
html {
  background: #f5f5f5;
  color: #333;
}

/* Dark theme */
html.dark {
  background: #1e1e1e;
  color: #ccc;
}

html,
body {
  background: inherit;
  color: inherit;
}

/* Scrollbar - light */
html ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

html ::-webkit-scrollbar-track {
  background: #f0f0f0;
}

html ::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 4px;
}

html ::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

html ::-webkit-scrollbar-corner {
  background: #f0f0f0;
}

/* Scrollbar - dark */
html.dark ::-webkit-scrollbar-track {
  background: #1e1e1e;
}

html.dark ::-webkit-scrollbar-thumb {
  background: #555;
}

html.dark ::-webkit-scrollbar-thumb:hover {
  background: #777;
}

html.dark ::-webkit-scrollbar-corner {
  background: #1e1e1e;
}

/* Light overrides for things Element Plus doesn't cover */
.el-dialog {
  --el-dialog-bg-color: #ffffff;
}

.el-dialog__title {
  color: #303133;
}

.el-form-item__label {
  color: #606266;
}

.el-tag--info {
  --el-tag-bg-color: #f4f4f5;
  --el-tag-border-color: #e9e9eb;
  --el-tag-text-color: #909399;
}

/* Dark overrides */
html.dark .el-dialog {
  --el-dialog-bg-color: #2d2d2d;
}

html.dark .el-dialog__title {
  color: #ccc;
}

html.dark .el-form-item__label {
  color: #ccc;
}

html.dark .el-tag--info {
  --el-tag-bg-color: #3c3c3c;
  --el-tag-border-color: #555;
  --el-tag-text-color: #aaa;
}
</style>

<style scoped>
.app-root {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.global-header {
  height: 48px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
}

.global-title {
  font-size: 16px;
  font-weight: 600;
}

.global-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
