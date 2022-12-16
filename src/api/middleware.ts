import { Request, Response, NextFunction } from "express"
import { HTTP_UNAUTHORIZED } from "./codes"
import { decodeJWT } from '../service/jwt'

/**
 * Middleware that checks for a JWT token and if one is present, decodes it and sets body.username.
 * If the user is not authenticated, it returns a status 401.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '')

        if (!token) {
            res.status(HTTP_UNAUTHORIZED).send('not authorized')
            return
        }

        decodeJWT(token)
        .cata(
            () => { res.status(HTTP_UNAUTHORIZED).send('not authorized') },
            payload => {
                req.body.username = payload.username
                next()
            },
        )

        // TODO: Check if user actually exists?
    } catch(e) {
        res.status(HTTP_UNAUTHORIZED).send('not authorized')
    }
}