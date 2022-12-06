import {BACKEND_HOST, AUTOCOMPLETE_PATH, IN_CONTEXT_PATH} from "../env";
import {post} from "./httpService";

export async function createInContextPost(data: any): Promise<string>{
    const temperature: number = data.temperature
    const postId: number = data.postId
    const turns: number = data.turns

    const dummmy_payload = JSON.parse(JSON.stringify({
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
        ],
        "temperature": temperature
    }));

    const url = BACKEND_HOST + IN_CONTEXT_PATH

    return post(url, dummmy_payload)
}

export async function complete(data: any): Promise<string>{

    const url = BACKEND_HOST + AUTOCOMPLETE_PATH

    return post(url, data)
}

function validate_body(payload:any, reqParams:Array<string>): void {
    for (const rp of reqParams){
        if (!payload.hasOwnProperty(rp)) {
           throw Error(`required but missing param '${rp}'`)
        }
    }
}
