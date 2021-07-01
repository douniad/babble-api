const xss = require('xss')

const ChildrenService = {
  getAllChildren(db) {
    return db
      .from('children')
      .select('*')
  },

  getById(db, id) {
    return ChildrenService.getAllChildren(db)
      .where('id', id)
      .first()
  },

  getUpdatesForArticle(db, child_id) {
    return db
      .from('updates AS comm')
      .select(
        'comm.id',
        'comm.text',
        'comm.date_created',
        db.raw(
          `json_strip_nulls(
            row_to_json(
              (SELECT tmp FROM (
                SELECT
                  usr.id,
                  usr.user_name,
                  usr.full_name,
                  usr.nickname,
                  usr.date_created,
                  usr.date_modified
              ) tmp)
            )
          ) AS "user"`
        )
      )
      .where('comm.child_id', child_id)
      .leftJoin(
        'users AS usr',
        'comm.user_id',
        'usr.id',
      )
      .groupBy('comm.id', 'usr.id')
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


}

module.exports = ChildrenService
