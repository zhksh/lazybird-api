import { Response } from "express"
import { Pool } from "pg"

// TODO: Move pool to service level?
export const pool = new Pool({
    database: process.env.POSTGRES_DB ?? 'postgres',
    host: process.env.POSTGRES_HOST ?? 'localhost',
    user: process.env.POSTGRES_USER ?? 'postgres',
    port: Number(process.env.POSTGRES_PORT) ?? 5432,
    password: process.env.POSTGRES_PASSWORD ?? 'secret',
})

// TODO: Move everything to error.ts?

export const HTTP_SUCCESS = 200
export const HTTP_BAD_REQUEST = 400
export const HTTP_UNAUTHORIZED = 401
export const HTTP_ALREADY_EXISTS = 409
export const HTTP_NOT_FOUND = 404
export const HTTP_INTERNAL_ERROR = 500

export function sendMappedError(res: Response, err: Error, customMsg?: string) {
    res.status(mapStatusCode(err)).send(customMsg ?? err.message)
}
  
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStatusCode(err: any): number {
    if (typeof err.status === 'function') {
        return err.status()
    }

    return HTTP_INTERNAL_ERROR
}