import * as http from "http";
import {TIMEOUT} from "../env";

export async function post(url, data): Promise<string> {
    const dataEncoded = JSON.stringify(data)

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': dataEncoded.length,
        },
        timeout: TIMEOUT, // in ms
    }
    return new Promise((resolve, reject) => {

        const dataEncoded = JSON.stringify(data);
        const req = http.request(
            url,
            options,
            res => {
                const buffers = [];
                res.on('error', function(e){console.log(e.toString())});
                res.on('data', buffer => buffers.push(buffer));
                res.on(
                    'end',
                    () =>
                        res.statusCode === 200
                            ? resolve(Buffer.concat(buffers).toString())
                            : reject(Buffer.concat(buffers).toString())
                );
            }
        ).on('error', function(e){
            console.log(e.toString());
            reject(e.toString())});
        req.write(dataEncoded);
        req.end();
    });
}