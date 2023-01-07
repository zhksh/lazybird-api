import * as WebSocket from 'ws'
import { getComments, getPost } from '../data/storage'
import { InputEvent, OutputEvent } from '../data/models';
import { subscribe, Subscription, unsubscribe } from '../service/pubsub'
import { pool } from './common';
import { HTTP_NOT_FOUND } from './codes';

export const wss = new WebSocket.Server({ noServer: true })

wss.on('connection', async socket => {
    console.log('socket connected')
    
    const subscriptions = new Map<string, Subscription>();
    
    socket.on('message', message => {        
        // TODO: Validate event
        const event = JSON.parse(message.toString())

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

        // TODO: Error when post is not found
        const sub = await subscribe(event.postId, () => sendPost(socket, event.postId))
    
        sendPost(socket, event.postId)
        
        subscriptions.set(event.postId, sub)
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
        const comments = await getComments(pool, postId)
        const output: OutputEvent = {
            eventType: 'updated',
            data: {...post, comments},
        }
        socket.send(JSON.stringify(output))
    } catch(e) {
        const output: OutputEvent = {
            eventType: 'updated',
            data: {
                code: HTTP_NOT_FOUND,
                message: 'post not found'
            },
        }

        socket.send(JSON.stringify(output))
    }
}