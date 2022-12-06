import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'
import { v4 } from 'uuid'
import { AlreadyExistsError } from '../storage/errors'
import { storeUser, User } from '../storage/storage'

const SALT_ROUNDS = 8
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY ?? 'dev_only'

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

    return generateJWT(user)
}

async function hashPassword(password: string): Promise<{ hash?: string; err?: Error }> {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS)
        return {hash: hash}
    } catch(e) {
        return {err: e}
    }
}

function generateJWT(user: User): {err?: Error, token?: string} {
    try {
        const token = jwt.sign({userId: user.id}, JWT_SECRET_KEY)
        return {token: token}
    } catch(e) {
        return {err: new Error('failed to sign JWT')}
    }
}