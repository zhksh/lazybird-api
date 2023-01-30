import { Pool } from "pg";
import { AlreadyExistsError, NotFoundError } from "../errors";
import { isDuplicateKeyError, isForeignKeyError, query } from "./common";
import { User } from "./models";

// The maximum number of users returned by the search user.
const MAX_USER_RESULT = 50

export interface UserStorage {
    storeUser(user: User, secret: string): Promise<void>
    updateUserRecord(username: string, updates: { row: string, value: any }[]): Promise<void>
    storeFollowerRelation(username: string, followsUsername: string): Promise<void>
    deleteFollowerRelation(username: string, followsUsername: string): Promise<void>
    getSecretByUsername(username: string): Promise<string>
    getUserByUsername(username: string): Promise<User>
    getFollowersForUser(username: string): Promise<User[]> 
    getFollowedUsernames(username: string): Promise<string[]>
    getUsersLike(substring: string): Promise<User[]>
}

export class PostgresUserStorage implements UserStorage {
    private pool: Pool

    constructor(pool: Pool) {
        this.pool = pool
    }

    public async storeUser(user: User, secret: string) {
        const sql = `INSERT INTO users(username, secret, icon_id, display_name, bio) VALUES ($1, $2, $3, $4, $5);`
        const values = [user.username, secret, user.icon_id, user.display_name, user.bio]
    
        await query(this.pool, sql, values)
            .catch(err => {
                if (isDuplicateKeyError(err)) {
                    throw new AlreadyExistsError('user with same username already exists')
                }
                throw err
            })
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async updateUserRecord(username: string, updates: { row: string, value: any }[]) {
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
        await query(this.pool, sql, values)
    }
    
    public async storeFollowerRelation(username: string, followsUsername: string) {
        const sql = `INSERT INTO followers(username, follows_username) VALUES ($1, $2);`
        const values = [username, followsUsername]
    
        await query(this.pool, sql, values)
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
    
    public async deleteFollowerRelation(username: string, followsUsername: string) {
        const sql = `DELETE FROM followers WHERE username = $1 AND follows_username = $2;`
        const values = [username, followsUsername]
        await query(this.pool, sql, values)
    }
    
    public async getSecretByUsername(username: string): Promise<string> {
        const sql = `SELECT secret FROM users WHERE users.username = $1;`
    
        const result = await query(this.pool, sql, [username])
        if (result.rowCount < 1) {
            throw new NotFoundError('user not found')
        }
    
        return result.rows[0].secret
    }
    
    public async getUserByUsername(username: string): Promise<User> {
        const sql = `SELECT username, icon_id, display_name, bio FROM users WHERE users.username = $1;`
    
        const result = await query(this.pool, sql, [username])
        if (result.rowCount < 1) {
            throw new NotFoundError('user not found')
        }
    
        return result.rows[0]
    }
    
    public async getFollowersForUser(username: string): Promise<User[]> {
        const sql =
            `SELECT users.username, icon_id, display_name, bio FROM users JOIN followers ON users.username = followers.username WHERE follows_username = $1;`
    
        const result = await query(this.pool, sql, [username])
        return result.rows
    }
    
    /**
     * Get all usernames the given user follows.
     * @returns string array of all usernames the given user follows
     */
    public async getFollowedUsernames(username: string): Promise<string[]> {
        const sql = `SELECT follows_username FROM followers WHERE username = $1;`
        const result = await query(this.pool, sql, [username])
        return result.rows.map(row => row.follows_username)
    }
    
    /**
     * Get all the users which username or displayName contains the given substring.
     */
    public async getUsersLike(substring: string): Promise<User[]> {
        const sql =
            `SELECT username, icon_id, display_name, bio FROM users 
                WHERE username ILIKE $1 or display_name ILIKE $1 
                ORDER BY LEVENSHTEIN(username, $1) ASC LIMIT $2`
    
        const result = await query(this.pool, sql, [`%${substring}%`, MAX_USER_RESULT])
        return result.rows
    }
}
