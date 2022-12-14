import fetch from 'node-fetch'
import { Pool } from 'pg'
import { v4 } from 'uuid'
import { GenerationParameters, Post, PostContent } from '../data/models'
import { storePost } from '../data/storage'
import { AUTOCOMPLETE_PATH, BACKEND_HOST } from '../env'
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
        is_ai: parameters !== undefined,
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