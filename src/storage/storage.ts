import { Pool } from "pg";
import { AlreadyExistsError, NotFoundError } from "../errors";

export interface User {
    id: string,
    username: string,
    secret: string,
    icon_id: string,
    display_name?: string,
} 

export async function storeUser(pool: Pool, user: User): Promise<AlreadyExistsError | Error | void> {
    try {
        const client = await pool.connect()

        const sql = `INSERT INTO users(id, username, secret, icon_id, display_name) VALUES ($1, $2, $3, $4, $5)`
        const values = [user.id, user.username, user.secret, user.icon_id, user.display_name]

        await client.query(sql, values)

        client.release()
    } catch(err) {
        if (isDuplicateKeyError(err)) {
            return new AlreadyExistsError('user with same username already exists')
        }

        return err
    } 
}

export async function getUserByUsername(pool: Pool, username: string): Promise<{err?: Error, user?: User}> {
    try {
        const client = await pool.connect()

        const sql = `SELECT * FROM users WHERE users.username = $1`

        const result = await client.query(sql, [username])

        if (result.rowCount < 1) {
            return {err: new NotFoundError('user not found')}
        }

        client.release()

        return {user: result.rows[0]}
    } catch(err) {
        return err
    } 
}

function isDuplicateKeyError(err: any): boolean {
    if (err) {
        return err.code === '23505'
    }
    return false
}