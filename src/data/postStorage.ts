import { Pool } from "pg"
import {HTTP_INTERNAL_ERROR, HTTP_SUCCESS, NotFoundError} from "../errors"
import { isDuplicateKeyError, isForeignKeyError, query } from "./common"
import { PostMeta, Post, Comment, PageToken } from "./models"
import {createInContextPost} from "../service/postGeneraton";
import {createComment} from "../service/post";

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

export async function handleComment(pool: Pool, comment: {id: string, username: string, postId: string, content: string, timestamp?: Date}) {
    await storeComment(pool, comment)
    handleAutoreply(pool, comment)
}

async function handleAutoreply(pool: Pool, comment: {id: string, username: string, postId: string, content: string, timestamp?: Date} ){
    const post = await  getPost(pool, comment.postId)
    //unfortuntaly we dant really have a notion of converstion beyod replies to the original post
    if (post.auto_complete && post.user.username != comment.username){
        const resp = createInContextPost({temperature :0.5, mood: "ironic", context: [
            {"source": "me", "msg": post.content}, {"source": "you", "msg" : comment.content}]})
        resp.then((backendResponse) => {
            createComment(pool, {username: post.user.username, postId: post.id, content: JSON.parse(backendResponse).response})
        }).catch((err) => {
            console.log("autoresponse failed: " + err.toString())
        })
    }
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

export async function hasLikeRelation(pool: Pool, username: string, postId: string) {
    const sql = `SELECT username FROM likes WHERE username = $1 AND post_id = $2;`
    const values = [username, postId]
    const result = await query(pool, sql, values)
    return result.rows.length > 0
}

export async function getLikes(pool: Pool, postId: string): Promise<string[]> {
    const sql = `SELECT username FROM likes WHERE post_id = $1;`
    const result = await query(pool, sql, [postId])
    return result.rows.map(row => row.username)
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
    
    const likes = await getLikes(pool, postId)
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

    const result = await query(pool, sql, values)
    const posts = result.rows.map(async row => {
        const likes = await getLikes(pool, row.id)
        const comments = await getComments(pool, row.id)
        return scanPostMeta(row, likes, comments)
    })

    return Promise.all(posts)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scanPostMeta(row: any, likes: string[], comments: Comment[]): PostMeta {
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