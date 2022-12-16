import express from 'express'
import { Request, Response } from 'express';
import { Either } from 'monet'
import { GenerationParameters, PostFilter } from '../data/models';
import { BadRequestError } from '../errors';
import { createPost, listPosts } from '../service/post';
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
  
  if (!body.content) {
    sendMappedError(res, new BadRequestError('post content must not be empty'))
    return
  }

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

/**
 * List posts.
 */
postsRouter.get('/', async (req: Request, res: Response) => {  
  const filter = parsePostFilter(req.body)
  const pagination = {
    size: parsePageSize(req.body),
    token: req.body.pageToken,
  }

  listPosts(pool, filter, pagination)
    .then(result => res.json(result))
    .catch(err => sendMappedError(res, err))
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGenerationParameters(body: any): Either<BadRequestError, GenerationParameters | undefined> {
  if (!body.shouldAutoComplete) {
    return Either.right(undefined)
  }
 
  if (!body.temperature) {
    return Either.left(new BadRequestError('temperature must not be undefined if shouldAutoComplete == true'))
  }

  const params = {
    temperature: body.temperature, // TODO: Check whether temperature is number
    mood: body.mood ?? 'neutral',
  }

  return Either.right(params)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePostFilter(body: any): PostFilter {
  // TODO: Implement is userFeed
  
  if (body.usernames) {
    return {
      usernames: body.usernames.map((username:string) => username === 'me' ? body.username : username),
    }
  }

  return {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePageSize(body: any): number {
  if (!body.pageSize || body.pageSize <= 0) {
    return 25
  }

  return Math.min(body.pageSize,100)
}