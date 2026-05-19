import pg from 'pg'
import { createHash } from 'crypto'

export interface ConnectionConfig {
  host: string
  port: number
  database?: string
  username: string
  password: string
}

const poolCache = new Map<string, pg.Pool>()

function normalizeConnectionConfig(config: Partial<ConnectionConfig>): ConnectionConfig {
  return {
    host: String(config.host || '127.0.0.1'),
    port: Number(config.port || 5432),
    database: config.database || undefined,
    username: String(config.username || 'postgres'),
    password: String(config.password || ''),
  }
}

export function decodeConnectionConfigHeader(value: string | string[] | undefined): ConnectionConfig | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null
  try {
    const json = Buffer.from(raw, 'base64').toString('utf8')
    const parsed = JSON.parse(json)
    if (!parsed?.host) return null
    return normalizeConnectionConfig(parsed)
  } catch {
    return null
  }
}

function getConnectionConfig(clientConfig?: ConnectionConfig) {
  if (!clientConfig) {
    throw new Error('Connection config is required')
  }
  return normalizeConnectionConfig(clientConfig)
}

function getCacheSignature(config: ConnectionConfig) {
  return createHash('sha256').update(JSON.stringify(config)).digest('hex').slice(0, 12)
}

export async function getPool(
  connectionId: string,
  database?: string,
  clientConfig?: ConnectionConfig
): Promise<pg.Pool> {
  const config = getConnectionConfig(clientConfig)
  const dbName = database || config.database || 'postgres'
  const key = `${connectionId}:${dbName}:${getCacheSignature(config)}`

  const cached = poolCache.get(key)
  if (cached) return cached

  const newPool = new pg.Pool({
    host: config.host,
    port: config.port,
    database: dbName,
    user: config.username,
    password: config.password,
    max: 5,
  })

  poolCache.set(key, newPool)
  return newPool
}

export async function getDatabases(connectionId: string, clientConfig?: ConnectionConfig): Promise<string[]> {
  const config = getConnectionConfig(clientConfig)
  const tempPool = new pg.Pool({
    host: config.host,
    port: config.port,
    database: config.database || 'postgres',
    user: config.username,
    password: config.password,
    max: 1,
    connectionTimeoutMillis: 5000,
  })
  try {
    const result = await tempPool.query(
      `SELECT datname FROM pg_database
       WHERE datistemplate = false
       ORDER BY datname`
    )
    return result.rows.map((row: { datname: string }) => row.datname)
  } finally {
    await tempPool.end()
  }
}

export function removePool(connectionId: string): void {
  for (const [key, cached] of poolCache) {
    if (key.startsWith(`${connectionId}:`)) {
      cached.end()
      poolCache.delete(key)
    }
  }
}

export async function testConnection(config: ConnectionConfig): Promise<{ success: boolean; error?: string }> {
  const normalized = normalizeConnectionConfig(config)
  const testPool = new pg.Pool({
    host: normalized.host,
    port: normalized.port,
    database: normalized.database || 'postgres',
    user: normalized.username,
    password: normalized.password,
    max: 1,
    connectionTimeoutMillis: 5000,
  })
  try {
    await testPool.query('SELECT 1')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  } finally {
    await testPool.end()
  }
}
