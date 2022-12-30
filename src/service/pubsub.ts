import { v4 } from 'uuid'
import ReadWriteLock from 'rwlock'
import { EventEmitter } from 'events'

type PostId = string
type SubscriptionId = string
type Subscription = {
    id: SubscriptionId
    postId: PostId
    handler: () => Promise<void>
}
type SubscriptionGroup = Map<SubscriptionId, Subscription>

const lock = new ReadWriteLock()
const subscriptions = new Map<PostId, SubscriptionGroup>()
const emitter = new EventEmitter()

export async function subscribe(postId: PostId, callback: () => Promise<void>): Promise<Subscription> {
    // TODO: Possible improvement: Could use lock keys to only lock per group and not all subscriptions. Also, could only do read lock for some operations.
    const sub = {
        id: v4(),
        postId,
        handler: callback,
    }

    return inWriteLock(() => {
        if (!subscriptions.has(postId)) {
            subscriptions.set(postId, new Map<SubscriptionId, Subscription>)
        }
        
        const group = subscriptions.get(postId)
        group.set(sub.id, sub)

        return sub
    })
}

export async function unsubscribe(sub: Subscription) {
    // TODO: Could be improved by only acquiring write lock when group is found. Performance gain probably small to none.
    await inWriteLock(() => {
        const group = subscriptions.get(sub.postId)
        if (group) {
            // TODO: Delete group if empty?
            group.delete(sub.id)
        }
    })
}

export async function publish(postId: PostId) {
    // Emitter is used so main thread will not be blocked by the publication.
    emitter.emit('postUpdated', postId)
}

emitter.on('postUpdated', postId => {
    inReadLock(() => {
        const group = subscriptions.get(postId)
        if (group) {
            for (const sub of group.values()) {
                sub.handler().catch(err => console.log('publish error', err))
            }
        }
    })
})

function inWriteLock<T>(callback: () => T, key?: string): Promise<T> {
    return new Promise(resolve => {
        if (key) {
            lock.writeLock(key, release => {
                const got = callback()
                release()
                resolve(got)
            })
        } else {
            lock.writeLock(release => {
                const got = callback()
                release()
                resolve(got)
            })
        }
    })
}

function inReadLock<T>(callback: () => T, key?: string): Promise<T> {    
    return new Promise(resolve => {
        if (key) {
            lock.readLock(key, release => {
                const got = callback()
                release()
                resolve(got)
            })
        } else {
            lock.readLock(release => {
                const got = callback()
                release()
                resolve(got)
            })
        }
    })
}