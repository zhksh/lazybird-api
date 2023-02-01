import express from 'express'
import errorhandler from 'errorhandler'
import { authRouter, userRouter } from './api/userRoutes'
import { backendRouter } from './api/backendRoutes'
import { postsRouter } from './api/blogPostRoutes'
import { PORT } from './env'
import { wss } from './api/websocket'
import { logRequest } from './api/middleware'
import { closePostgresPool } from './api/dependencies'

const app = express()

app.use(express.json())

// Mount authRouter before logs, otherwise sensitive data might be logged!
app.use('/users', authRouter)

app.use(logRequest)
app.use('/users', userRouter)
app.use('/posts', postsRouter)
app.use('/generate', backendRouter)

app.get('/', (req, res) => {
    res.send('Hi Gruppe 2, server is running :)')
})

app.use(errorhandler({ dumpExceptions: true, showStack: true }));

const server = app.listen(PORT, () => console.log(`api running on http://localhost:${PORT}`))

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, socket => {
        wss.emit('connection', socket, request)
    })
})

process.on('SIGTERM', () => {
    server.close(() => {
        closePostgresPool()
    })
})