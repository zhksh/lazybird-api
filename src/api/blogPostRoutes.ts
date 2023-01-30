import express from 'express'
import { Request, Response } from 'express'
import { Either, Left, Right } from 'monet'
import {AutoReply, Mood, Post, PostFilter, PostRequest} from '../data/models';
import { BadRequestError, sendMappedError } from '../errors';
import { createComment, createPost, listPosts, listUserFeed, setPostIsLiked } from '../service/post';
import { HTTP_SUCCESS } from '../errors';
import { authenticate } from './middleware';
import { postStorage, userStorage } from './dependencies';

/**
 * Defines all posts/ routes. Requires all requests to be authenticated.
 */
export const postsRouter = express.Router()
postsRouter.use(authenticate)

/**
 * Create a new post.
 */
postsRouter.post('/', async (req: Request, res: Response) => {
  parsePostRequest(req.body)
    .cata(
      err => sendMappedError(res, err),
      postReq => createPost(postStorage, postReq)
        .then(post => res.json(post))
        .catch(err => sendMappedError(res, err))
    )
})

/**
 * List posts.
 */
postsRouter.get('/', async (req: Request, res: Response) => {
  const pagination = {
    size: parsePageSize(req),
    token: parsePageToken(req),
  }
  const filter = parsePostFilter(req)
  const isUserFeed = parseIsUserFeed(req)

  let result: Promise<{ posts: Post[], nextPageToken: string }>
  if (isUserFeed) {
    result = listUserFeed(userStorage, postStorage, req.body.username, filter, pagination)
  } else {
    result = listPosts(postStorage, filter, pagination)
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
  
  createComment(postStorage, {
    postId: req.params.id,
    username: req.body.username,
    content: req.body.content,
  })
  .then(() => res.sendStatus(HTTP_SUCCESS))
  .catch(err => sendMappedError(res, err))
})

/**
 * Like/ unlike a post.
 */
postsRouter.post('/:id/likes', likeHandler)
postsRouter.delete('/:id/likes', likeHandler)

async function likeHandler(req: Request, res: Response) {
  const username = req.body.username
  const postId = req.params.id
  const isLiked = req.method === 'POST'
  
  setPostIsLiked(postStorage, {username, postId, isLiked})
    .then(() => res.sendStatus(HTTP_SUCCESS))
    .catch(err => sendMappedError(res, err))
}

function parsePostRequest(body: any): Either<BadRequestError, PostRequest> {
  if (!body.post.content || body.post.content == "") {
    return Left(new BadRequestError('provide content'))
  }

    const options: AutoReply = body.post.autogenerateResponses ? {
      mood: body.params.mood,
      temperature: parseFloat(body.params.temperature),
      history_length: parseInt(body.params.historyLength),
      ours: body.params.ours
  } : null

  return Right({content: body.post.content, username: body.username, autoReplyOptions: options})
}

function parseIsUserFeed(req: Request): boolean {
  const isUserFeedString = req.query.isUserFeed as string
  if (isUserFeedString) {
    return isUserFeedString.toLocaleLowerCase() === 'true' || isUserFeedString === '1'
  }

  return false
}

function parsePostFilter(req: Request): PostFilter {  
  const usernames = parseUsernames(req)

  if (usernames && usernames.length > 0) {
    return {
      usernames: usernames.map((username:string) => username === 'me' ? req.body.username : username),
    }
  }

  return {}
}

function parsePageSize(req: Request): number {
  const sizeString = req.query.pageSize as string
  if (!sizeString) {
    return 25
  }

  const size = parseInt(sizeString)
  if (isNaN(size) || size <= 0) {
    return 25
  }

  return Math.min(size,100)
}

function parsePageToken(req: Request): string {
  const token = req.query.pageToken as string
  return token
}

function parseUsernames(req: Request): string[] {
  if (!req.query.usernames) {
    return []
  }
  
  if (isArray(req.query.usernames)) {
    return req.query.usernames as string[]
  }
  
  if (typeof req.query.usernames === 'string') {
    try {
      const out = JSON.parse(req.query.usernames)
      if (isArray(out)) {
        return out
      }
      
      return []
    } catch (e) {
      return [ req.query.usernames ]
    }
  }

  return []  
}

function parseMood(input: unknown): Either<BadRequestError, Mood> {
  if (typeof input == 'string') {
    const lower = input.toLowerCase()
    if (['neutral', 'happy', 'angry', 'ironic', 'sad'].includes(lower)) {      
      return Right(lower as Mood)
    } 
  }

  return Left(new BadRequestError('invalid mood'))  
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isArray(obj: any): boolean {
  return obj.constructor.name === 'Array'
}