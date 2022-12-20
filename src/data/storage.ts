import { Pool, QueryResult } from "pg";
import { AlreadyExistsError, NotFoundError } from "../errors";
import { Post, PostContent, UserDetails } from "./models";

export async function storeUserDetails(pool: Pool, user: UserDetails, secret: string) {
    const sql = `INSERT INTO users(username, secret, icon_id, display_name) VALUES ($1, $2, $3, $4);`
    const values = [user.username, secret, user.icon_id, user.display_name]
    
    await query(pool, sql, values)
        .catch(err => {
            if (isDuplicateKeyError(err)) {
                throw new AlreadyExistsError('user with same username already exists')
            }
            throw err
        })
}

export async function storeFollowerRelation(pool: Pool, username: string, followsUsername: string) {
    const sql = `INSERT INTO followers(username, follows_username) VALUES ($1, $2);`
    const values = [username, followsUsername]

    await query(pool, sql, values)
        .catch(err => {
            if (isDuplicateKeyError(err)) {
                return
            }

            throw err
        })
}

export async function deleteFollowerRelation(pool: Pool, username: string, followsUsername: string) {
    const sql = `DELETE FROM followers WHERE username = $1 AND follows_username = $2;`
    const values = [username, followsUsername]
    await query(pool, sql, values)
}

export async function storePost(pool: Pool, post: PostContent, username: string) {
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
                throw new NotFoundError('not found')
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

            throw err
        })
}

export async function deleteLikeRelation(pool: Pool, username: string, postId: string) {
    const sql = `DELETE FROM likes WHERE username = $1 AND post_id = $2;`
    const values = [username, postId]
    await query(pool, sql, values)
}

export async function getSecretByUsername(pool: Pool, username: string): Promise<string> {
    const sql = `SELECT secret FROM users WHERE users.username = $1;`
    
    const result = await query(pool, sql, [username])        
    if (result.rowCount < 1) {
        throw new NotFoundError('user not found')
    }

    return result.rows[0].secret
}

export async function getUserDetailsByUsername(pool: Pool, username: string): Promise<UserDetails> {
    const sql = `SELECT username, icon_id, display_name FROM users WHERE users.username = $1;`
    
    const result = await query(pool, sql, [username])
    if (result.rowCount < 1) {
        throw new NotFoundError('user not found')
    }

    return result.rows[0]
}

export async function getFollowersForUser(pool: Pool, username: string): Promise<UserDetails[]> {
    const sql = 
    `SELECT users.username, icon_id, display_name FROM users JOIN followers ON users.username = followers.follows_username WHERE follows_username = $1`
    
    const result = await query(pool, sql, [username])
    return result.rows
}

/**
 * Get all usernames the given user follows.
 * @returns string array of all usernames the given user follows
 */
export async function getFollowedUsernames(pool: Pool, username: string): Promise<string[]> {
    const sql = `SELECT follows_username FROM followers WHERE username = $1`
    const result = await query(pool, sql, [username])
    return result.rows.map(row => row.follows_username)
}

export async function queryPosts(pool: Pool, limit: number, filter?: {after?: Date, usernames?: string[]}): Promise<Post[]>{
    const values = []
    const conditions = []
    let argument = 1
    
    if (filter) {
        if (filter.after) {
            conditions.push(`timestamp < $${argument++}`)
            values.push(filter.after)
        }
    
        if (filter.usernames) {
            conditions.push(`posts.username = ANY($${argument++}::text[])`)
            values.push(filter.usernames)
        }
    }

    const where = buildWhereClause(conditions)

    values.push(limit)

    const sql = 
    `SELECT id, content, auto_complete, timestamp, users.username, icon_id, display_name 
        FROM posts JOIN users ON posts.username = users.username ${where} 
        ORDER BY timestamp DESC 
        LIMIT $${argument++}
    `

    const result = await query(pool, sql, values)
    return result.rows.map(scanPost)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function scanPost(row: any): Post {
    return {
        id: row.id,
        content: row.content,
        auto_complete: row.auto_complete,
        timestamp: row.timestamp,
        user: {
            username: row.username,
            icon_id: row.icon_id,
            display_name: row.display_name,            
            followers: 0,   // TODO: Use real followers or remove
        },
        commentCount: 0,    // TODO: Use actual comment count once implemented
        likes: 0,           // TODO: Use actual likes once implemented
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isDuplicateKeyError(err: any): boolean {
    if (err) {
        return err.code === '23505'
    }
    return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isForeignKeyError(err: any): boolean {
    if (err) {
        return err.code === '23505'
    }
    return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function query(pool: Pool, sql: string, values?: any[]): Promise<QueryResult<any>> {
    const client = await pool.connect()
    return client.query(sql, values).finally(() => client.release())
}

function buildWhereClause(conditions: string[]): string {
    if (conditions.length > 0) {
        return 'WHERE ' + conditions.join(' AND ')
    }
    
    return ''
}