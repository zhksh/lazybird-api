import { Pool } from 'pg'
import express from 'express'
import { createUser } from '../service/user'
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR, HTTP_SUCCESS } from './codes';

export const userRouter = express.Router()

/**
 * Create a new user.
 */
userRouter.post('/create', async function(req, res) {
  const login:string = req.body.login
  const password:string = req.body.password

  if (!login || !password) {
    // TODO: Proper error response
    res.status(HTTP_BAD_REQUEST).json('Request body should include login and password.')
    return
  }

  const err = await createUser(pool, login, password)
  if (err) {
    res.status(HTTP_INTERNAL_ERROR).send('Something went wrong.')
    console.log('error', err)
    return
  }

  res.status(HTTP_SUCCESS).send()
})

userRouter.post('/update', async function(req, res) {
  res.status(HTTP_SUCCESS).send()
})

const pool = new Pool({
  database: process.env.POSTGRES_DB ?? 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  user: process.env.POSTGRES_USER ?? 'postgres',
  port: Number(process.env.POSTGRES_PORT) ?? 5432,
  password: process.env.POSTGRES_PASSWORD ?? 'secret',
})
