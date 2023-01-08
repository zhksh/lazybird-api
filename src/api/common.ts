import { Response } from "express"
import { Pool } from "pg"

const connectionString = process.env.DATABASE_URL ?? "postgres://postgres:secret@localhost:5432/postgres?sslmode=disable"
export const pool = new Pool({connectionString})

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