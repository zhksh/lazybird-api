import { Pool } from 'pg'
import express from 'express'
import { Request, Response } from 'express';
import { authenticateUser, createUser, getUser } from '../service/user'
import { HTTP_INTERNAL_ERROR, HTTP_SUCCESS } from './codes';
import { BadRequestError } from '../errors';
import { authenticate } from './middleware';
import { Maybe } from 'monet';
import { deleteFollowerRelation, storeFollowerRelation } from '../data/storage';

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
  
  const err = validateSignUpRequest(body)
  if (err.isSome()) {
    sendMappedError(res, err.some())
    return
  }

  const details = {
    username: body.username, 
    icon_id: body.iconId, 
    display_name: body.displayName,
  }

  createUser(pool, details, body.password)
  .then(token => {
    res.json({
      accessToken: token,
      tokenType: 'Bearer',
    })
  })
  .catch(err => sendMappedError(res, err))
})

/** 
 * Authenticate a user.
 */
authRouter.post('/auth', async (req: Request, res: Response) => {
  const body = req.body
  
  const err = validateAuthRequest(body)
  if (err.isSome()) {
    sendMappedError(res, err.some())
    return
  }

  authenticateUser(pool, body.username, body.password)
  .then(token => {
    res.json({
      accessToken: token,
      tokenType: 'Bearer',
    })
  })
  .catch(err => sendMappedError(res, err))  
})

/** 
 * Get the user with the given ID.
 */
userRouter.get('/:username', async (req: Request, res: Response) => {
  const username = (req.params.username === 'me') ? req.body.username : req.params.username
  
  getUser(pool, username)
    .then(user => res.json(user))
    .catch(err => sendMappedError(res, err))
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
  const username = req.body.username
  const followsUsername = req.params.username
  const shouldFollow = req.query.follow

  if (shouldFollow === 'true') {
    await storeFollowerRelation(pool, username, followsUsername)
    res.sendStatus(HTTP_SUCCESS)
    return
  }

  if (shouldFollow === 'false') {
    await deleteFollowerRelation(pool, username, followsUsername)
    res.sendStatus(HTTP_SUCCESS)
    return
  }

  sendMappedError(res, new BadRequestError('no valid follow query parameter was provid, please add ?follow=ture or ?follow=false'))
})

const pool = new Pool({
  database: process.env.POSTGRES_DB ?? 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  user: process.env.POSTGRES_USER ?? 'postgres',
  port: Number(process.env.POSTGRES_PORT) ?? 5432,
  password: process.env.POSTGRES_PASSWORD ?? 'secret',
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateSignUpRequest(body: any): Maybe<BadRequestError> {
  if (!body.username) {
    return Maybe.Some(new BadRequestError('username must not be empty'))
  }

  if (!body.password) {
    return Maybe.Some(new BadRequestError('password must not be empty'))
  }

  if (!body.iconId) {
    return Maybe.Some(new BadRequestError('iconId must not be empty'))
  }

  return Maybe.None()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAuthRequest(body: any): Maybe<BadRequestError> {
  if (!body.username) {
    return Maybe.Some(new BadRequestError('username must not be empty'))
  }

  if (!body.password) {
    return Maybe.Some(new BadRequestError('password must not be empty'))
  }

  return Maybe.None()
}

function sendMappedError(res: Response, err: Error, customMsg?: string) {
  res.status(mapStatusCode(err)).send(customMsg ?? err.message)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStatusCode(err: any): number {
  if (typeof err.status === 'function') {
    return err.status
  }

  return HTTP_INTERNAL_ERROR
}