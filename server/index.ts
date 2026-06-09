import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import connectionRoutes from './routes/connections.js'
import queryRoutes from './routes/query.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', connectionRoutes)
app.use('/api', queryRoutes)

// 托管前端构建产物
const distPath = join(__dirname, '../dist')
app.use(express.static(distPath))

// 兜底：所有未匹配路由返回 index.html（支持前端路由刷新）
app.get('*', (_req, res) => {
  res.sendFile(join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 3001

async function start() {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`)
  })
}

start()
