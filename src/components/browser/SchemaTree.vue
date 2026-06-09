<template>
  <div class="schema-browser">
    <div class="col" :style="{ width: leftColWidth + 'px' }">
      <div class="col-header">
        <el-input
          v-model="dbSearch"
          size="small"
          placeholder="搜索数据库..."
          :prefix-icon="Search"
          clearable
        />
      </div>
      <div class="col-list">
        <div
          v-for="db in filteredDatabases"
          :key="db"
          class="col-item"
          :class="{ active: activeDatabase === db }"
          @click="onSelectDatabase(db)"
        >
          <el-icon class="item-icon"><Coin /></el-icon>
          <span class="item-label">{{ db }}</span>
        </div>
        <div v-if="loading && filteredDatabases.length === 0" class="col-empty">加载中...</div>
        <div v-if="!loading && filteredDatabases.length === 0" class="col-empty">暂无数据库</div>
      </div>
    </div>
    <div class="col-resizer" @mousedown="startResize"></div>
    <div class="col">
      <div class="col-header table-col-header">
        <el-select
          :model-value="currentSchema"
          size="small"
          class="schema-select"
          :disabled="!activeDatabase"
          @change="onSelectSchema"
        >
          <el-option
            v-for="schema in schemaOptions"
            :key="schema"
            :label="schema"
            :value="schema"
          />
        </el-select>
        <el-input
          v-model="tableSearch"
          size="small"
          class="table-search"
          placeholder="搜索表..."
          :prefix-icon="Search"
          clearable
          :disabled="!activeDatabase"
        />
      </div>
      <div class="col-list">
        <div
          v-for="table in filteredTables"
          :key="`${table.table_schema}.${table.table_name}`"
          class="col-item"
          :class="{ active: activeTable === table.table_name }"
          @click="onSelectTable(table.table_schema, table.table_name)"
        >
          <el-icon class="item-icon"><Grid /></el-icon>
          <span class="item-label">{{ table.table_name }}</span>
        </div>
        <div v-if="activeDatabase && loading && filteredTables.length === 0" class="col-empty">加载中...</div>
        <div v-if="activeDatabase && !loading && filteredTables.length === 0" class="col-empty">暂无表</div>
        <div v-if="!activeDatabase" class="col-empty">请先选择数据库</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, Coin, Grid } from '@element-plus/icons-vue'
import { useDatabase } from '../../composables/useDatabase'
import { useConnections } from '../../composables/useConnections'

const emit = defineEmits<{
  'select-table': [payload: { schemaName: string; tableName: string }]
}>()

const router = useRouter()
const route = useRoute()
const { activeConnection } = useConnections()
const { databases, schemas, tables, loading, activeDatabase, activeSchema, selectedDatabase } = useDatabase()

const activeTable = computed(() => route.params.table as string)
const DEFAULT_SCHEMA = 'public'

const dbSearch = ref('')
const tableSearch = ref('')
const leftColWidth = ref(160)
const currentSchema = computed(() => activeSchema.value || DEFAULT_SCHEMA)

const filteredDatabases = computed(() => {
  if (!dbSearch.value) return databases.value
  const keyword = dbSearch.value.toLowerCase()
  return databases.value.filter((db) => db.toLowerCase().includes(keyword))
})

const filteredTables = computed(() => {
  if (!tableSearch.value) return tables.value
  const keyword = tableSearch.value.toLowerCase()
  return tables.value.filter((t) => t.table_name.toLowerCase().includes(keyword))
})

const schemaOptions = computed(() => {
  const options = schemas.value.length > 0 ? [...schemas.value] : [DEFAULT_SCHEMA]
  if (!options.includes(DEFAULT_SCHEMA)) {
    options.unshift(DEFAULT_SCHEMA)
  }
  if (currentSchema.value && !options.includes(currentSchema.value)) {
    options.push(currentSchema.value)
  }
  return options
})

function resizeColumn(e: MouseEvent, widthRef: typeof leftColWidth, min = 80, max = 400) {
  const startX = e.clientX
  const startWidth = widthRef.value
  function onMouseMove(ev: MouseEvent) {
    const newWidth = startWidth + ev.clientX - startX
    if (newWidth >= min && newWidth <= max) {
      widthRef.value = newWidth
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

function startResize(e: MouseEvent) {
  resizeColumn(e, leftColWidth)
}

function onSelectDatabase(db: string) {
  selectedDatabase.value = db
  tableSearch.value = ''
  if (activeConnection.value) {
    router.push({
      name: 'database',
      params: { connectionId: activeConnection.value.id, database: db },
    })
  }
}

function onSelectSchema(schema: string) {
  if (!activeConnection.value || !activeDatabase.value) return

  tableSearch.value = ''
  if (schema === DEFAULT_SCHEMA) {
    router.push({
      name: 'database',
      params: {
        connectionId: activeConnection.value.id,
        database: activeDatabase.value,
      },
    })
    return
  }

  router.push({
    name: 'schema',
    params: {
      connectionId: activeConnection.value.id,
      database: activeDatabase.value,
      schema,
    },
  })
}

function onSelectTable(schemaName: string, tableName: string) {
  emit('select-table', { schemaName, tableName })
  if (activeConnection.value && activeDatabase.value) {
    router.push({
      name: 'table',
      params: {
        connectionId: activeConnection.value.id,
        database: activeDatabase.value,
        schema: schemaName,
        table: tableName,
      },
    })
  }
}

// databases are fetched by ServerLayout on mount
</script>

<style scoped>
.schema-browser {
  height: 100%;
  display: flex;
}

.col {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.col:last-child {
  flex: 1;
}

.col-resizer {
  width: 4px;
  cursor: col-resize;
  background: var(--el-border-color);
  flex-shrink: 0;
}

.col-resizer:hover {
  background: var(--el-color-primary);
}

.col-header {
  padding: 6px 8px;
  flex-shrink: 0;
}

.table-col-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.schema-select,
.table-search {
  width: 100%;
}

.col-list {
  flex: 1;
  overflow-y: auto;
}

.col-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-item:hover {
  background: var(--el-fill-color-light);
}

.col-item.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.item-icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.item-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
