//if the port is te be changed to anaything other than 6969 you will need to change thet in
// the forward pass from nginx too
export const PORT = process.env.API_PORT ?? 6969
export const SALT_ROUNDS = 8
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY ?? 'dev_only'
