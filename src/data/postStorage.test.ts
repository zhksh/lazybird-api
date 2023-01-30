import { assert } from 'chai'
import 'mocha'
import { Pool } from 'pg'
import { PostMeta, User } from './models'
import { PostgresPostStorage, PostStorage } from './postStorage'
import { PostgresUserStorage, UserStorage } from './userStorage'
import migrate from 'node-pg-migrate'

let pool: Pool
let postStorage: PostStorage
let userStorage: UserStorage
let databaseName: string

before(() => createTestingDatabase().then(writeTestData).catch(e => assert.fail(e)))

after(() => teardownTestingDatabase().catch(err => console.error('failed to teardown database', err)))

describe('queryPosts', function() {
  it('query all posts works as expected', async function() {
    try {
      const got = await postStorage.queryPosts(4)
      assert.deepEqual(got, samplePosts)
    } catch(e) {
      assert.fail(e)
    }
  });
  it('page filter works as expected on different date', async function() {
    try {
      const page = {
        date: samplePosts[2].timestamp,
        id: samplePosts[2].id,
      }
      const got = await postStorage.queryPosts(2, { page })
      const want = [samplePosts[2], samplePosts[3]]
      assert.deepEqual(got, want)
    } catch(e) {
      assert.fail(e)
    }
  });
  it('page filter works as expected on same date', async function() {
    try {
      const page = {
        date: samplePosts[1].timestamp,
        id: samplePosts[1].id,
      }
      const got = await postStorage.queryPosts(2, { page })
      const want = [samplePosts[1], samplePosts[2]]
      assert.deepEqual(got, want)
    } catch(e) {
      assert.fail(e)
    }
  });
  it('user filter works as expected', async function() {
    try {
      const got = await postStorage.queryPosts(2, { usernames: [sampleUser1.username] })      
      const want = [samplePosts[0], samplePosts[2]]
      assert.deepEqual(got, want)
    } catch(e) {
      assert.fail(e)
    }
  });
  it('user and page filter work together as expected', async function() {
    try {
      const page = {
        date: samplePosts[2].timestamp,
        id: samplePosts[2].id,
      }
      const got = await postStorage.queryPosts(2, { page, usernames: [sampleUser1.username] })      
      const want = [samplePosts[2]]
      assert.deepEqual(got, want)
    } catch(e) {
      assert.fail(e)
    }
  });
});

const sampleUser1: User = {  
  icon_id: '1',
  username: 'Biggus',
  display_name: 'Dickus'
}

const sampleUser2: User = {  
  icon_id: '2',
  username: 'Chuck',
  display_name: 'Chuck Norris'
}

const samplePosts: PostMeta[] = [
  {
    id: 'A',
    autoreply: false,
    content: 'Seife, Seife, was ist Seife?',
    timestamp: new Date(Date.UTC(2022, 11, 4)),
    comments: [],
    likes: [],
    user: sampleUser1,
  },
  {
    id: 'C',
    autoreply: true,
    content: 'Das Ablecken von Türknöpfen ist auf anderen Planeten illegal.',
    timestamp: new Date(Date.UTC(2022, 11, 4)),
    comments: [],
    likes: [],
    user: sampleUser2,
    
  },
  {
    id: 'D',
    autoreply: false,
    content: 'Nein, hier ist Patrick.',
    timestamp: new Date(Date.UTC(2022, 11, 4)),
    comments: [],
    likes: [],
    user: sampleUser1,
  },
  {
    id: 'B',
    autoreply: false,
    content: 'Meine geistig moralischen Mechanismen sind mysteriös und komplex.',
    timestamp: new Date(Date.UTC(2022, 11, 1)),
    comments: [],
    likes: [],
    user: sampleUser2,
  },
]

async function writeTestData() {
  try {
    await userStorage.storeUser(sampleUser1, 'secret')
    await userStorage.storeUser(sampleUser2, 'secret')
    await userStorage.storeFollowerRelation(sampleUser1.username, sampleUser2.username)
    samplePosts.forEach(async (post) => {
      await postStorage.storePost(post, post.user.username)
    })
  } catch(e) {
    assert.fail(e)
  }
}

/**
 * Create an empty testing database for testing.
 * @returns a pg Pool connected to the testing database and the database name
 */
async function createTestingDatabase() {
  const config = defaultConfig()
  
  const client = new Pool(config)

  databaseName = randomDBname(10)
  await client.query(`CREATE DATABASE ${databaseName};`)
  config.database = databaseName

  await migrate({
    databaseUrl: config,
    migrationsTable: 'pgmigrations',
    dir: 'migrations/',
    direction: 'up'
  })

  pool = new Pool(config)
  userStorage = new PostgresUserStorage(pool)
  postStorage = new PostgresPostStorage(pool)

  // Wait until database is ready
  await new Promise(resolve => setTimeout(resolve, 10))
}

async function teardownTestingDatabase() {
  await pool.end()
  const mainPool = new Pool(defaultConfig());
  await mainPool.query(`DROP DATABASE ${databaseName}`)
}

function randomDBname(length: number): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
}

function defaultConfig() {
  return {
    database: 'postgres',
    host: 'localhost',
    user: 'postgres',
    port: 5432,
    password: 'secret',
  }
}