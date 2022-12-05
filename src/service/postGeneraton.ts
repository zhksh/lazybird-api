import { Pool } from 'pg'
import {BACKEND_HOST, AUTOCOMPLETE_PATH, IN_CONTEXT_PATH} from "./config";
import {post} from "./httpService";

export async function createInContextPost(context: string): Promise<Error|string>{

    const url = BACKEND_HOST + IN_CONTEXT_PATH

    return post(url, context)
}