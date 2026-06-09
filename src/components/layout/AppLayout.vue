<template>
  <el-container class="app-container">
    <el-header class="app-header" height="48px">
      <AppHeader @disconnect="onDisconnect" />
    </el-header>
    <el-container class="app-body">
      <div class="app-sidebar" :style="{ width: sidebarWidth + 'px' }">
        <AppSidebar @select-table="onSelectTable" />
      </div>
      <div class="sidebar-resizer" @mousedown="startResize"></div>
      <el-main class="app-main">
        <el-tabs
          v-model="activeTab"
          type="card"
          closable
          @tab-change="onTabChange"
          @tab-remove="onTabRemove"
        >
          <!-- SQL 编辑器 Tab - 第一个且不可关闭 -->
          <el-tab-pane name="query" label="SQL 编辑器">
            <template #label>
              <span class="tab-label">
                <el-icon class="icon-editor"><Edit /></el-icon>
                SQL 编辑器
              </span>
            </template>
            <keep-alive>
              <QueryView />
            </keep-alive>
          </el-tab-pane>

          <!-- 动态 table tabs -->
          <el-tab-pane
            v-for="tab in tableTabs"
            :key="tab.key"
            :name="tab.key"
            :label="tab.label"
          >
            <template #label>
              <span class="tab-label">
                <el-icon class="icon-table"><Grid /></el-icon>
                {{ tab.label }}
              </span>
            </template>
            <keep-alive>
              <TableData :schema-name="tab.schemaName" :table-name="tab.tableName" :key="tab.key" />
            </keep-alive>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Grid, Edit } from '@element-plus/icons-vue'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import TableData from '../browser/TableData.vue'
import QueryView from '../../views/Query.vue'
import { useConnections } from '../../composables/useConnections'
import { useDatabase } from '../../composables/useDatabase'

const router = useRouter()
const route = useRoute()
const { disconnect, activeConnection } = useConnections()
const { activeDatabase } = useDatabase()
const sidebarWidth = ref(300)

interface TableTab {
  key: string
  label: string
  connectionId: string
  database: string
  schemaName: string
  tableName: string
}

const tableTabs = ref<TableTab[]>([])
const activeTab = ref<string>('query')
const DEFAULT_SCHEMA = 'public'

// 从路由生成 tab key
function getTabKey(connectionId: string, database: string, schema: string, table: string): string {
  return `${connectionId}/${database}/${schema}/${table}`
}

function formatTableLabel(schema: string, table: string): string {
  return schema === DEFAULT_SCHEMA ? table : `${schema}.${table}`
}

function pushQueryRoute() {
  if (!route.params.connectionId || !route.params.database) return

  if (route.params.schema && route.params.schema !== DEFAULT_SCHEMA) {
    router.push({
      name: 'schema',
      params: {
        connectionId: route.params.connectionId,
        database: route.params.database,
        schema: route.params.schema,
      },
    })
    return
  }

  router.push({
    name: 'database',
    params: {
      connectionId: route.params.connectionId,
      database: route.params.database,
    },
  })
}

// 监听路由变化，同步 tabs
watch(
  () => route.params,
  (params) => {
    const connectionId = params.connectionId as string
    const database = params.database as string
    const schema = params.schema as string
    const table = params.table as string

    if (connectionId && database && schema && table) {
      const key = getTabKey(connectionId, database, schema, table)
      activeTab.value = key

      // 检查是否已存在该 tab
      const existingTab = tableTabs.value.find((t) => t.key === key)
      if (!existingTab) {
        tableTabs.value.push({
          key,
          label: formatTableLabel(schema, table),
          connectionId,
          database,
          schemaName: schema,
          tableName: table,
        })
      }
    } else {
      // 没有 table 参数，切换到 SQL 编辑器
      activeTab.value = 'query'
    }
  },
  { immediate: true, deep: true }
)

function onSelectTable(payload: { schemaName: string; tableName: string }) {
  if (activeConnection.value && activeDatabase.value) {
    const { schemaName, tableName } = payload
    const connectionId = activeConnection.value.id
    const database = activeDatabase.value
    const key = getTabKey(connectionId, database, schemaName, tableName)

    // 检查是否已存在该 tab
    const existingTab = tableTabs.value.find((t) => t.key === key)
    if (existingTab) {
      activeTab.value = key
    } else {
      tableTabs.value.push({
        key,
        label: formatTableLabel(schemaName, tableName),
        connectionId,
        database,
        schemaName,
        tableName,
      })
      activeTab.value = key
    }

    // 更新路由
    router.push({
      name: 'table',
      params: {
        connectionId,
        database,
        schema: schemaName,
        table: tableName,
      },
    })
  }
}

function onTabChange(tabKey: string) {
  if (tabKey === 'query') {
    // 切换到 SQL 编辑器，回退到当前 schema 或 database 视图
    pushQueryRoute()
    return
  }

  const tab = tableTabs.value.find((t) => t.key === tabKey)
  if (tab) {
    router.push({
      name: 'table',
      params: {
        connectionId: tab.connectionId,
        database: tab.database,
        schema: tab.schemaName,
        table: tab.tableName,
      },
    })
  }
}

function onTabRemove(tabKey: string) {
  const index = tableTabs.value.findIndex((t) => t.key === tabKey)
  if (index !== -1) {
    tableTabs.value.splice(index, 1)

    // 如果删除的是当前激活的 tab，切换到其他 tab 或 SQL 编辑器
    if (activeTab.value === tabKey) {
      if (tableTabs.value.length > 0) {
        const newIndex = Math.min(index, tableTabs.value.length - 1)
        activeTab.value = tableTabs.value[newIndex].key
        const tab = tableTabs.value[newIndex]
        router.push({
          name: 'table',
          params: {
            connectionId: tab.connectionId,
            database: tab.database,
            schema: tab.schemaName,
            table: tab.tableName,
          },
        })
      } else {
        // 回退到 SQL 编辑器
        activeTab.value = 'query'
        pushQueryRoute()
      }
    }
  }
}

function onDisconnect() {
  disconnect()
  tableTabs.value = []
  activeTab.value = 'query'
  router.push('/')
}

function startResize(e: MouseEvent) {
  const startX = e.clientX
  const startWidth = sidebarWidth.value
  function onMouseMove(ev: MouseEvent) {
    const newWidth = startWidth + ev.clientX - startX
    if (newWidth >= 160 && newWidth <= 600) {
      sidebarWidth.value = newWidth
    }
  }
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<style>
.app-container {
  height: 100%;
}

.app-header {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color);
}

.app-body {
  height: calc(100% - 48px);
}

.app-sidebar {
  background: var(--el-bg-color-page);
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar-resizer {
  width: 4px;
  cursor: col-resize;
  background: var(--el-border-color);
  flex-shrink: 0;
}

.sidebar-resizer:hover {
  background: var(--el-color-primary);
}

.app-main {
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.app-main > .el-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.app-main > .el-tabs > .el-tabs__header {
  margin: 0;
  background: var(--el-bg-color-page);
  flex-shrink: 0;
}

.app-main > .el-tabs > .el-tabs__content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0;
  min-height: 0;
}

.app-main > .el-tabs > .el-tabs__content > .el-tab-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-editor {
  font-size: 14px;
  margin-right: 2px;
}

.icon-table {
  font-size: 14px;
}
</style>
