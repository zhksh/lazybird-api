import { expect } from 'chai'
import 'mocha'
import { Pool } from 'pg'
import { uuid } from 'uuidv4';
import { storeUser, User } from './storage'

describe('storeUser', function() {
  it('happy path', async function() {
    const pool = new Pool({
        database: 'postgres',
        host: 'localhost',
        user: 'postgres',
        port: 5432,
        password: 'secret',
    })
    
    const user: User = {
        id: uuid(),
        login: uuid(),
        secret: "super-secret",
    }

    const err = await storeUser(pool, user)
    expect(err).is.undefined

    pool.end()
  }); 
});