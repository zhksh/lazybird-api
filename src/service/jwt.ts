import jwt from 'jsonwebtoken'
import { Either } from 'monet'
import { JWT_SECRET_KEY } from "../env"

export interface Payload {    
    username: string
}

export function encodeJWT(payload: Payload): Either<Error, string> {
    try {
        const token = jwt.sign(payload, JWT_SECRET_KEY)
        return Either.right(token)
    } catch(e) {
        return Either.left(new Error('failed to sign JWT'))
    }
}

export function decodeJWT(token: string): Either<Error, Payload> {
    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY, {})
        return Either.right(decoded as Payload)        
    } catch(e) {
        return Either.left(new Error('failed to decode JWT'))
    }
}