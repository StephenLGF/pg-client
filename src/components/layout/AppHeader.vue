<template>
  <div class="header-content">
    <span class="header-title">PG Client</span>
    <el-tag type="success" size="small">{{ activeConnection?.name || 'Local' }}</el-tag>
    <div class="header-actions">
      <el-dropdown trigger="click" @command="onThemeChange">
        <el-button size="small" text>
          <el-icon><component :is="themeIcon" /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="light" :class="{ active: theme === 'light' }">
              <el-icon><Sunny /></el-icon> 浅色
            </el-dropdown-item>
            <el-dropdown-item command="dark" :class="{ active: theme === 'dark' }">
              <el-icon><Moon /></el-icon> 深色
            </el-dropdown-item>
            <el-dropdown-item command="auto" :class="{ active: theme === 'auto' }">
              <el-icon><Monitor /></el-icon> 跟随系统
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button size="small" text @click="$emit('disconnect')">
        断开连接
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Sunny, Moon, Monitor } from '@element-plus/icons-vue'
import { useConnections } from '../../composables/useConnections'
import { useTheme, type Theme } from '../../composables/useTheme'

const { activeConnection } = useConnections()
const { theme } = useTheme()

const themeIcon = computed(() => {
  if (theme.value === 'light') return Sunny
  if (theme.value === 'dark') return Moon
  return Monitor
})

function onThemeChange(cmd: Theme) {
  theme.value = cmd
}

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

.header-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-dropdown-menu__item.active) {
  color: var(--el-color-primary);
  font-weight: 600;
}
</style>
