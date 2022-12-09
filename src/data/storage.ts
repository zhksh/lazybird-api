import { Pool } from "pg";
import { AlreadyExistsError, NotFoundError } from "../errors";
import { UserDetails } from "./models";

export async function storeUserDetails(pool: Pool, user: UserDetails, secret: string): Promise<AlreadyExistsError | Error | void> {
    try {
        const client = await pool.connect()

        const sql = `INSERT INTO users(username, secret, icon_id, display_name) VALUES ($1, $2, $3, $4)`
        const values = [user.username, secret, user.icon_id, user.display_name]

        await client.query(sql, values)

        client.release()
    } catch(err) {
        if (isDuplicateKeyError(err)) {
            return new AlreadyExistsError('user with same username already exists')
        }

        return err
    } 
}

export async function getSecretByUsername(pool: Pool, username: string): Promise<{err?: Error, secret?: string}> {
    try {
        const client = await pool.connect()

        const sql = `SELECT secret FROM users WHERE users.username = $1`

        const result = await client.query(sql, [username])

        if (result.rowCount < 1) {
            return {err: new NotFoundError('user not found')}
        }

        client.release()

        return {secret: result.rows[0].secret}
    } catch(err) {
        return err
    } 
}


export async function getUserDetailsByUsername(pool: Pool, username: string): Promise<{err?: Error, userDetails?: UserDetails}> {
    try {
        const client = await pool.connect()

        const sql = `SELECT username, icon_id, display_name FROM users WHERE users.username = $1`

        const result = await client.query(sql, [username])

        if (result.rowCount < 1) {
            return {err: new NotFoundError('user not found')}
        }

        client.release()

        return {userDetails: result.rows[0]}
    } catch(err) {
        return err
    } 
}

export async function getFollowersForUser(pool: Pool, username: string): Promise<{err?: Error, followers?: UserDetails[]}> {
    // TODO: Implement once follow table exists
    throw 'Implement Me!'
}

function isDuplicateKeyError(err: any): boolean {
    if (err) {
        return err.code === '23505'
    }
    return false
}