import { Pool } from 'pg'
import { v4 } from 'uuid'
import { GenerationParameters, Post, PostContent } from '../data/models'
import { storePost } from '../data/storage'
import { getUser } from './user'

export async function createPost(pool: Pool, username: string, content: string, parameters?: GenerationParameters): Promise<Post> {
    if (parameters) {
        content = await generate(content, parameters)
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
        comments: [],
        likes: 0,
    }
}

function generate(content: string, parameters: GenerationParameters): Promise<string> {
    throw 'not implemented'
}