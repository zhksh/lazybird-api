import { Pool } from "pg";
import { PostgresPostStorage, PostStorage } from "../data/postStorage";
import { PostgresUserStorage, UserStorage } from "../data/userStorage";

const connectionString = process.env.DATABASE_URL ?? "postgres://postgres:secret@localhost:5432/postgres?sslmode=disable"
const pool = new Pool({connectionString})

export const userStorage: UserStorage = new PostgresUserStorage(pool)
export const postStorage: PostStorage = new PostgresPostStorage(pool)

export function closePostgresPool(): Promise<void> {
    return pool.end()
}