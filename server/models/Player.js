const db = require("../utils/database");

/*
 * Structure:
 *   tid: integer
 *   uid: integer
 *   elo: integer
 *   name: varchar
 */

const PlayerModel = {
  checkPlayer: function(p) {
    return (
      !!p.tid && p.tid.toString().match(/^[0-9]+$/) &&
      !!p.elo && p.elo.toString().match(/^[0-9]+$/) &&
      !!p.name && !!p.name.match(/^[\w-]+$/)
    );
  },

  create: function(p, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Players " +
        "(uid, tid, name, elo) " +
          "VALUES " +
        "(" + p.uid + "," + p.tid + ",'" + p.name + "'," + p.elo + ")";
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
        cb(err, players || []);
      });
    });
  },

  safeUpdate: function(p, uid, admin) {
    db.serialize(function() {
      let whereClause = "WHERE tid = " + p.tid;
      if (!admin.includes(uid)) whereClause += " AND uid = " + uid;
      const query =
        "UPDATE Players " +
        "SET elo = " + p.elo + ", name = '" + p.name + "' " +
        whereClause;
      db.run(query);
    });
  }
}

module.exports = PlayerModel;
