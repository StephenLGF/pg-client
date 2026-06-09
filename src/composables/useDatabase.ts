import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import type { TableInfo } from '../types'
import { useConnections } from './useConnections'

const databases = ref<string[]>([])
const schemas = ref<string[]>([])
const tables = ref<TableInfo[]>([])
const loading = ref(false)
const selectedDatabase = ref<string | null>(null)
const DEFAULT_SCHEMA = 'public'

export function useDatabase() {
  const route = useRoute()
  const { activeConnection } = useConnections()
  const activeDatabase = computed(() => route.params.database as string || selectedDatabase.value)
  const activeSchema = computed(() => route.params.schema as string || (activeDatabase.value ? DEFAULT_SCHEMA : null))

  function quoteIdentifier(identifier: string) {
    return `"${identifier.replace(/"/g, '""')}"`
  }

  async function fetchDatabases(connectionId: string | undefined) {
    if (!connectionId) {
      databases.value = []
      schemas.value = []
      tables.value = []
      selectedDatabase.value = null
      return
    }
    loading.value = true
    try {
      const res = await fetch(`/api/databases?connectionId=${connectionId}`)
      const data = await res.json()
      databases.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function fetchSchemas(connectionId: string | undefined, database: string | undefined) {
    if (!connectionId || !database) {
      schemas.value = []
      tables.value = []
      return
    }
    loading.value = true
    try {
      const params = new URLSearchParams({ connectionId, database })
      const res = await fetch(`/api/schemas?${params}`)
      const data = await res.json()
      schemas.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function fetchTables(connectionId: string | undefined, database: string | undefined, schema: string | undefined) {
    if (!connectionId || !database) {
      tables.value = []
      return
    }
    const targetSchema = schema || DEFAULT_SCHEMA
    tables.value = []
    loading.value = true
    try {
      const params = new URLSearchParams({ connectionId, database, schema: targetSchema })
      const res = await fetch(`/api/tables?${params}`)
      const data = await res.json()
      tables.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function fetchData(
    connectionId: string,
    database: string,
    schema: string,
    tableName: string,
    page = 1,
    pageSize = 10,
    sortColumn = '',
    sortOrder: 'ASC' | 'DESC' | '' = '',
    searchConditions: string[] = []
  ): Promise<{ data: Record<string, unknown>[]; columns: string[]; count: number }> {
    const offset = (page - 1) * pageSize

    // 构建 WHERE 子句
    let whereClause = ''
    if (searchConditions.length > 0) {
      whereClause = ' WHERE ' + searchConditions.join(' AND ')
    }

    // 构建 ORDER BY 子句
    let orderBy = ''
    if (sortColumn && sortOrder) {
      orderBy = ` ORDER BY ${quoteIdentifier(sortColumn)} ${sortOrder}`
    }

    const qualifiedTable = `${quoteIdentifier(schema)}.${quoteIdentifier(tableName)}`

    const [dataRes, countRes] = await Promise.all([
      fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `SELECT * FROM ${qualifiedTable}${whereClause}${orderBy} LIMIT ${pageSize} OFFSET ${offset}`,
          connectionId,
          database,
        }),
      }),
      fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: `SELECT COUNT(*) AS count FROM ${qualifiedTable}${whereClause}`,
          connectionId,
          database,
        }),
      }),
    ])

    const dataResult = await dataRes.json()
    const countResult = await countRes.json()

    return {
      data: dataResult.rows || [],
      columns: (dataResult.columns || []).map((column: { name: string }) => column.name),
      count: countResult.rows?.[0]?.count ? Number(countResult.rows[0].count) : 0,
    }
  }

  async function fetchColumns(connectionId: string, database: string, schema: string, table: string) {
    const params = new URLSearchParams({ connectionId, database, schema, table })
    const res = await fetch(`/api/columns?${params}`)
    return await res.json()
  }

  return {
    databases,
    schemas,
    tables,
    loading,
    activeDatabase,
    activeSchema,
    selectedDatabase,
    fetchDatabases,
    fetchSchemas,
    fetchTables,
    fetchData,
    fetchColumns,
  }
}
