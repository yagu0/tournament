const db = require("../utils/database");

/*
 * Structure:
 *   tid: integer
 *   round: integer
 *   player: integer
 */

const ExemptModel = {
  checkExempt: function(e) {
    return (
      !!e.tid && !!e.tid.match(/^[0-9]+$/) &&
      !!e.player && !!e.player.match(/^[0-9]+$/) &&
      !!e.round && !!e.round.match(/^[0-9]+$/)
    );
  },

  create: function(e, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Exempts " +
        "(tid, round, player) " +
          "VALUES " +
        "(" + e.tid + "," + e.round + "," + e.player + ")";
      db.run(query, function(err) {
        cb(err, { id: this.lastID });
      });
    });
  },

  getAll: function(tid, cb) {
    db.serialize(function() {
      const query =
        "SELECT * " +
        "FROM Exempts " +
        "WHERE tid = " + tid;
      db.get(query, (err, exempts) => {
        cb(err, exempts || []);
      });
    });
  }
};

module.exports = ExemptModel;
