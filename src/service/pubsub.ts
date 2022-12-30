import { v4 } from 'uuid'
import ReadWriteLock from 'rwlock';

type SubscriptionId = string
type PostId = string

type SubscriptionGroup = Map<SubscriptionId, Subscription>

interface Subscription {
    id: SubscriptionId
    postId: PostId
    handler: () => Promise<void>
}

const lock = new ReadWriteLock();
const subscriptions = new Map<PostId, SubscriptionGroup>();

export async function publish(postId: PostId) {
    await inReadLock(() => {
        const group = subscriptions.get(postId)
    
        // TODO: Check what is returned if get is called on non existend post
        if (group) {
            for (const sub of group.values()) {
                sub.handler().catch(err => console.log('publish error', err))
            }
        }
    })
}

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