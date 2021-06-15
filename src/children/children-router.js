const express = require('express')
const ChildrenService = require('./children-service')
const { requireAuth } = require('../middleware/jwt-auth')

const childrenRouter = express.Router()

childrenRouter
  .route('/')
  .get((req, res, next) => {
    ChildrenService.getAllChildren(req.app.get('db'))
      .then(children => {
        res.json(children.map(ChildrenService.serializeChild))
      })
      .catch(next)
  })

childrenRouter
  .route('/:child_id')
  .all(requireAuth)
  .all(checkChildExists)
  .get((req, res) => {
    res.json(ChildrenService.serializeChild(res.child))
  })

childrenRouter.route('/:child_id/comments/')
  .all(requireAuth)
  .all(checkChildExists)
  .get((req, res, next) => {
    ChildrenService.getCommentsForChild(
      req.app.get('db'),
      req.params.child_id
    )
      .then(comments => {
        res.json(comments.map(ChildrenService.serializeChildComment))
      })
      .catch(next)
  })

/* async/await syntax for promises */
async function checkChildExists(req, res, next) {
  try {
    const child = await ChildrenService.getById(
      req.app.get('db'),
      req.params.child_id
    )

    if (!child)
      return res.status(404).json({
        error: `Child doesn't exist`
      })

    res.child = child
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = childrenRouter
