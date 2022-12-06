import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { v4 } from 'uuid'
import { JWT_SECRET_KEY, SALT_ROUNDS } from '../env'
import { AlreadyExistsError } from '../errors'
import { storeUser, User } from '../storage/storage'
import { encodeJWT } from './jwt'

export async function createUser(pool: Pool, username: string, password: string, iconId: string, displayName?: string): Promise<{err?: Error | AlreadyExistsError, token?: string}> {
    const {hash, err} = await hashPassword(password)
    if (err) {
        return {err: err}
    }

    const user = {
        id: v4(),
        username: username, 
        secret: hash,
        iconId: iconId,
        displayName: displayName,
    }

    const storeErr = await storeUser(pool, user)
    if (storeErr) {
        return {err: storeErr}
    }

    return encodeJWT({userId: user.id})
}

async function hashPassword(password: string): Promise<{ hash?: string; err?: Error }> {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS)
        return {hash: hash}
    } catch(e) {
        return {err: e}
    }
}
