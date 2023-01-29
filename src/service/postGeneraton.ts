import {BACKEND_HOST, AUTOCOMPLETE_PATH, IN_CONTEXT_PATH, SELF_DESCRIPTION_PATH} from "../env";
import {post} from "./httpService";
import {AutoReply, CommentHistory, Mood, PostMeta} from "../data/models";
import { InternalError } from "../errors";

// export async function createReply(options: AutoReply, history: CommentHistory): Promise<string> {
//     return fetch(BACKEND_HOST + IN_CONTEXT_PATH, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             context: history.history,
//             temperature: options.temperature,
//             mood: options.mood,
//             ours: options.ours || "false"
//         })
//     })
//     .then(res => res.json())
//     .then(json => {
//         if (json.response && typeof json.response == 'string') {
//             return json.response.trim()
//         } else if (json.error) {
//             throw new Error(json.error)
//         } else {
//             throw new InternalError()
//         }
//     })
// }

export async function createReply(options: AutoReply, history: CommentHistory): Promise<string>{

    const payload = {
        "context": history.history,
        "temperature": options.temperature,
        "mood": options.mood,
        "ours": options.ours || "false"
    }

    const url = BACKEND_HOST + IN_CONTEXT_PATH
    return post(url, payload)
}

export async function generateSelfDescription(data): Promise<string>{
    const url = BACKEND_HOST + SELF_DESCRIPTION_PATH

    return post(url, data)
}

export async function complete(data: any): Promise<string>{
    const url = BACKEND_HOST + AUTOCOMPLETE_PATH
    //set this flag if our LM is to be used
    // data['ours'] = 'true'

    return post(url, data)
}

export function buildHistory(post: PostMeta, n: number) : CommentHistory  {
    const hist = {original : post.content, history: []}
    const comments = post.comments
    let i = comments.length
    do {
        --i
        if (i < 0){
            hist.history.push({"source": "me", "msg": hist.original})
            break
        }
        const source = comments[i].user.username == post.user.username ? "me" : "you"
        hist.history.push({"source": source, "msg": comments[i].content})

    } while (i > comments.length -n || comments[i].user.username != post.user.username)
    hist.history.reverse()

    return hist
}