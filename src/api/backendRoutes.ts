import express from 'express'
import { HTTP_INTERNAL_ERROR, HTTP_SUCCESS } from './codes';
import {complete, createInContextPost} from "../service/postGeneraton";

export const backendRouter = express.Router()

/**
 * Create new post given the history of a given post
 */
backendRouter.post('/incontext', async function(req, res) {
    try {
        const resp = createInContextPost(req.body)
        resp.then((bres) => {
            return   res.status(HTTP_SUCCESS).json(JSON.parse(bres))
        }).catch((err) => {
            console.log(err.toString())
            try {
                // handled errs from handled the backend
                return res.status(HTTP_INTERNAL_ERROR).json(JSON.parse(err.toString()))
            }
            catch (e) {
                // handled errs from unhandled the backend
                return res.status(HTTP_INTERNAL_ERROR).json({"error": e.toString()})
            }
        })
    }
    catch(e){
        return res.status(HTTP_INTERNAL_ERROR).json({"error": e.toString()})
    }
})

backendRouter.post('/complete', async function(req, res) {
    try {
        const resp = complete(req.body)
        resp.then((backendResonse) => {
            return   res.status(HTTP_SUCCESS).json(JSON.parse(backendResonse))
        }).catch((err) => {
            console.log(err.toString())
            try {
                // handled errs from handled the backend
                return res.status(HTTP_INTERNAL_ERROR).json(JSON.parse(err.toString()))
            }
            catch (e) {
                // handled errs from unhandled the backend
                return res.status(HTTP_INTERNAL_ERROR).json({"error": e.toString()})
            }
        })
    }
    catch (e) {
        return res.status(HTTP_INTERNAL_ERROR).json({"error": e.toString()})
    }

})
