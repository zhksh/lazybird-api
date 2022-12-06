import { Pool } from 'pg'
import { Request, Response } from 'express';
import express from 'express'
import { authenticateUser, createUser } from '../service/user'
import { HTTP_ALREADY_EXISTS, HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR, HTTP_NOT_FOUND, HTTP_SUCCESS, HTTP_UNAUTHORIZED } from './codes';
import { AlreadyExistsError, BadRequestError, NotFoundError, UnauthorizedError } from '../errors';

export const userRouter = express.Router()

/**
 * Create a new user.
 */
userRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body
  
  const invalid = validateSignUpRequest(body)
  if (invalid) {
    sendError(res, invalid)
    return
  }

  const {err, token} = await createUser(pool, body.username, body.password, body.iconId, body.displayName)
  if (err) {
    sendError(res, err)
    return
  }

  res.status(HTTP_SUCCESS)
    .json({
      accessToken: token,
      tokenType: 'Bearer',
    })
})

/** 
 * Authenticate a user.
 */
userRouter.post('/auth', async (req: Request, res: Response) => {
  const body = req.body
  
  const invalid = validateAuthRequest(body)
  if (invalid) {
    sendError(res, invalid)
    return
  }

  const {err, token} = await authenticateUser(pool, body.username, body.password)
  if (err) {
    sendError(res, err)
    return
  }

  res.status(HTTP_SUCCESS)
    .json({
      accessToken: token,
      tokenType: 'Bearer',
    })
})

/** 
 * Find users given a search string.
 */
 userRouter.get('/find', async (req: Request, res: Response) => {
  throw 'Not implemented'
})

/** 
 * Get the user with the given ID.
 */
 userRouter.get('/{id}', async (req: Request, res: Response) => {
  throw 'Not implemented'
})

/** 
 * Follow the given user.
 */
 userRouter.post('/{id}/follow', async (req: Request, res: Response) => {
  throw 'Not implemented'
})

const pool = new Pool({
  database: process.env.POSTGRES_DB ?? 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  user: process.env.POSTGRES_USER ?? 'postgres',
  port: Number(process.env.POSTGRES_PORT) ?? 5432,
  password: process.env.POSTGRES_PASSWORD ?? 'secret',
})

function validateSignUpRequest(body: any): Error | void {
  if (!body.username) {
    return new BadRequestError('username must not be empty')
  }

  if (!body.password) {
    return new BadRequestError('password must not be empty')
  }

  if (!body.iconId) {
    return new BadRequestError('iconId must not be empty')
  }
}

function validateAuthRequest(body: any): Error | void {
  if (!body.username) {
    return new BadRequestError('username must not be empty')
  }

  if (!body.password) {
    return new BadRequestError('password must not be empty')
  }
}

function sendError(res: Response, err: Error, customMsg?: string) {
  res.status(mapStatusCode(err)).send(customMsg ?? err.message)
}

function mapStatusCode(err: Error): number {
  // TODO: Think about moving mapping into Error classes
  if (err instanceof AlreadyExistsError) {
    return HTTP_ALREADY_EXISTS
  }

  if (err instanceof UnauthorizedError) {
    return HTTP_UNAUTHORIZED
  }

  if (err instanceof BadRequestError) {
    return HTTP_BAD_REQUEST
  }

  if (err instanceof NotFoundError) {
    return HTTP_NOT_FOUND
  }

  return HTTP_INTERNAL_ERROR
}