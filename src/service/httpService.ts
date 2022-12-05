import * as http from "http";
import {TIMEOUT} from "./config";

export function post(url, data): Promise<Error|JSON> {
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
                res.on('error', reject);
                res.on('data', buffer => buffers.push(buffer));
                res.on(
                    'end',
                    () =>
                        res.statusCode === 200
                            ? resolve(JSON.parse(Buffer.concat(buffers).toString()))
                            : reject(Buffer.concat(buffers))
                );
            }
        );
        req.write(dataEncoded);
        req.end();
    });
}