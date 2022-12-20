import express from 'express'
import { Request, Response } from 'express';
import { Either } from 'monet'
import { GenerationParameters, Post, PostFilter } from '../data/models';
import { deleteLikeRelation, getFollowedUsernames, storeLikeRelation } from '../data/storage';
import { BadRequestError } from '../errors';
import { createComment, createPost, listPosts, listUserFeed } from '../service/post';
import { HTTP_SUCCESS } from './codes';
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
  const pagination = {
    size: parsePageSize(req.body),
    token: req.body.pageToken,
  }
  const filter = parsePostFilter(req.body)

  let result: Promise<{posts: Post[], nextPageToken: string}>
  if (req.body.isUserFeed) {
    result = listUserFeed(pool, req.body.username, filter, pagination)
  } else {
    result = listPosts(pool, filter, pagination)
  }

  result
    .then(got => res.json(got))
    .catch(err => sendMappedError(res, err))
})

/**
 * Create a new comment.
 */
postsRouter.post('/:id/comments', async (req: Request, res: Response) => {  
  if (!req.body.content) {
    sendMappedError(res, new BadRequestError('property content must not be empty'))
    return
  }
  
  createComment(pool, {
    postId: req.params.id,
    username: req.body.username,
    content: req.body.content,
  })
  .then(() => res.sendStatus(HTTP_SUCCESS))
  .catch(err => sendMappedError(res, err))
})

/**
 * Like or unlike a post.
 */
postsRouter.post('/:id/likes', async (req: Request, res: Response) => {  
  const username = req.body.username
  const postId = req.params.id
  const shouldLike = req.query.like

  try {
    if (shouldLike === 'true') {
      await storeLikeRelation(pool, username, postId)
      res.sendStatus(HTTP_SUCCESS)
      return
    }
  
    if (shouldLike === 'false') {
      await deleteLikeRelation(pool, username, postId)
      res.sendStatus(HTTP_SUCCESS)
      return
    }
   
    sendMappedError(res, new BadRequestError('no valid like query parameter was provid, please add ?like=ture or ?like=false'))
  } catch (e) {
    sendMappedError(res, e)
  }
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
    temperature: body.temperature, // TODO: Check whether temperature is number?
    mood: body.mood ?? 'neutral',
  }

  return Either.right(params)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePostFilter(body: any): PostFilter {
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