import { Pool } from "pg"
import { NotFoundError } from "../errors"
import { isDuplicateKeyError, isForeignKeyError, query } from "./common"
import { PostMeta, Post, Comment, PageToken, AutoReply } from "./models"

export interface PostStorage {
    storePost(post: Post, username: string): Promise<void>
    storeComment(comment: {id: string, username: string, postId: string, content: string, timestamp?: Date}): Promise<void>
    storeLikeRelation(username: string, postId: string): Promise<void>
    deleteLikeRelation(username: string, postId: string): Promise<void>
    hasLikeRelation(username: string, postId: string): Promise<boolean>
    getLikes(postId: string): Promise<string[]> 
    getPost(postId: string): Promise<PostMeta> 
    getComments(postId: string): Promise<Comment[]> 
    postExists(postId: string): Promise<boolean> 
    storeAutoReply(postId: string, reply: AutoReply): Promise<void>
    getAutoReply(postId: string): Promise<AutoReply | undefined> 
    queryPosts(limit: number, filter?: {page?: PageToken, usernames?: string[]}): Promise<PostMeta[]>
}

export class PostgresPostStorage implements PostStorage {
    private pool: Pool

    constructor(pool: Pool) {
        this.pool = pool
    }

    public async storePost(post: Post, username: string): Promise<void> {
        const sql = `INSERT INTO posts(id, username, content, auto_complete, timestamp) VALUES ($1, $2, $3, $4, $5);`
        const values = [post.id, username, post.content, post.autoreply, post.timestamp]
        await query(this.pool, sql, values)
    }

    public async storeComment(comment: {id: string, username: string, postId: string, content: string, timestamp?: Date}): Promise<void> {
        const sql = `INSERT INTO comments(id, username, post_id, content, timestamp) VALUES ($1, $2, $3, $4, $5);`
        const values = [comment.id, comment.username, comment.postId, comment.content, comment.timestamp]
        await query(this.pool, sql, values)
            .catch(err => {
                if (isForeignKeyError(err)) {
                    throw new NotFoundError('post not found')
                }

                throw err
            })
    }

    public async storeLikeRelation(username: string, postId: string): Promise<void> {
        const sql = `INSERT INTO likes(username, post_id) VALUES ($1, $2);`
        const values = [username, postId]

        await query(this.pool, sql, values)
            .catch(err => {
                if (isDuplicateKeyError(err)) {
                    return
                }

                if (isForeignKeyError(err)) {
                    throw new NotFoundError('post not found')
                }

                throw err
            })
    }

    public async deleteLikeRelation(username: string, postId: string): Promise<void> {
        const sql = `DELETE FROM likes WHERE username = $1 AND post_id = $2;`
        const values = [username, postId]
        await query(this.pool, sql, values)
    }

    public async hasLikeRelation(username: string, postId: string): Promise<boolean> {
        const sql = `SELECT username FROM likes WHERE username = $1 AND post_id = $2;`
        const values = [username, postId]
        const result = await query(this.pool, sql, values)
        return result.rows.length > 0
    }

    public async getLikes(postId: string): Promise<string[]> {
        const sql = `SELECT username FROM likes WHERE post_id = $1;`
        const result = await query(this.pool, sql, [postId])
        return result.rows.map(row => row.username)
    }

    public async getPost(postId: string): Promise<PostMeta> {
        const sql = 
        `SELECT posts.id, content, auto_complete, timestamp, users.username, icon_id, display_name 
            FROM posts JOIN users ON posts.username = users.username
            WHERE posts.id = $1 order by timestamp asc;
        `
        const result = await query(this.pool, sql, [postId])
        if (result.rows.length === 0) {
            throw new NotFoundError('post not found')
        }
        
        const likes = await this.getLikes(postId)
        const comments = await this.getComments(postId)
        return scanPostMeta(result.rows[0], likes, comments)
    }

    public async getComments(postId: string): Promise<Comment[]> {
        const sql = 
        `SELECT id, users.username, users.icon_id, users.display_name, content, timestamp
            FROM comments JOIN users ON comments.username = users.username 
            WHERE post_id = $1 ORDER BY comments.timestamp ASC;
        `
        const result = await query(this.pool, sql, [postId])
        return result.rows.map(scanComment)
    }

    public async postExists(postId: string): Promise<boolean> {
        const sql = `SELECT posts.id FROM posts WHERE id = $1;`
        const result = await query(this.pool, sql, [postId])
        return result.rows.length >= 1
    }

    public async storeAutoReply(postId: string, reply: AutoReply) {
        const sql = `INSERT INTO auto_replies(post_id, mood, temperature, history_length, ours) VALUES ($1, $2, $3, $4, $5);`
        const values = [postId, reply.mood, reply.temperature, reply.history_length, reply.ours]
        await query(this.pool, sql, values)
    }

    public async getAutoReply(postId: string): Promise<AutoReply | undefined> {
        const sql = `SELECT mood, temperature, history_length, ours FROM auto_replies WHERE post_id = $1;`

        const result = await query(this.pool, sql, [postId])
        if (result.rowCount < 1) {
            return undefined
        }

        return result.rows[0]
    }

    public async queryPosts(limit: number, filter?: {page?: PageToken, usernames?: string[]}): Promise<PostMeta[]>{
        const values = []
        const conditions = []
        let argument = 1
        
        if (filter) {
            if (filter.page) {
                const timestampArg = argument++
                conditions.push(`(timestamp < $${timestampArg} OR (timestamp = $${timestampArg} AND id >= $${argument++}))`)
                
                values.push(filter.page.date)
                values.push(filter.page.id)
            }
        
            if (filter.usernames && filter.usernames.length > 0) {
                conditions.push(`posts.username = ANY($${argument++}::text[])`)
                values.push(filter.usernames)
            }
        }

        const where = buildWhereClause(conditions)

        values.push(limit)

        const sql = 
        `SELECT id, content, auto_complete, timestamp, users.username, icon_id, display_name 
            FROM posts JOIN users ON posts.username = users.username 
            ${where} 
            ORDER BY timestamp DESC, id ASC
            LIMIT $${argument++};
        `

        const result = await query(this.pool, sql, values)
        const posts = result.rows.map(async row => {
            const likes = await this.getLikes(row.id)
            const comments = await this.getComments(row.id)
            return scanPostMeta(row, likes, comments)
        })

        return Promise.all(posts)
    }

}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scanPostMeta(row: any, likes: string[], comments: Comment[]): PostMeta {
    return {
        id: row.id,
        content: row.content,
        autoreply: row.auto_complete ?? false,
        timestamp: row.timestamp,
        user: {
            username: row.username,
            icon_id: row.icon_id,
            display_name: row.display_name,
        },
        likes,
        comments
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scanComment(row: any): Comment {
    return {
        id: row.id,
        user: {
            username: row.username,
            icon_id: row.icon_id,
            display_name: row.display_name,
        },
        content: row.content,
    }
}

function buildWhereClause(conditions: string[]): string {
    if (conditions.length > 0) {
        return 'WHERE ' + conditions.join(' AND ')
    }
    
    return ''
}