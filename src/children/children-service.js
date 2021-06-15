const xss = require('xss')

const ChildrenService = {
  getAllChildren(db) {
    return db
      .from('childs AS art')
      .select(
        'art.id',
        'art.title',
        'art.date_created',
        'art.style',
        'art.content',
        db.raw(
          `count(DISTINCT comm) AS number_of_comments`
        ),
        db.raw(
          `json_strip_nulls(
            json_build_object(
              'id', usr.id,
              'user_name', usr.user_name,
              'full_name', usr.full_name,
              'nickname', usr.nickname,
              'date_created', usr.date_created,
              'date_modified', usr.date_modified
            )
          ) AS "author"`
        ),
      )
      .leftJoin(
        'comments AS comm',
        'art.id',
        'comm.child_id',
      )
      .leftJoin(
        'users AS usr',
        'art.author_id',
        'usr.id',
      )
      .groupBy('art.id', 'usr.id')
  },

  getById(db, id) {
    return ChildrenService.getAllChildren(db)
      .where('art.id', id)
      .first()
  },

  getCommentsForArticle(db, child_id) {
    return db
      .from('comments AS comm')
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

  serializeArticle(child) {
    const { author } = child
    return {
      id: child.id,
      style: child.style,
      title: xss(child.title),
      content: xss(child.content),
      date_created: new Date(child.date_created),
      number_of_comments: Number(child.number_of_comments) || 0,
      author: {
        id: author.id,
        user_name: author.user_name,
        full_name: author.full_name,
        nickname: author.nickname,
        date_created: new Date(author.date_created),
        date_modified: new Date(author.date_modified) || null
      },
    }
  },

  serializeArticleComment(comment) {
    const { user } = comment
    return {
      id: comment.id,
      child_id: comment.child_id,
      text: xss(comment.text),
      date_created: new Date(comment.date_created),
      user: {
        id: user.id,
        user_name: user.user_name,
        full_name: user.full_name,
        nickname: user.nickname,
        date_created: new Date(user.date_created),
        date_modified: new Date(user.date_modified) || null
      },
    }
  },
}

module.exports = ChildrenService
