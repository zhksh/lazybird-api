import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { SALT_ROUNDS } from '../env'
import { BadRequestError, UnauthorizedError } from '../errors'
import { encodeJWT, Token } from './jwt'
import { User, UserMeta } from '../data/models'
import { Maybe } from 'monet'
import { getFollowersForUser, getSecretByUsername, getUserByUsername, storeUser, updateUserRecord } from '../data/userStorage'

export async function createUser(pool: Pool, userDetails: User, password: string): Promise<Token> {
    const validationErr = validateUsername(userDetails.username)
    if (validationErr.isSome()) {
        throw validationErr.some()
    }

    const hash = await hashPassword(password)

    await storeUser(pool, userDetails, hash)
    
    return encodeJWT({username: userDetails.username}).toPromise()
}

export async function authenticateUser(pool: Pool, username: string, password: string): Promise<Token> {
    const secret = await getSecretByUsername(pool, username)
    
    const passwortIsCorrect = await bcrypt.compare(password, secret)
    if (passwortIsCorrect) {
        return encodeJWT({username: username}).toPromise()
    }

    throw new UnauthorizedError('incorrect password')
}

export async function updateUser(pool: Pool, username: string, update: { displayName?: string, iconId?: string, password?: string }) {
    const updates = []

    if (update.displayName) {
        updates.push({
            row: 'display_name',
            value: update.displayName,
        })
    }

    if (update.iconId) {
        updates.push({
            row: 'icon_id',
            value: update.iconId,
        })
    }

    if (update.password) {
        const hash = await hashPassword(update.password)
        updates.push({
            row: 'secret',
            value: hash,
        })
    }
    
    return updateUserRecord(pool, username, updates)
}

export async function getUser(pool: Pool, username: string): Promise<UserMeta> {
    const userDetails = await getUserByUsername(pool, username)
    const followers = await getFollowersForUser(pool, username)
    return {...userDetails, followers }
}

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS)    
}

function validateUsername(username: string) : Maybe<BadRequestError> {
    if (username === 'me') {
        return Maybe.some(new BadRequestError('username \'me\' reserved. please use a differen username'))
    }

    if (!username.match(/^[A-Za-z0-9]*$/)) {
        return Maybe.some(new BadRequestError('username must only contain letters and numbers'))
    }
    
    // TODO: Add length restriction

    return Maybe.none()
}