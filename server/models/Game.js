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

const allowedScores = [
  "1-0",
  "0-1",
  "1/2",
  "+2",
  "+1",
  "=",
  "-1",
  "-2",
  "1-F",
  "F-1",
  "F-F"
];

const GameModel = {

  checkGame: function(g) {
    return (
      [g.tid, g.round, g.player1, g.player2].every(
        elt => Number.isInteger(elt) && elt >= 1) &&
      (!g.score || allowedScores.includes(g.score))
    );
  },

  checkGames: function(gs) {
    return (
      Number.isInteger(gs.tid) && gs.tid >= 1 &&
      Number.isInteger(gs.round) && gs.round >= 1 &&
      gs.versus.every(g => {
        return (
          Number.isInteger(g.player1) && g.player1 >= 1 &&
          Number.isInteger(g.player2) && g.player2 >= 1
        );
      })
    );
  },

  create: function(gs, cb) {
    db.serialize(function() {
      let query =
        "INSERT INTO Games " +
        "(tid, round, player1, player2) " +
          "VALUES ";
      for (let g of gs.versus) {
        query += "(" + gs.tid + "," + gs.round + "," +
          g.player1 + "," + g.player2 + "),"
      }
      query = query.slice(0, -1);
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
      db.all(query, (err, games) => {
        cb(err, games || []);
      });
    });
  },

  safeUpdate: function(g, uid, admin) {
    db.serialize(function() {
      let whereClause =
        "WHERE tid = " + g.tid +
        "  AND player1 = " + g.player1 +
        "  AND round = " + g.round;
      if (!admin.includes(uid))
        whereClause += " AND " + uid + " IN (player1, player2)";
      const setCmd = (!g.score ? "glink = ?" : "score = '" + g.score + "'");
      const query =
        "UPDATE Games " +
        "SET " + setCmd + " " +
        whereClause;
      db.run(query, g.glink);
    });
  }

};

module.exports = GameModel;
