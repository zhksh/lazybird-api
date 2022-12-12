import { Pool, QueryResult } from "pg";
import { AlreadyExistsError, NotFoundError } from "../errors";
import { UserDetails } from "./models";

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

    // TODO: Catch duplicate primary key error and omit to make function idempotent?
    await query(pool, sql, values)
}

export async function deleteFollowerRelation(pool: Pool, username: string, followsUsername: string) {
    const sql = `DELETE FROM followers WHERE username = $1 AND follows_username = $2;`
    const values = [username, followsUsername]
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
    // TODO: Implement once follow table exists
    throw 'Implement Me!'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isDuplicateKeyError(err: any): boolean {
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