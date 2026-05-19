import { Router } from 'express'
import { testConnection } from '../poolManager.js'

const router = Router()

router.get('/connections', (_req, res) => {
  res.json([])
})

router.post('/connections', (_req, res) => {
  res.status(410).json({ error: 'Connection persistence is handled by browser localStorage' })
})

router.put('/connections/:id', (_req, res) => {
  res.status(410).json({ error: 'Connection persistence is handled by browser localStorage' })
})

router.delete('/connections/:id', (_req, res) => {
  res.status(410).end()
})

router.post('/connections/:id/test', (_req, res) => {
  res.status(410).json({ error: 'Saved connections are stored in browser localStorage' })
})

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
