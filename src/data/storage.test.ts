import { expect, assert, use } from 'chai'
import { v4 } from 'uuid';
import 'mocha'
import { Pool } from 'pg'
import { Post, PostContent, UserDetails } from './models';
import { queryPosts, storePost, storeUserDetails } from './storage'
import migrate from 'node-pg-migrate'

let pool: Pool
let databaseName: string

before(async () => {
  try {
    await createTestingDatabase()    
    await writeTestData()
  } catch(e) {
    assert.fail(e)
  }
})

after(async () => {
  teardownTestingDatabase()
})

describe('list', function() {
  it('happy path', async function() {
    try {
      const page1 = await queryPosts(pool, 2)
      const page2 = await queryPosts(pool, 2, samplePosts[1].timestamp)
      const got = page1.concat(page2)
      
      assert.deepEqual(got, samplePosts)
    } catch(e) {
      assert.fail(e)
    }
  }); 
});

const sampleUser: UserDetails = {  
  icon_id: '1',
  username: 'Biggus',
  display_name: 'Dickus'
}

const samplePosts: Post[] = [
  {
    id: '1',
    auto_complete: false,
    content: 'Seife, Seife, was ist Seife?',
    timestamp: new Date(2022, 11, 4),
    commentCount: 0,
    likes: 0,
    user: {
      ...sampleUser,
      followers: 0,
    }
  },
  {
    id: '2',
    auto_complete: true,
    content: 'Das Ablecken von Türknöpfen ist auf anderen Planeten illegal.',
    timestamp: new Date(2022, 11, 3),
    commentCount: 0,
    likes: 0,
    user: {
      ...sampleUser,
      followers: 0,
    }
  },
  {
    id: '3',
    auto_complete: false,
    content: 'Nein, hier ist Patrick.',
    timestamp: new Date(2022, 11, 2),
    commentCount: 0,
    likes: 0,
    user: {
      ...sampleUser,
      followers: 0,
    }
  },
  {
    id: '4',
    auto_complete: false,
    content: 'Meine geistig moralischen Mechanismen sind mysteriös und komplex.',
    timestamp: new Date(2022, 11, 1),
    commentCount: 0,
    likes: 0,
    user: {
      ...sampleUser,
      followers: 0,
    }
  },
]

async function writeTestData() {
  try {
    await storeUserDetails(pool, sampleUser, 'secret')
    samplePosts.forEach(async (post) => {
      await storePost(pool, post, sampleUser.username)
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
}

async function teardownTestingDatabase() {
  await pool.query(`DROP DATABASE ${databaseName}`)
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