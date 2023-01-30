import EventEmitter from 'events'
import { Either } from 'monet'
import { Pool } from 'pg'
import { v4 } from 'uuid'
import {PaginationParameters, PostMeta, Post, PostFilter, PageToken, AutoReply, PostRequest, User} from '../data/models'
import { PostStorage } from '../data/postStorage'
import { UserStorage } from '../data/userStorage'
import { BadRequestError } from '../errors'
import { logger } from '../logger'
import { buildHistory, createReply } from './postGeneraton'
import { publish } from './pubsub'

const autoReplyEmitter = new EventEmitter()

export async function createPost(
    postStorage: PostStorage, 
    postreq: PostRequest
): Promise<Post> {

    const post: Post = {
        id: v4(),
        content: postreq.content,
        autoreply: postreq.autoReplyOptions != null,
        timestamp: new Date(),
    }

    await postStorage.storePost(post, postreq.username)
    
    if (postreq.autoReplyOptions != null) {
        await postStorage.storeAutoReply(post.id, postreq.autoReplyOptions)
    }

    return post
}

export async function createComment(postStorage: PostStorage, input: {username: string, postId: string, content: string}) {
    const comment = {
        id: v4(),
        timestamp: new Date(),
        ...input,
    }

    await postStorage.storeComment(comment)
    publish(input.postId)

    const autoReply = await postStorage.getAutoReply(input.postId)
    if (autoReply) {
        autoReplyEmitter.emit('createAutoReply', postStorage, input.postId, input.username, autoReply)
    }
}

/**
 * Either add or remove a like by the given user on the given post.
 */
export async function setPostIsLiked(postStorage: PostStorage, input: {username: string, postId: string, isLiked: boolean}) {
    if (input.isLiked) {
        await postStorage.storeLikeRelation(input.username, input.postId)
    } else {
        await postStorage.deleteLikeRelation(input.username, input.postId)
    }

    publish(input.postId)
}

export async function listPosts(
    postStorage: PostStorage, 
    filter: PostFilter, 
    pagination: PaginationParameters
): Promise<{posts: PostMeta[], nextPageToken: string}> {

    const query = {
        usernames: filter.usernames,
        page: undefined,
    }
    
    if (pagination.token) {
        decodePageToken(pagination.token)
        .cata(
            err => { throw err }, 
            page => { query.page = page }
        )
    }

    const posts = await postStorage.queryPosts(pagination.size + 1, query)

    let nextPageToken = ""
    if (posts.length > pagination.size) {
        const nextEntry = posts.pop()
        posts[posts.length - 1]
        nextPageToken = encodePageToken({
            date: nextEntry.timestamp,
            id: nextEntry.id
        })
    }

    return {
        nextPageToken: nextPageToken,
        posts: posts,
    }
}

export async function listUserFeed(
    userStorage: UserStorage, 
    postStorage: PostStorage, 
    username: string, 
    filter:PostFilter, 
    pagination: PaginationParameters
): Promise<{posts: PostMeta[], nextPageToken: string}> {

    let followed = await userStorage.getFollowedUsernames(username)
    followed.push(username)

    if (filter.usernames && filter.usernames.length > 0) {
        followed = followed.filter(username => filter.usernames.includes(username))
    }

    return listPosts(postStorage, { usernames: followed }, pagination)
}

autoReplyEmitter.on('createAutoReply', async (postStorage: PostStorage, postId: string, toUsername: string, autoReply: AutoReply) => {
    const post = await postStorage.getPost(postId)
    if (post.user.username === toUsername) {
        // Don't reply to own comments.
        return
    }

    const history = buildHistory(post, autoReply.history_length)

    logger.info('creating auto reply', { ...autoReply })
    
    await createReply(autoReply, history)
        .then(content => {
            const resp: string = JSON.parse(content).response
            createComment(postStorage, {
                username: post.user.username, 
                postId, 
                content: resp,
            }).catch(err => logger.error('failed to create comment:', err))
        }
        )
        .catch(err => {
            logger.error('autoreply failed:', err)
            createComment(postStorage, {
                username: post.user.username, 
                postId: postId, 
                content: "I can't react to that right now. Try me later!",
            }).catch(err => logger.error('failed to create comment:', err))
        })
})

function encodePageToken(token: PageToken): string {
    const str = JSON.stringify(token)
    return Buffer.from(str).toString('base64')
}

function decodePageToken(token: string): Either<BadRequestError, PageToken> {
    try {
        const json = Buffer.from(token, 'base64').toString('binary')
        return Either.right(JSON.parse(json))
    } catch (e) {
        logger.error({
            message: 'failed to decode pageToken',
            pageToken: token,
            response: e,
        })

        return Either.left(new BadRequestError('invalid pageToken'))
    }
}
