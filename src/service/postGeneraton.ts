import {BACKEND_HOST, AUTOCOMPLETE_PATH, IN_CONTEXT_PATH} from "../env";
import {post} from "./httpService";

export async function createInContextPost(data: any): Promise<string>{
    const temperature: number = data.temperature
    const postId: number = data.postId
    const turns: number = data.turns
    const mood: string = data.mood

    const dummmy_payload = JSON.parse(JSON.stringify({
        "context" : [
            {
                "msg": "Hi Dude",
                "ts": 123918271,
                "userid" : 1,
                "source": "lm",
                "postid" : 87
            },
            {
                "msg": "Hi man, what are you up to ?",
                "ts": 123918372,
                "userid" : 2,
                "source": "user",
                "postid" : 23

            },
            {
                "msg": "Hi Dude",
                "ts": 123918273,
                "userid" : 3,
                "source": "lm",
                "postid" : 212
            },
        ],
        "temperature": temperature,
        "mood": mood
    }));

    const url = BACKEND_HOST + IN_CONTEXT_PATH
    return post(url, dummmy_payload)
}

export async function complete(data: any): Promise<string>{
    const url = BACKEND_HOST + AUTOCOMPLETE_PATH
    //set this flag if our LM is to be used
    // data['ours'] = 'true'

    return post(url, data)
}

function validate_body(payload:any, reqParams:Array<string>): void {
    for (const rp of reqParams){
        if (!payload.hasOwnProperty(rp)) {
           throw Error(`required but missing param '${rp}'`)
        }
    }
}
