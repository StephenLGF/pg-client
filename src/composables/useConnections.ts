import { ref } from 'vue'
import type { DbConnection } from '../types'

interface ConnectionConfigInput {
  host: string
  port: number
  database?: string
  username: string
  password: string
}

interface ConnectionInput extends ConnectionConfigInput {
  name: string
}

interface LocalConnection extends DbConnection {
  password: string
}

const connections = ref<LocalConnection[]>([])
const activeConnection = ref<LocalConnection | null>(null)
const LOCAL_CONNECTIONS_KEY = 'pg-client.connections'
const ACTIVE_CONNECTION_KEY = 'pg-client.active-connection-id'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function nowIso() {
  return new Date().toISOString()
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeConfig(data: ConnectionConfigInput) {
  const host = data.host.trim()
  if (!host) {
    throw new Error('host is required')
  }
  return {
    host,
    port: data.port || 5432,
    database: data.database?.trim() || null,
    username: data.username?.trim() || 'postgres',
    password: data.password || '',
  }
}

function normalizeInput(data: ConnectionInput) {
  const name = data.name.trim()
  if (!name) {
    throw new Error('name is required')
  }
  return {
    name,
    ...normalizeConfig(data),
  }
}

function readLocalConnections(): LocalConnection[] {
  if (!canUseLocalStorage()) return []
  try {
    const raw = window.localStorage.getItem(LOCAL_CONNECTIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => ({
        id: String(item.id || createId()),
        name: String(item.name || ''),
        host: String(item.host || ''),
        port: Number(item.port || 5432),
        database: item.database ?? null,
        username: String(item.username || 'postgres'),
        password: String(item.password || ''),
        created_at: String(item.created_at || nowIso()),
        updated_at: String(item.updated_at || nowIso()),
      }))
      .filter((item) => item.name && item.host)
  } catch {
    return []
  }
}

function saveLocalConnections(list: LocalConnection[]) {
  if (!canUseLocalStorage()) return
  window.localStorage.setItem(LOCAL_CONNECTIONS_KEY, JSON.stringify(list))
}

function cloneConnection(conn: LocalConnection): LocalConnection {
  return { ...conn }
}

function syncActiveConnection(id?: string) {
  if (!id) {
    activeConnection.value = null
    return
  }
  const refreshed = connections.value.find((item) => item.id === id)
  activeConnection.value = refreshed || null
}

function persistLocalConnection(conn: LocalConnection) {
  const list = readLocalConnections()
  const idx = list.findIndex((item) => item.id === conn.id)
  if (idx === -1) {
    list.push(conn)
  } else {
    list[idx] = conn
  }
  saveLocalConnections(list)
  connections.value = list.map(cloneConnection)
  if (activeConnection.value?.id === conn.id) {
    syncActiveConnection(conn.id)
  }
}

function removeLocalConnection(id: string) {
  const list = readLocalConnections().filter((item) => item.id !== id)
  saveLocalConnections(list)
  connections.value = list.map(cloneConnection)
  if (activeConnection.value?.id === id) {
    activeConnection.value = null
  }
}

function encodeConnectionConfig(conn: LocalConnection): string {
  const payload = JSON.stringify({
    host: conn.host,
    port: conn.port,
    database: conn.database || undefined,
    username: conn.username,
    password: conn.password,
  })
  return btoa(String.fromCharCode(...new TextEncoder().encode(payload)))
}

function loadFromStorage() {
  connections.value = readLocalConnections().map(cloneConnection)
  if (!canUseLocalStorage()) return
  const activeId = window.localStorage.getItem(ACTIVE_CONNECTION_KEY)
  if (activeId) {
    syncActiveConnection(activeId)
  } else {
    activeConnection.value = connections.value[0] || null
  }
}

export function useConnections() {
  async function fetchConnections() {
    loadFromStorage()
  }

  async function createConnection(data: ConnectionInput) {
    const normalized = normalizeInput(data)
    const conn: LocalConnection = {
      id: createId(),
      ...normalized,
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    persistLocalConnection(conn)
    return conn
  }

  async function updateConnection(id: string, data: ConnectionInput) {
    const normalized = normalizeInput(data)
    const list = readLocalConnections()
    const existing = list.find((item) => item.id === id)
    if (!existing) {
      throw new Error('Connection not found')
    }
    const updated: LocalConnection = {
      ...existing,
      ...normalized,
      id,
      created_at: existing.created_at,
      updated_at: nowIso(),
    }
    persistLocalConnection(updated)
    return updated
  }

  async function deleteConnection(id: string) {
    removeLocalConnection(id)
  }

  async function testConnection(id: string): Promise<{ success: boolean; error?: string }> {
    const conn = connections.value.find((item) => item.id === id)
    if (!conn) {
      return { success: false, error: 'Connection not found' }
    }
    return testConnectionByForm({
      host: conn.host,
      port: conn.port,
      database: conn.database || undefined,
      username: conn.username,
      password: conn.password,
    })
  }

  async function testConnectionByForm(data: ConnectionConfigInput): Promise<{ success: boolean; error?: string }> {
    const normalized = normalizeConfig(data)
    try {
      const res = await fetch('/api/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized),
      })
      return res.json()
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  function selectConnection(conn: DbConnection) {
    activeConnection.value = conn as LocalConnection
    if (canUseLocalStorage()) {
      window.localStorage.setItem(ACTIVE_CONNECTION_KEY, conn.id)
    }
  }

  function disconnect() {
    activeConnection.value = null
    if (canUseLocalStorage()) {
      window.localStorage.removeItem(ACTIVE_CONNECTION_KEY)
    }
  }

  async function ensureConnection(connectionId: string | undefined): Promise<LocalConnection | null> {
    if (!connectionId) {
      activeConnection.value = null
      return null
    }
    if (activeConnection.value?.id === connectionId) {
      return activeConnection.value
    }
    loadFromStorage()
    const conn = connections.value.find((c) => c.id === connectionId) || null
    activeConnection.value = conn
    return conn
  }

  function getConnectionRequestHeaders(conn?: LocalConnection | null): Record<string, string> {
    if (!conn) return {}
    return {
      'x-pg-connection-config': encodeConnectionConfig(conn),
    }
  }

  loadFromStorage()

  return {
    connections,
    activeConnection,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    testConnectionByForm,
    selectConnection,
    disconnect,
    ensureConnection,
    getConnectionRequestHeaders,
  }
}
