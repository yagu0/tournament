const db = require("../utils/database");

/*
 * Structure:
 *   tid: integer
 *   round: integer
 *   score: varchar
 *   glink: varchar
 *   player1: integer
 *   player2: integer
 */

const GameModel = {
  checkGame: function(g) {
    return (
      !!g.tid && !!g.tid.match(/^[0-9]+$/) &&
      !!g.player1 && !!g.player1.match(/^[0-9]+$/) &&
      !!g.player2 && !!g.player2.match(/^[0-9]+$/) &&
      !!g.round && !!g.round.match(/^[0-9]+$/)
    );
  },

  create: function(p, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Games " +
        "(tid, round, score, glink, player1, player2) " +
          "VALUES " +
        "(" + g.tid + "," + g.round + ",'" + g.score + "','" +
            g.glink + "'," + g.player1 + "," + g.player2 + ")";
      db.run(query, function(err) {
        cb(err, { id: this.lastID });
      });
    });
  },

  getAll: function(tid, cb) {
    db.serialize(function() {
      const query =
        "SELECT * " +
        "FROM Games " +
        "WHERE tid = " + tid;
      db.get(query, (err, games) => {
        cb(err, games);
      });
    });
  },

  safeUpdate: function(g, uid, admin) {
    db.serialize(function() {
      let whereClause = "WHERE tid = " + g.tid;
      if (!admin.includes(uid))
        whereClause += " AND " + uid + " IN (player1, player2) = " + uid;
      const query =
        "UPDATE Games " +
        // Round + player1/2 won't change
        "SET score = " + g.score + ", glink = '" + g.glink + "' " +
        whereClause;
      db.run(query);
    });
  }
}

module.exports = GameModel;
