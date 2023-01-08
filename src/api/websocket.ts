import * as WebSocket from 'ws'
import { getPost, postExists } from '../data/storage'
import { InputEvent, OutputEvent } from '../data/models';
import { subscribe, Subscription, unsubscribe } from '../service/pubsub'
import { pool } from './common';
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR, HTTP_NOT_FOUND } from './codes';

export const wss = new WebSocket.Server({ noServer: true })

wss.on('connection', async socket => {
    console.log('socket connected')
    
    const subscriptions = new Map<string, Subscription>();
    
    socket.on('message', message => {        
        const event = JSON.parse(message.toString())
        if (!isValidInputEvent(event)) {
            socket.send(JSON.stringify(makeErrorEvent(HTTP_BAD_REQUEST, 'invalid input event')))
            return
        }

        handleEvent(event, socket, subscriptions)
    })

    socket.on('close', () => {
        for (const sub of subscriptions.values()) {
            unsubscribe(sub)
            subscriptions.delete(sub.postId)
        }
    })

    // TODO: Implement ping pong to detect disconnect?
})

async function handleEvent(event: InputEvent, socket: WebSocket.WebSocket, subscriptions: Map<string, Subscription>) {
    if (event.eventType === 'subscribe') {
        console.log('subscribing to post', event.postId)

        if (!postExists(pool, event.postId)) {
            socket.send(JSON.stringify(makeErrorEvent(HTTP_NOT_FOUND, 'post not found')))
            return
        }

        const sub = await subscribe(event.postId, () => sendPost(socket, event.postId))    
        subscriptions.set(event.postId, sub)
        
        sendPost(socket, event.postId)
    }

    if (event.eventType === 'unsubscribe') {
        console.log('unsubscribing from post', event.postId)
        
        const sub = subscriptions.get(event.postId)
        if (sub) {
            unsubscribe(sub)
            subscriptions.delete(event.postId)
        }
    }
}

async function sendPost(socket: WebSocket.WebSocket, postId: string) {
    try {
        const post = await getPost(pool, postId)
        const output: OutputEvent = {
            eventType: 'updated',
            data: {...post},
        }
        socket.send(JSON.stringify(output))
    } catch(e) {
        // TODO: Log error
        socket.send(JSON.stringify(makeErrorEvent(HTTP_INTERNAL_ERROR, 'internal error')))
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidInputEvent(data: any): data is InputEvent {
    if (!data.eventType || !data.postId) {
        return false
    }
    
    return ['subscribe', 'unsubscribe'].includes(data.eventType)
}

function makeErrorEvent(code: number, message: string): OutputEvent {
    return {
        eventType: 'error',
        data: {code, message}
    }
}