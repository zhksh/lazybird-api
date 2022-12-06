import { Pool } from 'pg'
import { Request, Response } from 'express';
import express from 'express'
import { createUser } from '../service/user'
import { HTTP_ALREADY_EXISTS, HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR, HTTP_SUCCESS } from './codes';
import { AlreadyExistsError } from '../errors';

export const userRouter = express.Router()

/**
 * Create a new user.
 */
userRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body
  
  const invalid = validateSignUpRequest(body)
  if (invalid) {
    res.status(HTTP_BAD_REQUEST).json(invalid.message)
    return
  }

  const {err, token} = await createUser(pool, body.username, body.password, body.iconId, body.displayName)
  if (err) {
    if (err instanceof AlreadyExistsError) {
      res.status(HTTP_ALREADY_EXISTS).send('A user with the given username already exists')
      return
    }

    res.status(HTTP_INTERNAL_ERROR).send('Something went wrong.')
    return
  }

  res.
    status(HTTP_SUCCESS).
    send({
      accessToken: token,
      tokenType: 'Bearer',
    })
})

/** 
 * Authenticate a user.
 */
userRouter.post('/auth', async (req: Request, res: Response) => {
  throw 'Not implemented'
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

userRouter.post('/update', async (req: Request, res: Response) => {
  throw 'Not implemented'
})

const pool = new Pool({
  database: process.env.POSTGRES_DB ?? 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  user: process.env.POSTGRES_USER ?? 'postgres',
  port: Number(process.env.POSTGRES_PORT) ?? 5432,
  password: process.env.POSTGRES_PASSWORD ?? 'secret',
})

function validateSignUpRequest(body): Error | void {
  if (!body.username) {
    return new Error('username must not be empty')
  }

  if (!body.password) {
    return new Error('password must not be empty')
  }

  if (!body.iconId) {
    return new Error('iconId must not be empty')
  }
}