const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: 'test-user-1',
      full_name: 'Test user 1',
      password: 'password',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 2,
      user_name: 'test-user-2',
      full_name: 'Test user 2',
      password: 'password',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 3,
      user_name: 'test-user-3',
      full_name: 'Test user 3',
      password: 'password',
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    
  ]
}

function makeChildrenArray(users) {
  return [
    {
      id: 1,
      user_id: users[0].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      name: 'John Doe',
    },
    {
      id: 2,
      user_id: users[1].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      name: 'James Doe',
    },
    {
      id: 3,
      user_id: users[2].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
      name: 'Jenny Doe',
    },
    
  ]
}

function postUpdatesArray(users, children) {
  return [
    {
      id: 1,
      text: 'First test update!',
      child_id: children[0].id,
      user_id: users[0].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 2,
      text: 'Second test update!',
      child_id: children[0].id,
      user_id: users[1].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 3,
      text: 'Third test update!',
      child_id: children[0].id,
      user_id: users[2].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 4,
      text: 'Fourth test update!',
      child_id: children[0].id,
      user_id: users[2].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 5,
      text: 'Fifth test update!',
      child_id: children[children.length - 1].id,
      user_id: users[0].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 6,
      text: 'Sixth test update!',
      child_id: children[children.length - 1].id,
      user_id: users[2].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
    {
      id: 7,
      text: 'Seventh test update!',
      child_id: children[2].id,
      user_id: users[0].id,
      date_created: new Date('2029-01-22T16:28:32.615Z'),
    },
  ];
}

function makeExpectedArticle(users, child, updates=[]) {
  const author = users
    .find(user => user.id === child.author_id)

  const number_of_updates = updates
    .filter(update => update.child_id === child.id)
    .length

  return {
    id: child.id,
    style: child.style,
    title: child.title,
    content: child.content,
    date_created: child.date_created.toISOString(),
    number_of_updates,
    author: {
      id: author.id,
      user_name: author.user_name,
      full_name: author.full_name,
      date_created: author.date_created.toISOString(),
      date_modified: author.date_modified || null,
    },
  }
}

function makeExpectedArticleUpdates(users, childId, updates) {
  const expectedUpdates = updates
    .filter(update => update.child_id === childId)

  return expectedUpdates.map(update => {
    const updateUser = users.find(user => user.id === update.user_id)
    return {
      id: update.id,
      text: update.text,
      date_created: update.date_created.toISOString(),
      user: {
        id: updateUser.id,
        user_name: updateUser.user_name,
        full_name: updateUser.full_name,
        date_created: updateUser.date_created.toISOString(),
        date_modified: updateUser.date_modified || null,
      }
    }
  })
}

function makeMaliciousArticle(user) {
  const maliciousArticle = {
    id: 911,
    style: 'How-to',
    date_created: new Date(),
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    author_id: user.id,
    content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
  }
  const expectedArticle = {
    ...makeExpectedArticle([user], maliciousArticle),
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  }
  return {
    maliciousArticle,
    expectedArticle,
  }
}

function makeArticlesFixtures() {
  const testUsers = makeUsersArray()
  const testArticles = makeChildrenArray(testUsers)
  const testUpdates = postUpdatesArray(testUsers, testArticles)
  return { testUsers, testArticles, testUpdates }
}

function cleanTables(db) {
  return db.transaction(trx =>
    trx.raw(
      `TRUNCATE
        children,
        users,
        child_updates
      `
    )
    .then(() =>
      Promise.all([
        trx.raw(`ALTER SEQUENCE children_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE users_id_seq minvalue 0 START WITH 1`),
        trx.raw(`ALTER SEQUENCE child_updates_id_seq minvalue 0 START WITH 1`),
        trx.raw(`SELECT setval('children_id_seq', 0)`),
        trx.raw(`SELECT setval('users_id_seq', 0)`),
        trx.raw(`SELECT setval('child_updates_id_seq', 0)`),
      ])
    )
  )
}

function seedUsers(db, users) {
  const preppedUsers = users.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 1)
  }))
  return db.into('users').insert(preppedUsers)
    .then(() =>
      // update the auto sequence to stay in sync
      db.raw(
        `SELECT setval('users_id_seq', ?)`,
        [users[users.length - 1].id],
      )
    )
}

function seedArticlesTables(db, users, children, updates=[]) {
  // use a transaction to group the queries and auto rollback on any failure
  return db.transaction(async trx => {
    await seedUsers(trx, users)
    await trx.into('children').insert(children)
    // update the auto sequence to match the forced id values
    await trx.raw(
      `SELECT setval('children_id_seq', ?)`,
      [children[children.length - 1].id],
    )
    // only insert updates if there are some, also update the sequence counter
    if (updates.length) {
      await trx.into('child_updates').insert(updates)
      await trx.raw(
        `SELECT setval('child_updates_id_seq', ?)`,
        [updates[updates.length - 1].id],
      )
    }
  })
}

function seedMaliciousArticle(db, user, child) {
  return seedUsers(db, [user])
    .then(() =>
      db
        .into('children')
        .insert([child])
    )
}

function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: 'HS256',
  })
  return `Bearer ${token}`
}

module.exports = {
  makeUsersArray,
  makeExpectedArticle,
  makeExpectedArticleUpdates,
  makeMaliciousArticle,

  makeArticlesFixtures,
  cleanTables,
  seedArticlesTables,
  seedMaliciousArticle,
  makeAuthHeader,
  seedUsers,
}
