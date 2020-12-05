const db = require("../utils/database");

/*
 * Structure:
 *   tid: integer
 *   round: integer
 *   player: integer
 */

const ExemptModel = {

  checkExempt: function(e) {
    return [e.tid, e.round, e.player].every(
      elt => Number.isInteger(elt) && elt >= 1);
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
      db.all(query, (err, exempts) => {
        cb(err, exempts || []);
      });
    });
  }

};

module.exports = ExemptModel;
