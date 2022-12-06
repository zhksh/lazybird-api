import jwt from 'jsonwebtoken'
import { JWT_SECRET_KEY } from "../env"

export interface Payload {    
    userId: string
}

export function encodeJWT(payload: Payload): {err?: Error, token?: string} {
    try {
        const token = jwt.sign(payload, JWT_SECRET_KEY)
        return {token: token}
    } catch(e) {
        return {err: new Error('failed to sign JWT')}
    }
}

export function decodeJWT(token: string): {err?: Error, payload?: Payload} {
    try {
        const decoded = jwt.verify(token, JWT_SECRET_KEY, {})
        return {payload: decoded as Payload}        
    } catch(e) {
        return {err: e}
    }
}