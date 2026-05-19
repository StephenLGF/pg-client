import express from 'express'
import cors from 'cors'
import connectionRoutes from './routes/connections.js'
import queryRoutes from './routes/query.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/api', connectionRoutes)
app.use('/api', queryRoutes)

const PORT = 3001

async function start() {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`Query server running on http://127.0.0.1:${PORT}`)
  })
}

start()
