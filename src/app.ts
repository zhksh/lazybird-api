import express from 'express'
import errorhandler from 'errorhandler'
import { authRouter, userRouter } from './api/userRoutes'
import { backendRouter } from './api/backendRoutes'
import { postsRouter } from './api/blogPostRoutes'
import { PORT } from './env'
import { pool } from './api/common'
import { wss } from './api/websocket'
import { logger } from './logger'

const app = express()

app.use(express.json())
app.use('/users', authRouter)
app.use('/users', userRouter)
app.use('/posts', postsRouter)
app.use('/generate', backendRouter)

app.get('/', (req, res) => {
    res.send('Hi Gruppe 2, server is running :)')
})

app.use(errorhandler({ dumpExceptions: true, showStack: true }));

const server = app.listen(PORT, () => console.log(`api running on http://localhost:${PORT}`))

logger.error('failed successfully')

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
        wss.emit('connection', socket, request)
    })
})

process.on('SIGTERM', () => {
    server.close(() => {
        pool.end()
    })
})