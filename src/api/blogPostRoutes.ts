import express from 'express'
import { Request, Response } from 'express';
import { Either } from 'monet'
import { GenerationParameters, Post } from '../data/models';
import { BadRequestError } from '../errors';
import { createPost } from '../service/post';
import { pool, sendMappedError } from './common';
import { authenticate } from './middleware';

/**
 * Defines all posts/ routes. Requires all requests to be authenticated.
 */
export const postsRouter = express.Router()
postsRouter.use(authenticate)

/**
 * Create a new post.
 */
postsRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body
  
  parseGenerationParameters(body)
  .cata(
    err => sendMappedError(res, err),
    params => {
      createPost(pool, body.username, body.content, params)
      .then(post => res.json(post))
      .catch(err => sendMappedError(res, err))
    }
  )
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGenerationParameters(body: any): Either<BadRequestError, GenerationParameters | undefined> {
  if (!body.isAI) {
    return Either.right(undefined)
  }
 
  if (!body.temperature) {
    return Either.left(new BadRequestError('temperature must not be undefined if isAI = true'))
  }

  if (!body.mood) {
    return Either.left(new BadRequestError('mood must not be undefined if isAI = true'))
  }

  const params = {
    temperature: body.temperature, // TODO: Check whether temperature is number
    mood: body.mood,
  }

  return Either.right(params)
}
