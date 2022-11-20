import express from 'express'

const app = express()

function getPort(): number {
    const port = Number(process.env.API_PORT)
    if(port) {
        return port
    }

    // Default port, if no other port is specified in env.
    return 6969
}

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.listen(getPort(), () => console.log(`api running on http://localhost:${getPort()}`))