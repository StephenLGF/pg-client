import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../data')
const CONNECTIONS_FILE = join(DATA_DIR, 'connections.json')

export interface StoredConnection {
  id: string
  name: string
  host: string
  port: number
  database: string | null
  username: string
  password: string
  created_at: string
  updated_at: string
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readConnections(): StoredConnection[] {
  ensureDataDir()
  if (!existsSync(CONNECTIONS_FILE)) return []
  try {
    const raw = readFileSync(CONNECTIONS_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeConnection)
  } catch {
    return []
  }
}

function writeConnections(list: StoredConnection[]) {
  ensureDataDir()
  writeFileSync(CONNECTIONS_FILE, JSON.stringify(list, null, 2))
}

function normalizeConnection(item: any): StoredConnection {
  return {
    id: String(item.id || ''),
    name: String(item.name || ''),
    host: String(item.host || ''),
    port: Number(item.port || 5432),
    database: item.database ?? null,
    username: String(item.username || 'postgres'),
    password: String(item.password || ''),
    created_at: String(item.created_at || new Date().toISOString()),
    updated_at: String(item.updated_at || new Date().toISOString()),
  }
}

function createId(): string {
  return `conn-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function listConnections(): StoredConnection[] {
  return readConnections()
}

export function getConnection(id: string): StoredConnection | null {
  return readConnections().find((c) => c.id === id) || null
}

export function addConnection(data: Omit<StoredConnection, 'id' | 'created_at' | 'updated_at'>): StoredConnection {
  const list = readConnections()
  const conn: StoredConnection = {
    id: createId(),
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  list.push(conn)
  writeConnections(list)
  return conn
}

export function updateConnection(id: string, data: Partial<StoredConnection>): StoredConnection | null {
  const list = readConnections()
  const idx = list.findIndex((c) => c.id === id)
  if (idx === -1) return null
  list[idx] = { ...list[idx], ...data, updated_at: new Date().toISOString() }
  writeConnections(list)
  return list[idx]
}

export function deleteConnection(id: string): boolean {
  const list = readConnections()
  const filtered = list.filter((c) => c.id !== id)
  if (filtered.length === list.length) return false
  writeConnections(filtered)
  return true
}
