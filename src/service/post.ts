import { Either } from 'monet'
import fetch from 'node-fetch'
import { Pool } from 'pg'
import { v4 } from 'uuid'
import { GenerationParameters, PaginationParameters, Post, PostContent, PostFilter } from '../data/models'
import { getFollowedUsernames, queryPosts, storePost } from '../data/storage'
import { AUTOCOMPLETE_PATH, BACKEND_HOST } from '../env'
import { BadRequestError } from '../errors'
import { getUser } from './user'

export async function createPost(pool: Pool, username: string, content: string, parameters?: GenerationParameters): Promise<Post> {
    // TODO: Add incontext posts
    // TODO: Implement automatic answers
    if (parameters) {
        const completion = await completePost(content, parameters)
        content = [content, completion].join(' ')
    }
    
    const post: PostContent = {
        id: v4(),
        content: content,
        auto_complete: parameters !== undefined,
        timestamp: new Date(),
    }
    
    await storePost(pool, post, username)

    const user = await getUser(pool, username)

    return {
        ...post,
        user: user,
        commentCount: 0,
        likes: 0,
    }
}

export async function listPosts(pool: Pool, filter: PostFilter, pagination: PaginationParameters): Promise<{posts: Post[], nextPageToken: string}> {
    const afterDate = decodePageToken(pagination.token)
                        .leftMap(err => {throw err})
                        .right()

    const posts = await queryPosts(pool, pagination.size + 1, { after: afterDate, usernames: filter.usernames })

    let nextPageToken = ""
    if (posts.length > pagination.size) {
        posts.pop()
        nextPageToken = encodePageToken(posts[posts.length - 1].timestamp)
    }

    return {
        nextPageToken: nextPageToken,
        posts: posts,
    }
}

export async function listUserFeed(pool: Pool, username: string, filter:PostFilter, pagination: PaginationParameters): Promise<{posts: Post[], nextPageToken: string}> {
    let followed = await getFollowedUsernames(pool, username)
    followed.push(username)

    console.log(followed)

    if (filter.usernames) {
        followed = followed.filter(username => filter.usernames.includes(username))
    }

    return listPosts(pool, { usernames: followed }, pagination)
}

async function completePost(content: string, parameters: GenerationParameters): Promise<string> {
    const url = BACKEND_HOST + AUTOCOMPLETE_PATH
    
    // TODO: Include mood?
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

function encodePageToken(date: Date): string {
    // TODO: Also encrypt or encode more?
    return date.toISOString()
}

function decodePageToken(token?: string): Either<BadRequestError, Date | undefined> {
    if (!token) {
        return Either.right(undefined)
    }

    const timestamp = Date.parse(token)
    if (isNaN(timestamp)) {
        return Either.left(new BadRequestError('invalid pageToken'))
    }

    return Either.right(new Date(timestamp))
}