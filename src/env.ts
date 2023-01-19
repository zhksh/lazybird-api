//if the port is te be changed to anaything other than 6969 you will need to change thet in
// the forward pass from nginx too
export const PORT = process.env.API_PORT ?? 6969
export const SALT_ROUNDS = 8
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev_only'

//address of the machine running the LM api
export const BACKEND_HOST = process.env.BACKEND_HOST ?? 'http:/138.246.237.14/'
// export const BACKEND_HOST = process.env.BACKEND_HOST ?? 'http:/localhost:5000/'

//relevant enpoints of the LM api
export const IN_CONTEXT_PATH = process.env.IN_CONTEXT_PATH ?? 'api/create-incontext-post'
export const AUTOCOMPLETE_PATH = process.env.AUTOCOMPLETE_PATH ?? 'api/complete-post'

//timout for calls to the LM api
export const TIMEOUT = 60000 //ms