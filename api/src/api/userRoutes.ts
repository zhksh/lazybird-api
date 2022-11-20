import express from 'express'
import { createUser } from '../service/user'
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR, HTTP_SUCCESS } from './codes';

export const userRouter = express.Router()

/**
 * Create a new user.
 */
userRouter.post('/create', function(req, res) {
  const login:string = req.body.login
  const password:string = req.body.password

  if (!login || !password) {
    // TODO: Proper error response
    res.status(HTTP_BAD_REQUEST).json('Request body should include login and password.')
    return
  }

  const {err} = createUser(login, password)
  if (err) {
    res.status(HTTP_INTERNAL_ERROR).send('Something went wrong.')
    return
  }

  res.status(HTTP_SUCCESS).send()
})
