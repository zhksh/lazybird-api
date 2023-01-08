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

export class InternalError extends Error {
    constructor() {
       super('internal error') 
       this.name = 'InternalError'
    }

    status(): number {
        return HTTP_INTERNAL_ERROR
    }
}

export const HTTP_SUCCESS = 200
export const HTTP_BAD_REQUEST = 400
export const HTTP_UNAUTHORIZED = 401
export const HTTP_ALREADY_EXISTS = 409
export const HTTP_FORBIDDEN = 403
export const HTTP_NOT_FOUND = 404
export const HTTP_INTERNAL_ERROR = 500
