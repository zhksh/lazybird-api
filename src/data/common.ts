import { Pool, QueryResult } from "pg"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDuplicateKeyError(err: any): boolean {
    if (err) {
        return err.code === '23505'
    }
    return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isForeignKeyError(err: any): boolean {
    if (err) {
        return err.code === '23503'
    }
    return false
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query(pool: Pool, sql: string, values?: any[]): Promise<QueryResult<any>> {
    const client = await pool.connect()
    return client.query(sql, values).finally(() => client.release())
}