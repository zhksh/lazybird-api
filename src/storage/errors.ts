export class AlreadyExistsError extends Error {
    constructor() {
       super('the given resource already exists') 
       this.name = 'AlreadyExistsError'
    }
}