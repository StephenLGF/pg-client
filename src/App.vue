<template>
  <router-view />
</template>

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
