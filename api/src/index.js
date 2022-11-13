const app = require('express')();
const PORT = 6969

app.get("/", (req, res) => {
    res.status(200).send()
})

app.listen(PORT, () => console.log(`api running on http://localhost:${PORT}`))