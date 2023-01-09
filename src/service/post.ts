import { Either } from 'monet'
import fetch from 'node-fetch'
import { Pool } from 'pg'
import { v4 } from 'uuid'
import { GenerationParameters, PaginationParameters, PostMeta, Post, PostFilter, PageToken } from '../data/models'
import { deleteLikeRelation, queryPosts, storeComment, storeLikeRelation, storePost } from '../data/postStorage'
import { getFollowedUsernames } from '../data/userStorage'
import { AUTOCOMPLETE_PATH, BACKEND_HOST } from '../env'
import { BadRequestError } from '../errors'
import { publish } from './pubsub'

export async function createPost(pool: Pool, username: string, content: string, parameters?: GenerationParameters): Promise<Post> {
    // TODO: Currently createPost also handles auto complete. Should we remove that and just pass in AI generated posts from Client?

    // TODO: Implement automatic answers
    if (parameters) {
        const completion = await completePost(content, parameters)
        content = [content, completion].join(' ')
    }
    
    const post: Post = {
        id: v4(),
        content: content,
        auto_complete: parameters !== undefined,
        timestamp: new Date(),
    }
    
    await storePost(pool, post, username)

    return post
}

export async function createComment(pool: Pool, input: {username: string, postId: string, content: string}) {
    const comment = {
        id: v4(),
        timestamp: new Date(),
        ...input,
    }
    
    await storeComment(pool, comment)

    publish(input.postId)
}

/**
 * Either add or remove a like by the given user on the given post.
 */
export async function setPostIsLiked(pool: Pool, input: {username: string, postId: string, isLiked: boolean}) {
    if (input.isLiked) {
        storeLikeRelation(pool, input.username, input.postId)
    } else {
        deleteLikeRelation(pool, input.username, input.postId)
    }

    publish(input.postId)
}

export async function listPosts(pool: Pool, filter: PostFilter, pagination: PaginationParameters): Promise<{posts: PostMeta[], nextPageToken: string}> {    
    const query = {
        usernames: filter.usernames,
        after: undefined,
    }
    
    if (pagination.token) {
        decodePageToken(pagination.token)
        .cata(
            err => { throw err }, 
            token => { query.after = token.date }
        )
    }

    const posts = await queryPosts(pool, pagination.size + 1, query)

    let nextPageToken = ""
    if (posts.length > pagination.size) {
        // TODO: Currently our pagination could fail, if 2 posts have the exact same timestamp. Solve by adding secondary sort criterion. Also, use information of popped entry?
        posts.pop()
        const last = posts[posts.length - 1]
        nextPageToken = encodePageToken({
            date: last.timestamp,
            id: last.id
        })
    }

    return {
        nextPageToken: nextPageToken,
        posts: posts,
    }
}

export async function listUserFeed(pool: Pool, username: string, filter:PostFilter, pagination: PaginationParameters): Promise<{posts: PostMeta[], nextPageToken: string}> {
    let followed = await getFollowedUsernames(pool, username)
    followed.push(username)

    if (filter.usernames) {
        followed = followed.filter(username => filter.usernames.includes(username))
    }

    return listPosts(pool, { usernames: followed }, pagination)
}

async function completePost(content: string, parameters: GenerationParameters): Promise<string> {
    const url = BACKEND_HOST + AUTOCOMPLETE_PATH
    
    const body = {
        temperature: parameters.temperature,
        prefix: content,
    }

    return fetch(url, {
        method: 'post',
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'}
    })
    .then(res => res.json())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then((json: any) => {
        if (json.error) {
            console.error('failed to complete post', json)
            throw new Error(json.message)
        }

        console.log(json)

        return json.response
    })
}


function encodePageToken(token: PageToken): string {
    const str = JSON.stringify(token)
    return Buffer.from(str).toString('base64')
}

function decodePageToken(token: string): Either<BadRequestError, PageToken> {
    try {
        const json = Buffer.from(token, 'base64').toString('binary')
        return Either.right(JSON.parse(json))
    } catch (e) {
        return Either.left(new BadRequestError('invalid pageToken'))
    }
}
