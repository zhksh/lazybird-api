import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { v4 } from 'uuid'
import { storeUser } from '../storage/storage'

const SALT_ROUNDS = 8

export async function createUser(pool: Pool, login: string, password: string): Promise<Error | void> {
    const {hash, err} = await hashPassword(password)
    if (err) {
        return err
    }

    return storeUser(pool, {
        id: v4(),
        login: login,
        secret: hash,
    })
}

async function hashPassword(password: string): Promise<{ hash?: string; err?: Error }> {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS)
        return {hash: hash}
    } catch(e) {
        return {err: e}
    }
}