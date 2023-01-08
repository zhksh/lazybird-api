import jwt from 'jsonwebtoken'
import { Either } from 'monet'
import { JWT_ACCESS_SECRET } from "../env"

export interface Payload {    
    username: string
}

export interface Token {
    tokenType: string
    accessToken: string
}

export function encodeJWT(payload: Payload): Either<Error, Token> {
    try {
        // In a production app a refresh token should be added
        const token = {
            tokenType: 'Bearer',
            accessToken: jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: '30d' }),
        }
        
        return Either.right(token)
    } catch(e) {
        return Either.left(e)
    }
}

export function decodeJWT(token: string): Either<Error, Payload> {
    try {
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {})
        return Either.right(decoded as Payload)        
    } catch(e) {
        return Either.left(e)
    }
}