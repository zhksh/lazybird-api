import express from 'express'
import { userRouter } from './api/userRoutes'

const app = express()

app.use(express.json())
app.use('/user', userRouter)

app.get('/', (req, res) => {
    res.send('This server is running :)')
})

function getPort(): number {
    const port = Number(process.env.API_PORT)
    if(port) {
        return port
    }

    // Default port, if no other port is specified in env.
    return 6969
}

app.listen(getPort(), () => console.log(`api running on http://localhost:${getPort()}`))