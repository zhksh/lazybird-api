import { Pool } from "pg";
import { AlreadyExistsError, NotFoundError } from "../errors";
import { isDuplicateKeyError, isForeignKeyError, query } from "./common";
import { User } from "./models";

// The maximum number of users returned by the search user.
const MAX_USER_RESULT = 50

export async function storeUser(pool: Pool, user: User, secret: string) {
    const sql = `INSERT INTO users(username, secret, icon_id, display_name, bio) VALUES ($1, $2, $3, $4, $5);`
    const values = [user.username, secret, user.icon_id, user.display_name, user.bio]

    await query(pool, sql, values)
        .catch(err => {
            if (isDuplicateKeyError(err)) {
                throw new AlreadyExistsError('user with same username already exists')
            }
            throw err
        })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateUserRecord(pool: Pool, username: string, updates: { row: string, value: any }[]) {
    if (updates.length === 0) {
        return
    }

    const values = []
    const sets = updates.map((update, i) => {
        values.push(update.value)
        return `${update.row} = $${i + 1}`
    })
    values.push(username)

    const sql = `UPDATE users SET ${sets.join(', ')} WHERE username = $${updates.length + 1}`
    await query(pool, sql, values)
}

export async function storeFollowerRelation(pool: Pool, username: string, followsUsername: string) {
    const sql = `INSERT INTO followers(username, follows_username) VALUES ($1, $2);`
    const values = [username, followsUsername]

    await query(pool, sql, values)
        .catch(err => {
            if (isDuplicateKeyError(err)) {
                return
            }

            if (isForeignKeyError(err)) {
                throw new NotFoundError('user not found')
            }

            throw err
        })
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

export async function getUserByUsername(pool: Pool, username: string): Promise<User> {
    const sql = `SELECT username, icon_id, display_name, bio FROM users WHERE users.username = $1;`

    const result = await query(pool, sql, [username])
    if (result.rowCount < 1) {
        throw new NotFoundError('user not found')
    }

    return result.rows[0]
}

export async function getFollowersForUser(pool: Pool, username: string): Promise<User[]> {
    const sql =
        `SELECT users.username, icon_id, display_name, bio FROM users JOIN followers ON users.username = followers.username WHERE follows_username = $1;`

    const result = await query(pool, sql, [username])
    return result.rows
}

/**
 * Get all usernames the given user follows.
 * @returns string array of all usernames the given user follows
 */
export async function getFollowedUsernames(pool: Pool, username: string): Promise<string[]> {
    const sql = `SELECT follows_username FROM followers WHERE username = $1;`
    const result = await query(pool, sql, [username])
    return result.rows.map(row => row.follows_username)
}

/**
 * Get all the users which username or displayName contains the given substring.
 */
export async function getUsersLike(pool: Pool, substring: string): Promise<User[]> {
    const sql =
        `SELECT username, icon_id, display_name, bio FROM users 
            WHERE username LIKE $1 or display_name LIKE $1 
            ORDER BY username ASC LIMIT $2`

    console.log(sql)

    const result = await query(pool, sql, [`%${substring}%`, MAX_USER_RESULT])
    return result.rows
}