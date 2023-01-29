import express from 'express'
import { HTTP_INTERNAL_ERROR, HTTP_SUCCESS } from '../errors';
import {complete,  generateSelfDescription} from "../service/postGeneraton";
import {authenticate} from "./middleware";

export const backendRouter = express.Router()

backendRouter.use(authenticate)
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

/**
 * Generate a self description
 */
backendRouter.post('/self-description', async function(req, res) {
    const resp = generateSelfDescription(req.body)
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