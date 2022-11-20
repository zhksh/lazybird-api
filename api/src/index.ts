import express from 'express'
const app = express()
const PORT = 6969

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.listen(PORT, () => console.log(`api running on http://localhost:${PORT}`))