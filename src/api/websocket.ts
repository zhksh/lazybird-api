import * as WebSocket from 'ws'
import { getComments, getPost } from '../data/storage';
import { subscribe, Subscription, unsubscribe } from '../service/pubsub'
import { pool } from './common';

export const wss = new WebSocket.Server({ noServer: true })

wss.on('connection', async socket => {    
    const subscriptions = new Map<string, Subscription>();
    
    socket.on('subscribe', async message => {
        if (message.postId) {
            const sub = await subscribe(message.postId, async () => {
                try {
                    const post = await getPost(pool, message.postId)
                    const comments = await getComments(pool, message.postId)
                    socket.emit('updated', {...post, comments})
                } catch(e) {
                    console.error('failed to query post', e)
                    // TODO: Emit error?
                }
            })
            subscriptions.set(message.postId, sub)
        }
    })

    socket.on('unsubscribe',async message => {
        if (message.postId) {
            const sub = subscriptions.get(message.postId)
            if (sub) {
                unsubscribe(sub)
                subscriptions.delete(message.postId)
            }
        }
    })

    socket.on('close', () => {
        for (const sub of subscriptions.values()) {
            unsubscribe(sub)
            subscriptions.delete(sub.postId)
        }
    })

    // TODO: Implement ping pong to detect disconnect?
})
