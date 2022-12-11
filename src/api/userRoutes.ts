import { Pool } from 'pg'
import { Request, Response } from 'express';
import express from 'express'
import { authenticateUser, createUser, getUser } from '../service/user'
import { HTTP_ALREADY_EXISTS, HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR, HTTP_NOT_FOUND, HTTP_SUCCESS, HTTP_UNAUTHORIZED } from './codes';
import { AlreadyExistsError, BadRequestError, NotFoundError, UnauthorizedError } from '../errors';
import { authenticate } from './middleware';

/**
 * Defines all routes necessary for authorization. 
 */
export const authRouter = express.Router()

/**
 * Defines all users/ routes. Requires all requests to be authenticated.
 */
export const userRouter = express.Router()
userRouter.use(authenticate)

/**
 * Create a new user.
 */
authRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body
  
  const invalid = validateSignUpRequest(body)
  if (invalid) {
    sendError(res, invalid)
    return
  }

  const details = {
    username: body.username, 
    icon_id: body.iconId, 
    display_name: body.displayName,
  }

  createUser(pool, details, body.password)
  .then(token => {
    res.status(HTTP_SUCCESS)
    .json({
      accessToken: token,
      tokenType: 'Bearer',
    })
  })
  .catch(err => sendError(res, err))
})

/** 
 * Authenticate a user.
 */
authRouter.post('/auth', async (req: Request, res: Response) => {
  const body = req.body
  
  const invalid = validateAuthRequest(body)
  if (invalid) {
    sendError(res, invalid)
    return
  }

  authenticateUser(pool, body.username, body.password)
  .then(token => {
    res.status(HTTP_SUCCESS)
    .json({
      accessToken: token,
      tokenType: 'Bearer',
    })
  })
  .catch(err => sendError(res, err))  
})

/** 
 * Get the user with the given ID.
 */
userRouter.get('/:username', async (req: Request, res: Response) => {
  const username = (req.params.username === 'me') ? req.body.username : req.params.username
  
  const {err, user} = await getUser(pool, username)
  if (err) {
    sendError(res, err)
    return
  }

  res.status(HTTP_SUCCESS)
    .json(user)
})

/** 
 * Find users given a search string.
 */
userRouter.get('/find', async (req: Request, res: Response) => {
  throw 'Not implemented'
})

/** 
 * Follow the given user.
 */
 userRouter.post('/:username/follow', async (req: Request, res: Response) => {
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