import { Router } from 'express'
import { decodeConnectionConfigHeader, getPool, getDatabases } from '../poolManager.js'

const router = Router()

function getClientConnectionConfig(req: any) {
  return decodeConnectionConfigHeader(req.headers['x-pg-connection-config']) || undefined
}

// List databases on a server
router.get('/databases', async (req, res) => {
  const connectionId = req.query.connectionId as string
  const clientConfig = getClientConnectionConfig(req)
  if (!connectionId) {
    return res.status(400).json({ error: 'connectionId is required' })
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
  const clientConfig = getClientConnectionConfig(req)
  if (!connectionId) {
    return res.status(400).json({ error: 'connectionId is required' })
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
  const clientConfig = getClientConnectionConfig(req)
  if (!connectionId) {
    return res.status(400).json({ error: 'connectionId is required' })
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
  const clientConfig = getClientConnectionConfig(req)

  if (!connectionId || !table) {
    return res.status(400).json({ error: 'connectionId and table are required' })
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
  const clientConfig = getClientConnectionConfig(req)

  if (!connectionId) {
    return res.status(400).json({ error: 'connectionId is required' })
  }

  if (!sql?.trim()) {
    return res.status(400).json({ error: 'Empty query' })
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
