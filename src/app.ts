import express from 'express'
import errorhandler from 'errorhandler'
import { userRouter } from './api/userRoutes'
import { backendRouter } from './api/backendRoutes'

const PORT = process.env.API_PORT ?? 6969
const app = express()

app.use(express.json())
app.use('/user', userRouter)
app.use('/generate', backendRouter)

app.get('/', (req, res) => {
    res.send('Hi Gruppe 2, server is running :)')
})

// TODO: Add graceful shutdown with pool.end()?
app.use(errorhandler({ dumpExceptions: true, showStack: true }));
app.listen(PORT, () => console.log(`api running on http://localhost:${PORT}`))