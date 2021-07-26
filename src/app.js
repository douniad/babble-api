const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const {CLIENT_ORIGIN} = require('./config')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const childrenRouter = require('./children/children-router')
const updatesRouter = require('./updates/updates-router')
const authRouter = require('./auth/auth-router')
const usersRouter = require('./users/users-router')

const app = express()

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
  skip: () => NODE_ENV === 'test',
}))
app.use(cors())
app.use(helmet())

app.use('/api/children', childrenRouter)
app.use('/api/updates', updatesRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)

app.use(function errorHandler(error, req, res, next) {
  let response
  console.error(error)
  if (NODE_ENV === 'production') {
    response = { error: 'Server error' }
  } else {
    response = { error: error.message, object: error }
  }
  res.status(500).json(response)
})

module.exports = app
