import bcrypt from 'bcrypt'
import { Pool } from 'pg'
import { SALT_ROUNDS } from '../env'
import {BadRequestError, HTTP_INTERNAL_ERROR, HTTP_SUCCESS, UnauthorizedError} from '../errors'
import { encodeJWT, Token } from './jwt'
import { User, UserMeta } from '../data/models'
import { Maybe } from 'monet'
import { getUsersLike, getFollowersForUser, getSecretByUsername, getUserByUsername, storeUser, updateUserRecord } from '../data/userStorage'
import {generateSelfDescription} from "./postGeneraton";

const MAX_USERNAME_LENGHT = 20

export async function createUser(pool: Pool, userDetails: User, password: string): Promise<Token> {
    const validationErr = validateUsername(userDetails.username)
    if (validationErr.isSome()) {
        throw validationErr.some()
    }

    const hash = await hashPassword(password)

    await storeUser(pool, userDetails, hash)
    storeSelfDescpription(pool, userDetails.username)

    return encodeJWT({username: userDetails.username}).toPromise()
}


async function storeSelfDescpription(pool: Pool, userName: string){
    const selfDescription = generateSelfDescription(
        {temperature: 0.8, mood: "ironic", ours: "false"})
    selfDescription.then((backendResonse) => {
        const data = JSON.parse(backendResonse)
        updateUser(pool, userName, {selfdesc: data.response})
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
    { displayName?: string, iconId?: string, password?: string, selfdesc?: string }
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

    if (update.selfdesc) {
        updates.push({
            row: 'bio',
            value: update.selfdesc,
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
    const users = await getUsersLike(pool, search)
    return sortUsersByMatch(users, search)
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

// TODO: Check performance, especially on many search calls
function sortUsersByMatch(users: User[], match: string): User[] {
    const scores = users.map((user, i) => {
        let score = levenshteinDistance(match, user.username)  
        if (user.display_name) {
            score = Math.min(score, levenshteinDistance(match, user.display_name))
        }

        return {i, score}
    })

    return scores.sort((a, b) => a.score - b.score).map(v => users[v.i])
}

function levenshteinDistance(a: string, b: string): number {
    const matrix = Array.from({ length: a.length }).map(() => Array.from({ length: b.length }).map(() => 0))
  
    for (let i = 0; i < a.length; i++) matrix[i][0] = i
  
    for (let i = 0; i < b.length; i++) matrix[0][i] = i
  
    for (let j = 0; j < b.length; j++)
      for (let i = 0; i < a.length; i++)
        matrix[i][j] = Math.min(
          (i == 0 ? 0 : matrix[i - 1][j]) + 1,
          (j == 0 ? 0 : matrix[i][j - 1]) + 1,
          (i == 0 || j == 0 ? 0 : matrix[i - 1][j - 1]) + (a[i] == b[j] ? 0 : 1)
        )
  
    return matrix[a.length - 1][b.length - 1]
  }