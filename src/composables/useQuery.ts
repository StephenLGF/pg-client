import { ref } from 'vue'
import type { QueryResult } from '../types'
import { useConnections } from './useConnections'
import { useDatabase } from './useDatabase'

export function useQuery() {
  const { activeConnection, getConnectionRequestHeaders } = useConnections()
  const { activeDatabase } = useDatabase()
  const loading = ref(false)
  const result = ref<QueryResult | null>(null)
  const error = ref<string | null>(null)

  async function execute(sql: string) {
    if (!activeConnection.value) return
    loading.value = true
    error.value = null
    result.value = null

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getConnectionRequestHeaders(activeConnection.value),
        },
        body: JSON.stringify({ sql, connectionId: activeConnection.value.id, database: activeDatabase.value }),
      })
      const data = await res.json()

      if (!res.ok) {
        error.value =
          data.error + (data.detail ? `\n${data.detail}` : '')
      } else {
        result.value = data
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { loading, result, error, execute }
}
