const xss = require('xss')

const UpdatesService = {
  getByChildId(db, id) {
    return db
      .from('updates')
      .select(
       "*"
      )
      
      .where('child_id', id)
      
  },

  insertUpdate(db, newUpdate) {
    return db
      .insert(newUpdate)
      .into('updates')
      .returning('*')
      .then(([update]) => update)
  },

  serializeUpdate(update) {
    const { user } = update
    return {
      id: update.id,
      text: xss(update.text),
      date_created: update.date_created,
      child_id: update.child_id,
      user_id: update.user_id

    }
  }
}

module.exports = UpdatesService
