import { HTTP_ALREADY_EXISTS, HTTP_BAD_REQUEST, HTTP_FORBIDDEN, HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from "./api/codes"

export class AlreadyExistsError extends Error {
    constructor(msg?: string) {
       super(['the given resource already exists:', msg].join(' ')) 
       this.name = 'AlreadyExistsError'
    }

    status(): number {
        return HTTP_ALREADY_EXISTS
    }
}

export class UnauthorizedError extends Error {
    constructor(msg?: string) {
       super(['not authorized:', msg].join(' ')) 
       this.name = 'UnauthorizedError'
    }

    status(): number {
        return HTTP_UNAUTHORIZED
    }
}

export class BadRequestError extends Error {
    constructor(msg?: string) {
       super(['bad request:', msg].join(' ')) 
       this.name = 'BadRequestError'
    }

    status(): number {
        return HTTP_BAD_REQUEST
    }
}

export class NotFoundError extends Error {
    constructor(msg?: string) {
       super(['not found:', msg].join(' ')) 
       this.name = 'NotFoundError'
    }

    status(): number {
        return HTTP_NOT_FOUND
    }
}

export class ForbiddenError extends Error {
    constructor(msg?: string) {
       super(['forbidden:', msg].join(' ')) 
       this.name = 'ForbiddenError'
    }

    status(): number {
        return HTTP_FORBIDDEN
    }
}