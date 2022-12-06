import { Pool } from "pg";
import { AlreadyExistsError } from "../errors";

export interface User {
    id: string,
    username: string,
    secret: string,
    iconId: string,
    displayName?: string,
} 

export async function storeUser(pool: Pool, user: User): Promise<AlreadyExistsError | Error | void> {
    try {
        // TODO: Map 'already exists' error and pass it to the user.
        const client = await pool.connect()

        const sql = `INSERT INTO users(id, username, secret, icon_id, display_name) VALUES ($1, $2, $3, $4, $5)`
        const values = [user.id, user.username, user.secret, user.iconId, user.displayName]

        await client.query(sql, values)

        client.release()
    } catch(err) {
        console.log(err)
        
        if (isDuplicateKeyError(err)) {
            return new AlreadyExistsError()
        }

        return err
    } 
}

function isDuplicateKeyError(err: any): boolean {
    if (err) {
        return err.code === '23505'
    }
    return false
}