import { Request, Response, NextFunction } from "express"
import { decodeJWT } from '../service/jwt'
import { Either } from "monet"
import { BadRequestError, UnauthorizedError } from "../errors"
import { sendMappedError } from "./common"
import { logger } from "../logger"

export const logRequest = (req: Request, res: Response, next: NextFunction) => {        
    res.on('finish', () => {
        logger.http({
            method: req.method,
            route: req.originalUrl,
            status: res.statusCode,
            statusMessage: res.statusMessage,
            body: req.body,
            query: req.query,
        })
    })
    
    next()
}

/**
 * Middleware that checks for a JWT token and if one is present, decodes it and sets body.username.
 * If the user is not authenticated, it returns a status 401.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    parseToken(req)
    .cata(
        err => sendMappedError(res, err), 
        token => {
            decodeJWT(token)
            .cata(
                () => sendMappedError(res, new UnauthorizedError('invalid token provided')),
                payload => {
                    req.body.username = payload.username
                    next()
                },
        )
    })
}

function parseToken(req: Request): Either<BadRequestError, string> {
    const auth = req.header('Authorization')
    if (!auth) {
        return Either.left(new BadRequestError('please provide an authentication header including the JWT token'))
    }

    const split = auth.split(' ')
    if (split.length !== 2) {
        return Either.left(new BadRequestError('invalid authorization header provided'))
    }

    if (split[0] !== 'Bearer') {
        return Either.left(new BadRequestError('invalid authorization header provided, use \'Bearer <JWT>\''))
    }

    return Either.right(split[1])
}