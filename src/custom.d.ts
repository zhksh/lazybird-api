declare namespace Express {
    // Add custom values to request bodies.
    export interface Request {
        username?: string
    }
}