import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { v4 } from 'uuid'
import { SALT_ROUNDS } from '../env'
import { AlreadyExistsError, UnauthorizedError } from '../errors'
import { getUserByUsername, storeUser } from '../storage/storage'
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
        icon_id: iconId,
        display_name: displayName,
    }

    const storeErr = await storeUser(pool, user)
    if (storeErr) {
        return {err: storeErr}
    }

    return encodeJWT({userId: user.id})
}

export async function authenticateUser(pool: Pool, username: string, password: string): Promise<{err?: Error | UnauthorizedError, token?: string}> {
    const {user, err} = await getUserByUsername(pool, username)
    if (err) {
        return {err: err}
    }

    try {
        const passwortIsCorrect = await bcrypt.compare(password, user.secret)
        if (passwortIsCorrect) {
            return encodeJWT({userId: user.id})
        }

        return {err: new UnauthorizedError('incorrect password')}
    } catch(e) {
        return {err: e}
    }
}

async function hashPassword(password: string): Promise<{ hash?: string; err?: Error }> {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS)
        return {hash: hash}
    } catch(e) {
        return {err: e}
    }
}
