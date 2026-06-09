import { Router } from 'express'
import { testConnection } from '../poolManager.js'
import {
  listConnections,
  getConnection,
  addConnection,
  updateConnection,
  deleteConnection,
} from '../dataStore.js'

const router = Router()

// 获取所有连接
router.get('/connections', (_req, res) => {
  res.json(listConnections())
})

// 创建连接
router.post('/connections', (req, res) => {
  const { name, host, port, database, username, password } = req.body
  if (!name?.trim() || !host?.trim()) {
    return res.status(400).json({ error: 'name and host are required' })
  }
  const conn = addConnection({
    name: name.trim(),
    host: host.trim(),
    port: port || 5432,
    database: database?.trim() || null,
    username: username?.trim() || 'postgres',
    password: password || '',
  })
  res.json(conn)
})

// 更新连接
router.put('/connections/:id', (req, res) => {
  const { name, host, port, database, username, password } = req.body
  if (!name?.trim() || !host?.trim()) {
    return res.status(400).json({ error: 'name and host are required' })
  }
  const updated = updateConnection(req.params.id, {
    name: name.trim(),
    host: host.trim(),
    port: port || 5432,
    database: database?.trim() || null,
    username: username?.trim() || 'postgres',
    password: password || '',
  })
  if (!updated) {
    return res.status(404).json({ error: 'Connection not found' })
  }
  res.json(updated)
})

// 删除连接
router.delete('/connections/:id', (req, res) => {
  const ok = deleteConnection(req.params.id)
  if (!ok) {
    return res.status(404).json({ error: 'Connection not found' })
  }
  res.status(204).end()
})

// 测试已保存的连接
router.post('/connections/:id/test', async (req, res) => {
  const conn = getConnection(req.params.id)
  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' })
  }
  const result = await testConnection({
    host: conn.host,
    port: conn.port,
    database: conn.database || undefined,
    username: conn.username,
    password: conn.password,
  })
  res.json(result)
})

// 测试表单中的连接（未保存）
router.post('/connections/test', async (req, res) => {
  const { host, port, database, username, password } = req.body
  if (!host?.trim()) {
    return res.status(400).json({ error: 'host is required' })
  }
  const testResult = await testConnection({
    host,
    port: port || 5432,
    database: database || undefined,
    username: username || 'postgres',
    password: password || '',
  })
  res.json(testResult)
})

export default router
