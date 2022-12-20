//if the port is te be changed to anaything other than 6969 you will need to change thet in
// the forward pass from nginx too
export const PORT = process.env.API_PORT ?? 6969
export const SALT_ROUNDS = 8
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY ?? 'dev_only'

// export const BACKEND_HOST = 'http:/138.246.237.14/'

// export const BACKEND_HOST = 'http:/localhost:5000/'
// export const IN_CONTEXT_PATH = 'api/create-incontext-post'
// export const AUTOCOMPLETE_PATH = 'api/complete-post'
export const BACKEND_HOST = 'https://mvsp-api.ncmg.eu'
export const IN_CONTEXT_PATH = '/generate/incontext'
export const AUTOCOMPLETE_PATH = '/generate/complete'

export const TIMEOUT = 60000 //ms