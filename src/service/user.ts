import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { SALT_ROUNDS } from '../env'
import { AlreadyExistsError, NotFoundError, UnauthorizedError } from '../errors'
import { getFollowersForUser, getSecretByUsername, getUserDetailsByUsername, storeUserDetails } from '../data/storage'
import { encodeJWT } from './jwt'
import { User, UserDetails } from '../data/models'

export async function createUser(pool: Pool, userDetails: UserDetails, password: string): Promise<{err?: Error | AlreadyExistsError, token?: string}> {
    if (userDetails.username === 'me') {
        return {err: new AlreadyExistsError('username \'me\' reserved. please use a differen username')} 
    }
    
    const {hash, err} = await hashPassword(password)
    if (err) {
        return {err: err}
    }

    const storeErr = await storeUserDetails(pool, userDetails, hash)
    if (storeErr) {
        return {err: storeErr}
    }

    return encodeJWT({username: userDetails.username})
}

export async function authenticateUser(pool: Pool, username: string, password: string): Promise<{err?: Error | UnauthorizedError, token?: string}> {
    const {secret, err} = await getSecretByUsername(pool, username)
    if (err) {
        return {err: err}
    }

    try {
        const passwortIsCorrect = await bcrypt.compare(password, secret)
        if (passwortIsCorrect) {
            return encodeJWT({username: username})
        }

        return {err: new UnauthorizedError('incorrect password')}
    } catch(e) {
        return {err: e}
    }
}

export async function getUser(pool: Pool, username: string): Promise<{err?: Error | NotFoundError, user?: User}> {
    const {err, userDetails} = await getUserDetailsByUsername(pool, username)
    if (err) {
        return {err: err}
    }

    // TODO: Think about functional style error return (https://medium.com/fashioncloud/a-functional-programming-approach-to-error-handling-in-typescript-d9e8c58ab7f)
    const result = await getFollowersForUser(pool, username)
    if (result.err) {
        return {err: err}
    }
    
    return {user: {...userDetails, followers: result.followers.length}}
}

async function hashPassword(password: string): Promise<{ hash?: string; err?: Error }> {
    try {
        const hash = await bcrypt.hash(password, SALT_ROUNDS)
        return {hash: hash}
    } catch(e) {
        return {err: e}
    }
}
