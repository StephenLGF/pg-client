<template>
  <div class="table-data">
    <div class="table-toolbar">
      <span class="table-name">{{ displayTableName }}</span>
      <span v-if="total !== null" class="row-count">共 {{ total }} 行</span>
      <el-button size="small" :icon="Refresh" @click="loadData" :loading="loading" />
    </div>
    <el-table
      v-loading="loading"
      :data="rows"
      stripe
      border
      size="small"
      style="width: 100%; flex: 1"
      @sort-change="onSortChange"
    >
      <el-table-column
        v-for="col in columns"
        :key="col"
        :prop="col"
        :label="col"
        :min-width="120"
        :sortable="'custom'"
      >
        <template #default="{ row }">
          <div class="cell-content" :title="getCellTooltip(row[col])">
            {{ formatCellValue(row[col]) }}
          </div>
        </template>
        <template #header>
          <div class="column-header">
            <span class="column-title">{{ col }}</span>
            <div class="header-actions">
              <el-popover
                placement="bottom"
                :width="280"
                trigger="manual"
                :visible="searchPopovers[col]"
                @update:visible="(val: boolean) => searchPopovers[col] = val"
              >
                <template #reference>
                  <el-icon
                    class="search-icon"
                    :class="{ active: searchFilters[col] }"
                    @click.stop="toggleSearchPopover(col)"
                  >
                    <Search />
                  </el-icon>
                </template>
                <div class="search-popover" @click.stop>
                  <el-input
                    v-model="searchFilters[col]"
                    size="small"
                    placeholder="搜索..."
                    clearable
                    @keyup.enter="applySearch(col)"
                  />
                  <div class="search-options">
                    <el-switch
                      v-model="fuzzySearch[col]"
                      size="small"
                      active-text="模糊"
                      inactive-text="精确"
                    />
                    <el-button size="small" type="primary" @click="applySearch(col)">搜索</el-button>
                  </div>
                </div>
              </el-popover>
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="total !== null && total > 0" class="table-pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next"
        small
        @size-change="onSizeChange"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Refresh, Search } from '@element-plus/icons-vue'
import { useDatabase } from '../../composables/useDatabase'
import { useConnections } from '../../composables/useConnections'

const props = defineProps<{
  schemaName: string
  tableName: string
}>()

const DEFAULT_SCHEMA = 'public'
const displayTableName = computed(() => (
  props.schemaName === DEFAULT_SCHEMA ? props.tableName : `${props.schemaName}.${props.tableName}`
))

const route = useRoute()
const router = useRouter()
const { fetchData } = useDatabase()
const { ensureConnection } = useConnections()

const loading = ref(false)
const rows = ref<any[]>([])
const columns = ref<string[]>([])
const total = ref<number | null>(null)
const page = ref(1)
const pageSize = ref(20)
const sortColumn = ref<string>('')
const sortOrder = ref<'ASC' | 'DESC' | ''>('')

// 搜索相关状态
const searchFilters = reactive<Record<string, string>>({})
const fuzzySearch = reactive<Record<string, boolean>>({})
const searchPopovers = reactive<Record<string, boolean>>({})
const activeSearches = reactive<Record<string, { value: string; fuzzy: boolean }>>({})

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`
}

async function loadData() {
  const connectionId = route.params.connectionId as string
  const database = route.params.database as string
  if (!connectionId || !database) return

  const conn = await ensureConnection(connectionId)
  if (!conn) return

  loading.value = true
  try {
    // 构建搜索条件
    const searchConditions: string[] = []
    for (const col in activeSearches) {
      const { value, fuzzy } = activeSearches[col]
      if (value) {
        const column = quoteIdentifier(col)
        if (fuzzy) {
          searchConditions.push(`${column}::text ILIKE '%${value.replace(/'/g, "''")}%'`)
        } else {
          searchConditions.push(`${column}::text = '${value.replace(/'/g, "''")}'`)
        }
      }
    }

    // 加载数据
    const dataResult = await fetchData(
      conn.id,
      database,
      props.schemaName,
      props.tableName,
      page.value,
      pageSize.value,
      sortColumn.value,
      sortOrder.value,
      searchConditions
    )

    rows.value = dataResult.data || []
    columns.value = dataResult.columns.length > 0
      ? dataResult.columns
      : dataResult.data.length > 0
        ? Object.keys(dataResult.data[0])
        : []
    total.value = dataResult.count ?? null
  } finally {
    loading.value = false
  }
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function getCellTooltip(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    try {
      // JSON 格式化，支持换行
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function onPageChange(p: number) {
  page.value = p
  loadData()
}

function onSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  loadData()
}

function onSortChange({ column, prop, order }: { column: any; prop: string; order: string | null }) {
  sortColumn.value = prop || ''
  sortOrder.value = order === 'ascending' ? 'ASC' : order === 'descending' ? 'DESC' : ''
  page.value = 1
  loadData()
}

function toggleSearchPopover(column: string) {
  // 关闭其他弹窗
  for (const key in searchPopovers) {
    if (key !== column) {
      searchPopovers[key] = false
    }
  }
  // 切换当前弹窗
  searchPopovers[column] = !searchPopovers[column]
}

function applySearch(column: string) {
  const value = searchFilters[column]
  if (value) {
    activeSearches[column] = { value, fuzzy: fuzzySearch[column] || false }
  } else {
    delete activeSearches[column]
  }
  searchPopovers[column] = false
  page.value = 1
  loadData()
}

// 点击外部关闭弹窗
if (typeof document !== 'undefined') {
  document.addEventListener('click', () => {
    for (const key in searchPopovers) {
      searchPopovers[key] = false
    }
  })
}

watch(
  () => [props.schemaName, props.tableName],
  () => {
    page.value = 1
    sortColumn.value = ''
    sortOrder.value = ''
    // 清空搜索状态
    for (const key in searchFilters) delete searchFilters[key]
    for (const key in fuzzySearch) delete fuzzySearch[key]
    for (const key in activeSearches) delete activeSearches[key]
    loadData()
  },
  { immediate: true }
)
</script>

<style scoped>
.table-data {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-table) {
  flex: 1;
  min-height: 0;

  .el-table__body-wrapper {
    overflow-y: auto;
  }
}

.table-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  flex-shrink: 0;
}

.table-name {
  font-weight: 600;
  font-size: 14px;
}

.row-count {
  font-size: 12px;
  color: #909399;
  flex: 1;
}

.table-pagination {
  padding: 8px 0;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-top: auto;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

:deep(.el-table__header) {
  .el-table__cell {
    .cell {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 0 8px;
    }
  }
}

.column-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.search-icon {
  cursor: pointer;
  color: var(--el-text-color-placeholder);
  padding: 2px;
}

.search-icon:hover {
  color: var(--el-text-color-primary);
}

.search-icon.active {
  color: var(--el-color-primary);
}

.search-popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cell-content {
  white-space: pre-wrap;
  word-break: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  cursor: help;
}

:deep(.el-table__body-wrapper) {
  .el-tooltip__popper {
    max-width: 500px;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.4;
  }
}
</style>
