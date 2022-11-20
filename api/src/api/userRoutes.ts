import express from 'express'
import { createUser } from '../service/user'
import { HTTP_BAD_REQUEST, HTTP_INTERNAL_ERROR, HTTP_SUCCESS } from './codes';

export const userRouter = express.Router()

/**
 * 
 */
userRouter.post('/create', function(req, res) {
  // TODO: Test me
  const login:string = req.body.login
  const password:string = req.body.login

  if (!login || !password) {
    res.status(HTTP_BAD_REQUEST).send()
    return
  }

  const {err} = createUser(login, password)
  if (err) {
    res.status(HTTP_INTERNAL_ERROR).send()
    return
  }

  res.status(HTTP_SUCCESS).send()
});
