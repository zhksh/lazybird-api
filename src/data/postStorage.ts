import { Pool } from "pg"
import { InternalError, NotFoundError } from "../errors"
import { isDuplicateKeyError, isForeignKeyError, query } from "./common"
import { PostMeta, Post, Comment, PageToken } from "./models"

export async function storePost(pool: Pool, post: Post, username: string) {
    const sql = `INSERT INTO posts(id, username, content, auto_complete, timestamp) VALUES ($1, $2, $3, $4, $5);`
    const values = [post.id, username, post.content, post.auto_complete, post.timestamp]
    await query(pool, sql, values)
}

export async function storeComment(pool: Pool, comment: {id: string, username: string, postId: string, content: string, timestamp?: Date}) {
    const sql = `INSERT INTO comments(id, username, post_id, content, timestamp) VALUES ($1, $2, $3, $4, $5);`
    const values = [comment.id, comment.username, comment.postId, comment.content, comment.timestamp]
    await query(pool, sql, values)
        .catch(err => {
            if (isForeignKeyError(err)) {
                throw new NotFoundError('post not found')
            }

            throw err
        })
}

export async function storeLikeRelation(pool: Pool, username: string, postId: string) {
    const sql = `INSERT INTO likes(username, post_id) VALUES ($1, $2);`
    const values = [username, postId]

    await query(pool, sql, values)
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

export async function deleteLikeRelation(pool: Pool, username: string, postId: string) {
    const sql = `DELETE FROM likes WHERE username = $1 AND post_id = $2;`
    const values = [username, postId]
    await query(pool, sql, values)
}

export async function getPost(pool: Pool, postId: string): Promise<PostMeta> {
    const sql = 
    `SELECT posts.id, content, auto_complete, timestamp, users.username, icon_id, display_name 
        FROM posts JOIN users ON posts.username = users.username
        WHERE posts.id = $1;
    `
    const result = await query(pool, sql, [postId])
    if (result.rows.length === 0) {
        throw new NotFoundError('post not found')
    }
    
    const likes = await getLikeCount(pool, postId)
    const comments = await getComments(pool, postId)
    return scanPostMeta(result.rows[0], likes, comments)
}

export async function getComments(pool: Pool, postId: string): Promise<Comment[]> {
    const sql = 
    `SELECT id, users.username, users.icon_id, users.display_name, content, timestamp
        FROM comments JOIN users ON comments.username = users.username 
        WHERE post_id = $1;
    `
    const result = await query(pool, sql, [postId])
    return result.rows.map(scanComment)
}

export async function getLikeCount(pool: Pool, postId: string): Promise<number> {
    const sql = `SELECT COUNT(post_id) FROM likes WHERE post_id = $1;`
    const result = await query(pool, sql, [postId])

    if (result.rows.length === 0) {
        throw new NotFoundError('post not found')
    }

    const count = parseInt(result.rows[0].count)
    if (isNaN(count)) {
        throw new InternalError()
    }

    return count
}

export async function postExists(pool: Pool, postId: string): Promise<boolean> {
    const sql = `SELECT posts.id FROM posts WHERE id = $1;`
    const result = await query(pool, sql, [postId])
    return result.rows.length >= 1
}

export async function queryPosts(pool: Pool, limit: number, filter?: {page?: PageToken, usernames?: string[]}): Promise<PostMeta[]>{
    const values = []
    const conditions = []
    let argument = 1
    
    if (filter) {
        if (filter.page) {
            conditions.push(`timestamp <= $${argument++}`)
            values.push(filter.page.date)

            /*
            conditions.push(`id <= $${argument++}`)
            values.push(filter.page.id)
            */
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
        ORDER BY timestamp DESC
        LIMIT $${argument++};
    `
    console.log(sql)

    const result = await query(pool, sql, values)
    
    const posts = result.rows.map(async row => {
        const likes = await getLikeCount(pool, row.id)
        const comments = await getComments(pool, row.id)
        return scanPostMeta(row, likes, comments)
    })

    return Promise.all(posts)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scanPostMeta(row: any, likes: number, comments: Comment[]): PostMeta {
    return {
        id: row.id,
        content: row.content,
        auto_complete: row.auto_complete,
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