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

function nowIso() {
  return new Date().toISOString()
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

export function useConnections() {
  async function fetchConnections() {
    const res = await fetch('/api/connections')
    const data = await res.json()
    connections.value = Array.isArray(data) ? data : []
  }

  async function createConnection(data: ConnectionInput) {
    const normalized = normalizeInput(data)
    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
    })
    const conn = await res.json()
    if (!res.ok) throw new Error(conn.error || 'Failed to create connection')
    connections.value.push(conn)
    return conn
  }

  async function updateConnection(id: string, data: ConnectionInput) {
    const normalized = normalizeInput(data)
    const res = await fetch(`/api/connections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
    })
    const updated = await res.json()
    if (!res.ok) throw new Error(updated.error || 'Failed to update connection')
    const idx = connections.value.findIndex((c) => c.id === id)
    if (idx !== -1) {
      connections.value[idx] = updated
    }
    if (activeConnection.value?.id === id) {
      activeConnection.value = updated
    }
    return updated
  }

  async function deleteConnection(id: string) {
    const res = await fetch(`/api/connections/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to delete connection')
    }
    connections.value = connections.value.filter((c) => c.id !== id)
    if (activeConnection.value?.id === id) {
      activeConnection.value = null
    }
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
  }

  function disconnect() {
    activeConnection.value = null
  }

  async function ensureConnection(connectionId: string | undefined): Promise<LocalConnection | null> {
    if (!connectionId) {
      activeConnection.value = null
      return null
    }
    if (activeConnection.value?.id === connectionId) {
      return activeConnection.value
    }
    // 如果没有缓存，先拉取一次
    if (connections.value.length === 0) {
      await fetchConnections()
    }
    const conn = connections.value.find((c) => c.id === connectionId) || null
    activeConnection.value = conn
    return conn
  }

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
  }
}
