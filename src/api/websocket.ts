import * as WebSocket from 'ws'

export const wss = new WebSocket.Server({ noServer: true })

wss.on('connection', socket => {
    socket.on('message', message => console.log(message))
})