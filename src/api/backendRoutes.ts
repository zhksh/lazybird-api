import { Pool } from 'pg'
import express from 'express'
import { HTTP_INTERNAL_ERROR, HTTP_SUCCESS } from './codes';
import {complete, createInContextPost} from "../service/postGeneraton";

export const backendRouter = express.Router()

/**
 * Create new post given the history of a given post
 */
backendRouter.post('/incontext', async function(req, res) {
  // const userId:string = req.body.user
  // const postId:string = req.body.postId

    const context = JSON.parse(JSON.stringify({
      "context" : [
        {
          "input": "Hi Dude",
          "output": "Hi man, what are you up to ?",
          "ts": 123918273,
          "source": "lm"
        },
        {
          "input": "Not much, working mostly.",
          "output": "Thats too bad im in Malaga !",
          "ts": 123918373,
          "source": "user"
        }
      ]
    }));

    const resp = createInContextPost(context)
    resp.then((bres) => {
        return   res.status(HTTP_SUCCESS).json(JSON.parse(bres))
    }).catch((err) => {
        console.log(err.toString())
        return res.status(HTTP_INTERNAL_ERROR).json(err.toString())
    })
})

backendRouter.post('/complete', async function(req, res) {
  // const userId:string = req.body.user
  // const postId:string = req.body.postId
  const prefix:string = req.body.prefix
  const payload = JSON.parse(JSON.stringify({"prefix" : prefix }));
  const resp = complete(payload)

  resp.then((backendResonse) => {
    return   res.status(HTTP_SUCCESS).json(JSON.parse(backendResonse))
  }).catch((err) => {
    console.log(err.toString())
    return res.status(HTTP_INTERNAL_ERROR).json({"error": err.toString()})
  })
})
