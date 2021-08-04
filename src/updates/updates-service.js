const xss = require('xss')

const UpdatesService = {
  getByChildId(db, id) {
    return db
      .from('child_updates')
      .select(
       "*"
      )
      
      .where('child_id', id)
      
  },

  insertUpdate(db, newUpdate) {
    return db
      .insert(newUpdate)
      .into('child_updates')
      .returning('*')
      .then(([update]) => update)
  },

  serializeUpdate(update) {
    return {
      id: update.id,
      text: xss(update.text),
      date_created: update.date_created,
      child_id: update.child_id,
      user_id: update.user_id

    }
  },
  deleteUpdate(db, id) {
    return db('child_updates')
    .where({id})
    .del()
  }
}

module.exports = UpdatesService
