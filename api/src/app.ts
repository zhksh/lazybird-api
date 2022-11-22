import express from 'express'
import { userRouter } from './api/userRoutes'

const PORT = process.env.API_PORT ?? 6969
const app = express()

app.use(express.json())
app.use('/user', userRouter)

app.get('/', (req, res) => {
    res.send('This server is running :)')
})

// TODO: Add graceful shutdown with pool.end()?
app.listen(PORT, () => console.log(`api running on http://localhost:${PORT}`))