import { Pool } from "pg";

export interface User {
    id: string,
    login: string,
    secret: string,
} 

export async function storeUser(pool: Pool, user: User): Promise<Error | void> {
    try {
        const client = await pool.connect()

        const sql = `INSERT INTO users(id, login, secret) VALUES ($1, $2, $3)`
        const values = [user.id, user.login, user.secret]

        await client.query(sql, values)

        client.release()
    } catch(err) {
        return err
    } 
}