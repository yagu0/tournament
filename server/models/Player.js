const db = require("../utils/database");

/*
 * Structure:
 *   tid: integer
 *   uid: integer
 *   elo: integer
 *   uname: varchar
 */

const PlayerModel = {
  checkPlayer: function(p) {
    return p.elo.toString().match(/^[0-9]+$/) && !!p.uname.match(/^[\w-]+$/);
  },

  create: function(p, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Players " +
        "(uid, tid, uname, elo) " +
          "VALUES " +
        "(" + p.uid + "," + p.tid + ",'" + p.uname + "'," + p.elo + ")";
      db.run(query, function(err) {
        cb(err, { id: this.lastID });
      });
    });
  },

  getAll: function(tid, cb) {
    db.serialize(function() {
      const query =
        "SELECT * " +
        "FROM Players " +
        "WHERE tid = " + tid;
      db.get(query, (err, players) => {
        cb(err, players);
      });
    });
  },

  // TODO: also individual removal by admin
  safeRemove: function(tid, uid, admin) {
    db.serialize(function() {
      let whereClause = "WHERE id = " + id;
      if (!admin.includes(uid)) whereClause += " AND uid = " + uid;
      const query =
        "DELETE FROM Players " +
        whereClause;
      db.run(query);
    });
  },
}

module.exports = PlayerModel;
