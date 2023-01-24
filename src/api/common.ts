import { Response } from "express"
import { Pool } from "pg"
import { HTTP_INTERNAL_ERROR } from "../errors"

const connectionString = process.env.DATABASE_URL ?? "postgres://postgres:secret@localhost:5432/postgres?sslmode=disable"
export const pool = new Pool({connectionString})

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