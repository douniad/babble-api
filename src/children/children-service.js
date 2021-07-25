const xss = require('xss')

const ChildrenService = {
  getAllChildren(db, user_id) {
    return db
      .from('children')
      .select('*')
      .where({user_id})
  },

  getById(db, user_id, id) {
    return ChildrenService.getAllChildren(db, user_id)
      .where('id', id)
      .first()
  },


  serializeChild(child) {
    
    return {
      name: child.name,
      id: child.id,
      date_created: child.date_created

      
    }
  },
  insertChild(db, newChild) {
    return db
      .insert(newChild)
      .into('children')
      .returning('*')
      .then(([child]) => child)
  },

  removeChild(db, id) {
    return db('children')
    .where({id})
    .del()
  }


}

module.exports = ChildrenService
