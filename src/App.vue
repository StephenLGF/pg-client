<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  document.documentElement.classList.add('dark')
})
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
  background: #1e1e1e;
  color: #ccc;
}

/* Dark scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1e1e1e;
}

::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #777;
}

::-webkit-scrollbar-corner {
  background: #1e1e1e;
}

/* Dark overrides for things Element Plus dark doesn't cover */
.el-dialog {
  --el-dialog-bg-color: #2d2d2d;
}

.el-dialog__title {
  color: #ccc;
}

.el-form-item__label {
  color: #ccc;
}

.el-tag--info {
  --el-tag-bg-color: #3c3c3c;
  --el-tag-border-color: #555;
  --el-tag-text-color: #aaa;
}
</style>
