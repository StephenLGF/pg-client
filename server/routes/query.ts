import { Router } from 'express'
import { getPool, getDatabases } from '../poolManager.js'
import { getConnection } from '../dataStore.js'

const router = Router()

function getClientConnectionConfig(connectionId: string) {
  const conn = getConnection(connectionId)
  if (!conn) return null
  return {
    host: conn.host,
    port: conn.port,
    database: conn.database || undefined,
    username: conn.username,
    password: conn.password,
  }
}

/**
 * 去掉 SQL 中的注释，避免注释内出现关键字被误判
 */
function stripComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
}

/**
 * 去掉字符串字面量，避免字符串值中的关键字被误判
 */
function stripStringLiterals(sql: string): string {
  // 标准单引号字符串（处理转义和连续单引号）
  let result = sql.replace(/'(?:[^'\\]|\\.|'')*'/g, "''")
  // PostgreSQL dollar-quoted string: $tag$...$tag$
  result = result.replace(/\$[A-Za-z0-9_]*\$[\s\S]*?\$[A-Za-z0-9_]*\$/g, "''")
  return result
}

/**
 * 检查 SQL 是否为只读查询。
 * 1. 去掉注释和字符串后扫描禁止的 DML/DDL 关键字
 * 2. 语句必须以白名单关键字开头
 */
function isReadOnlyQuery(sql: string): boolean {
  const noComments = stripComments(sql)
  const cleaned = stripStringLiterals(noComments).toLowerCase()

  const forbidden = [
    '\\binsert\\b', '\\bupdate\\b', '\\bdelete\\b', '\\bdrop\\b',
    '\\bcreate\\b', '\\balter\\b', '\\btruncate\\b', '\\bgrant\\b',
    '\\brevoke\\b', '\\bcopy\\b', '\\bmerge\\b', '\\bcall\\b',
    '\\bexecute\\b', '\\block\\b', '\\breindex\\b', '\\bvacuum\\b',
    '\\bprepare\\b', '\\bdeallocate\\b',
  ]

  for (const pattern of forbidden) {
    if (new RegExp(pattern).test(cleaned)) return false
  }

  const firstWord = cleaned.trim().match(/^[\s(]*([a-zA-Z_][a-zA-Z0-9_]*)/)?.[1]
  if (!firstWord) return false

  const allowed = ['select', 'with', 'explain', 'show', 'describe', 'table']
  return allowed.includes(firstWord)
}

// List databases on a server
router.get('/databases', async (req, res) => {
  const connectionId = req.query.connectionId as string
  if (!connectionId) {
    return res.status(400).json({ error: 'connectionId is required' })
  }
  const clientConfig = getClientConnectionConfig(connectionId)
  if (!clientConfig) {
    return res.status(404).json({ error: 'Connection not found' })
  }
  try {
    const databases = await getDatabases(connectionId, clientConfig)
    res.json(databases)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/tables', async (req, res) => {
  const connectionId = req.query.connectionId as string
  const database = req.query.database as string
  const schema = (req.query.schema as string) || 'public'
  const clientConfig = getClientConnectionConfig(connectionId)
  if (!connectionId) {
    return res.status(400).json({ error: 'connectionId is required' })
  }
  if (!clientConfig) {
    return res.status(404).json({ error: 'Connection not found' })
  }
  try {
    const targetPool = await getPool(connectionId, database, clientConfig)
    const result = await targetPool.query(`
      SELECT table_schema, table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = $1
      ORDER BY table_name
    `, [schema])
    res.json(result.rows)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/schemas', async (req, res) => {
  const connectionId = req.query.connectionId as string
  const database = req.query.database as string
  const clientConfig = getClientConnectionConfig(connectionId)
  if (!connectionId) {
    return res.status(400).json({ error: 'connectionId is required' })
  }
  if (!clientConfig) {
    return res.status(404).json({ error: 'Connection not found' })
  }
  try {
    const targetPool = await getPool(connectionId, database, clientConfig)
    const result = await targetPool.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name <> 'information_schema'
        AND schema_name NOT LIKE 'pg_%'
      ORDER BY CASE WHEN schema_name = 'public' THEN 0 ELSE 1 END, schema_name
    `)
    res.json(result.rows.map((row: { schema_name: string }) => row.schema_name))
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// Get column information for a table
router.get('/columns', async (req, res) => {
  const connectionId = req.query.connectionId as string
  const database = req.query.database as string
  const schema = (req.query.schema as string) || 'public'
  const table = req.query.table as string
  const clientConfig = getClientConnectionConfig(connectionId)

  if (!connectionId || !table) {
    return res.status(400).json({ error: 'connectionId and table are required' })
  }
  if (!clientConfig) {
    return res.status(404).json({ error: 'Connection not found' })
  }

  try {
    const targetPool = await getPool(connectionId, database, clientConfig)
    const result = await targetPool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
        AND table_schema = $2
      ORDER BY ordinal_position
    `, [table, schema])

    res.json(result.rows)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

router.post('/query', async (req, res) => {
  const { sql, connectionId, database } = req.body
  const clientConfig = getClientConnectionConfig(connectionId)

  if (!connectionId) {
    return res.status(400).json({ error: 'connectionId is required' })
  }

  if (!clientConfig) {
    return res.status(404).json({ error: 'Connection not found' })
  }

  if (!sql?.trim()) {
    return res.status(400).json({ error: 'Empty query' })
  }

  if (!isReadOnlyQuery(sql)) {
    return res.status(403).json({ error: 'Only read-only queries are allowed' })
  }

  const start = performance.now()
  try {
    const targetPool = await getPool(connectionId, database, clientConfig)
    const result = await targetPool.query(sql)
    const duration = Math.round(performance.now() - start)

    res.json({
      columns: result.fields.map((f: any) => ({
        name: f.name,
        dataTypeID: f.dataTypeID,
        dataTypeName: f.dataType?.name || f.dataTypeName || '',
      })),
      rows: result.rows,
      rowCount: result.rowCount,
      command: result.command,
      duration,
    })
  } catch (err: any) {
    res.status(400).json({
      error: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
      position: err.position,
    })
  }
})

export default router
