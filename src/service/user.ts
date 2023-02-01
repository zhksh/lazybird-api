import bcrypt from 'bcrypt'
import { SALT_ROUNDS } from '../env'
import {BadRequestError, UnauthorizedError} from '../errors'
import { encodeJWT, Token } from './jwt'
import { User, UserMeta } from '../data/models'
import { Maybe } from 'monet'
import { UserStorage } from '../data/userStorage'
import { generateSelfDescription } from "./postGeneraton";

const MAX_USERNAME_LENGHT = 20

export async function createUser(
    userStorage: UserStorage, 
    userDetails: User,
    options =  {temperature: 1.4, mood: "ironic", ours: "false"},
    password: string
): Promise<Token> {
    
    const validationErr = validateUsername(userDetails.username)
    if (validationErr.isSome()) {
        throw validationErr.some()
    }

    const hash = await hashPassword(password)

    await userStorage.storeUser(userDetails, hash)
    storeSelfDescpription(userStorage, options, userDetails.username)

    return encodeJWT({username: userDetails.username}).toPromise()
}


async function storeSelfDescpription(userStorage: UserStorage, options: {temperature: number , mood: string, ours: string}, userName: string){
    const selfDescription = generateSelfDescription(options)
    selfDescription.then((backendResonse) => {
        const data = JSON.parse(backendResonse)
        updateUser(userStorage, userName, {bio: data.response})
    }).catch((err) => {
        console.log("Creating and storing self description failed:"+ err.toString())
    })
}

export async function authenticateUser(userStorage: UserStorage, username: string, password: string): Promise<Token> {
    const secret = await userStorage.getSecretByUsername(username)
    
    const passwordIsCorrect = await bcrypt.compare(password, secret)
    if (passwordIsCorrect) {
        return encodeJWT({username: username}).toPromise()
    }

    throw new UnauthorizedError('incorrect password')
}

export async function updateUser(userStorage: UserStorage, username: string, update:
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
    
    return userStorage.updateUserRecord(username, updates)
}

export async function getUser(userStorage: UserStorage, username: string): Promise<UserMeta> {
    const userDetails = await userStorage.getUserByUsername(username)
    const followers = await userStorage.getFollowersForUser(username)
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
    
    if (username.length > MAX_USERNAME_LENGHT) {
        return Maybe.some(new BadRequestError(`username cannot be longer than ${MAX_USERNAME_LENGHT} characters`))
    }

    return Maybe.none()
}
