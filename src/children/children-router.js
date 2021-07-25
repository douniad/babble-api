const express = require('express')
const ChildrenService = require('./children-service')
const { requireAuth } = require('../middleware/jwt-auth')

const childrenRouter = express.Router()
const jsonBodyParser = express.json()

childrenRouter
  .route('/')
  .get(requireAuth, (req, res, next) => {
    ChildrenService.getAllChildren(req.app.get('db'), req.user.id)
      .then(children => {
        console.log(children)
        res.json(children.map(ChildrenService.serializeChild))
      })
      .catch(next)
  })

 
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { name } = req.body
    const newChild = { name }

    for (const [key, value] of Object.entries(newChild))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    newChild.user_id = req.user.id

   ChildrenService.insertChild(
      req.app.get('db'),
      newChild
    )
      .then(child => {
        res
          .status(201)
          
          .json(ChildrenService.serializeChild(child))
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
  .delete((req, res) => {
    const id = req.params.child_id

    ChildrenService.removeChild(
      req.app.get('db'),
      id
    )
    .then(data => {
      res
      .sendStatus(204)
    })
  })

childrenRouter.route('/:child_id/updates/')
  .all(requireAuth)
  .all(checkChildExists)
  .get((req, res, next) => {
    ChildrenService.getUpdatesForChild(
      req.app.get('db'),
      req.params.child_id
    )
      .then(updates => {
        res.json(updates.map(ChildrenService.serializeChildUpdate))
      })
      .catch(next)
  })

/* async/await syntax for promises */
async function checkChildExists(req, res, next) {
  try {
    const child = await ChildrenService.getById(
      req.app.get('db'),
      req.user.id,
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
