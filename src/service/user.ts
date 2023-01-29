import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { SALT_ROUNDS } from '../env'
import {BadRequestError, UnauthorizedError} from '../errors'
import { encodeJWT, Token } from './jwt'
import { User, UserMeta } from '../data/models'
import { Maybe } from 'monet'
import { getUsersLike, getFollowersForUser, getSecretByUsername, getUserByUsername, storeUser, updateUserRecord } from '../data/userStorage'
import {generateSelfDescription} from "./postGeneraton";

const MAX_USERNAME_LENGHT = 20

export async function createUser(pool: Pool, userDetails: User,
                                 options =  {temperature: 1.4, mood: "ironic", ours: "false"},
                                 password: string): Promise<Token> {
    const validationErr = validateUsername(userDetails.username)
    if (validationErr.isSome()) {
        throw validationErr.some()
    }

    const hash = await hashPassword(password)

    await storeUser(pool, userDetails, hash)
    storeSelfDescpription(pool, options, userDetails.username)

    return encodeJWT({username: userDetails.username}).toPromise()
}


async function storeSelfDescpription(pool: Pool, options: {temperature: number , mood: string, ours: string}, userName: string){
    const selfDescription = generateSelfDescription(options)
    selfDescription.then((backendResonse) => {
        const data = JSON.parse(backendResonse)
        updateUser(pool, userName, {bio: data.response})
    }).catch((err) => {
        console.log("Creating and storing self description failed:"+ err.toString())
    })
}

export async function authenticateUser(pool: Pool, username: string, password: string): Promise<Token> {
    const secret = await getSecretByUsername(pool, username)
    
    const passwortIsCorrect = await bcrypt.compare(password, secret)
    if (passwortIsCorrect) {
        return encodeJWT({username: username}).toPromise()
    }

    throw new UnauthorizedError('incorrect password')
}

export async function updateUser(pool: Pool, username: string, update:
    { displayName?: string, iconId?: string, password?: string, bio?: string }
) {
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

    if (update.bio) {
        updates.push({
            row: 'bio',
            value: update.bio,
        })
    }
    
    return updateUserRecord(pool, username, updates)
}

export async function getUser(pool: Pool, username: string): Promise<UserMeta> {
    const userDetails = await getUserByUsername(pool, username)
    const followers = await getFollowersForUser(pool, username)
    return {...userDetails, followers }
}

export async function searchUsers(pool: Pool, search: string): Promise<User[]> {
    return getUsersLike(pool, search)
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
    
    if (username.length > MAX_USERNAME_LENGHT) {
        return Maybe.some(new BadRequestError(`username cannot be longer than ${MAX_USERNAME_LENGHT} characters`))
    }

    return Maybe.none()
}
