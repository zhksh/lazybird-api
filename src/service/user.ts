import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { SALT_ROUNDS } from '../env'
import { BadRequestError, UnauthorizedError } from '../errors'
import { getFollowersForUser, getSecretByUsername, getUserDetailsByUsername, storeUserDetails } from '../data/storage'
import { encodeJWT } from './jwt'
import { User, UserDetails } from '../data/models'
import { Maybe } from 'monet'

export async function createUser(pool: Pool, userDetails: UserDetails, password: string): Promise<string> {
    const validationErr = validateUsername(userDetails.username)
    if (validationErr.isSome()) {
        throw validationErr.some()
    }

    const hash = await hashPassword(password)

    await storeUserDetails(pool, userDetails, hash)
    
    return encodeJWT({username: userDetails.username}).toPromise()
}

export async function authenticateUser(pool: Pool, username: string, password: string): Promise<string> {
    const secret = await getSecretByUsername(pool, username)
    
    const passwortIsCorrect = await bcrypt.compare(password, secret)
    if (passwortIsCorrect) {
        return encodeJWT({username: username}).toPromise()
    }

    throw new UnauthorizedError('incorrect password')
}

export async function getUser(pool: Pool, username: string): Promise<User> {
    const userDetails = await getUserDetailsByUsername(pool, username)
    const followers = await getFollowersForUser(pool, username)
    return {...userDetails, followers: followers.length}
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
    
    return Maybe.none()
}