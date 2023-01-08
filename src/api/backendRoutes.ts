import express from 'express'
import { HTTP_INTERNAL_ERROR, HTTP_SUCCESS } from '../errors';
import {complete, createInContextPost} from "../service/postGeneraton";

export const backendRouter = express.Router()

/**
 * This Api will alows return a json, no matter if something internally or externaly went wrong
 * if somehting on this side went wrong there will be an "error" field
 * if the status code from the backend is not 200 the most likely formatted response will simply be forwarded
 */

/**
 * Create new post given the history of a given post
 */
backendRouter.post('/incontext', async function(req, res) {
        const resp = createInContextPost(req.body)
        resp.then((bres) => {
            return   res.status(HTTP_SUCCESS).json(JSON.parse(bres))
        }).catch((err) => {
            console.log(err.toString())
            try {
                // errs most likely handled by the backend
                return res.status(HTTP_INTERNAL_ERROR).json(JSON.parse(err.toString()))
            }
            catch (e) {
                // unformatted errs
                return res.status(HTTP_INTERNAL_ERROR).json({"error": err.toString()})
            }
        })
})

/**
 * Complete a given Prefix
 */
backendRouter.post('/complete', async function(req, res) {
        const resp = complete(req.body)
        resp.then((backendResonse) => {
            return   res.status(HTTP_SUCCESS).json(JSON.parse(backendResonse))
        }).catch((err) => {
            console.log(err.toString())
            try {
                return res.status(HTTP_INTERNAL_ERROR).json(JSON.parse(err.toString()))
            }
            catch (e) {
                return res.status(HTTP_INTERNAL_ERROR).json({"error": err.toString()})
            }
        })
})
