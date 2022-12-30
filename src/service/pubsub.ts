import { Either } from 'monet'
import { v4 } from 'uuid'

type SubscriptionId = string
type PostId = string

type SubscriptionGroup = Map<SubscriptionId, Subscription>

interface Subscription {
    id: SubscriptionId
    postId: PostId
    handler: () => Promise<void>
}

const subscriptions = new Map<PostId, SubscriptionGroup>();

export function publish(postId: PostId) {
    const group = subscriptions.get(postId)

    // TODO: Check what is returned if get is called on non existend post
    if (group) {
        for (const sub of group.values()) {
            // TODO: Make sure that calling handler is not blocking!
            sub.handler()
        }
    }
}

export function subscribe(postId: PostId, callback: () => Promise<void>): Either<Error, Subscription> {
    if (!subscriptions.has(postId)) {
        // TODO: Return error instead of creating group?
        // TODO: Check how node handles multi threaded access to maps
        subscriptions.set(postId, new Map<SubscriptionId, Subscription>)
    }
    
    const group = subscriptions.get(postId)
    
    const sub = {
        id: v4(),
        postId,
        handler: callback,
    }

    group.set(sub.id, sub)

    return Either.right(sub)
}

export function unsubscribe(sub: Subscription) {
    const group = subscriptions.get(sub.postId)
    if (group) {
        // TODO: Delete group if empty?
        group.delete(sub.id)
    }
}