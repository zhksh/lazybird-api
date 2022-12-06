export class AlreadyExistsError extends Error {
    constructor(msg?: string) {
       super(['the given resource already exists:', msg].join(' ')) 
       this.name = 'AlreadyExistsError'
    }
}

export class UnauthorizedError extends Error {
    constructor(msg?: string) {
       super(['not authorized:', msg].join(' ')) 
       this.name = 'UnauthorizedError'
    }
}

export class BadRequestError extends Error {
    constructor(msg?: string) {
       super(['bad request:', msg].join(' ')) 
       this.name = 'BadRequestError'
    }
}

export class NotFoundError extends Error {
    constructor(msg?: string) {
       super(['not found:', msg].join(' ')) 
       this.name = 'NotFoundError'
    }
}