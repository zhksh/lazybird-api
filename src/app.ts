import express from 'express'
import errorhandler from 'errorhandler'
import { authRouter, userRouter } from './api/userRoutes'
import { backendRouter } from './api/backendRoutes'
import { postsRouter } from './api/blogPostRoutes'
import { PORT } from './env'

const app = express()

app.use(express.json())
app.use('/users', authRouter)
app.use('/users', userRouter)
app.use('/posts', postsRouter)
app.use('/generate', backendRouter)

app.get('/', (req, res) => {
    res.send('Hi Gruppe 2, server is running :)')
})

// TODO: Add graceful shutdown with pool.end()?
app.use(errorhandler({ dumpExceptions: true, showStack: true }));
app.listen(PORT, () => console.log(`api running on http://localhost:${PORT}`))