const express = require('express')
const path = require('path')
const UpdatesService = require('./updates-service')
const { requireAuth } = require('../middleware/jwt-auth')

const updatesRouter = express.Router()
const jsonBodyParser = express.json()
const ChildrenService = require('../children/children-service')


updatesRouter
  .route('/')
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    const { child_id, text, date } = req.body
    const newUpdate = { child_id, text, date }

    for (const [key, value] of Object.entries(newUpdate))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    newUpdate.user_id = req.user.id

    UpdatesService.insertUpdate(
      req.app.get('db'), 
      newUpdate
    )
      .then(update => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${update.id}`))
          .json(UpdatesService.serializeUpdate(update))
      })
      .catch(next)
    })
    
updatesRouter
    .route('/:childId')
    .get((req, res, next) => {
      UpdatesService.getByChildId(req.app.get('db'),req.params.childId)
        .then(children => {
          console.log(children)
          res.json(children.map(ChildrenService.serializeChild))
        })
        .catch(next)
    })

    updatesRouter.route('/:childId/:updateId')
    .delete((req, res) => {
      const id = req.params.updateId
  
      UpdateService.deleteUpdate(
        req.app.get('db'),
        id
      )
      .then(data => {
        res
        .sendStatus(204)
      })
    })

module.exports = updatesRouter
