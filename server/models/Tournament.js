const db = require("../utils/database");

/*
 * Structure:
 *   id: integer
 *   dtstart: datetime
 *   title: varchar
 *   ttype: varchar (limited choices), or maybe integer
 *   cadence: varchar
 *   completed: boolean
 *   nbRounds: integer >= 1
 */

const TournamentModel = {
  checkTournament: function(t) {
    // TODO: check other fields? (especially 'title')
    return (
      t.id.toString().match(/^[0-9]+$/) &&
      t.nbRounds.toString().match(/^[0-9]+$/)
    );
  },

  create: function(t, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Tournaments " +
        "(dtstart, title, ttype, cadence, nbRounds) " +
          "VALUES " +
        "(" + t.dtstart + ",'" + t.title + "'," + t.ttype + ",'" +
            t.cadence  + "'," + t.nbRounds + ")";
      db.run(query, function(err) {
        cb(err, { id: this.lastID });
      });
    });
  },

  getOne: function(id, cb) {
    db.serialize(function() {
      const query =
        "SELECT * " +
        "FROM Tournaments " +
        "WHERE id = " + id;
      db.get(query, (err, problem) => {
        cb(err, problem);
      });
    });
  },

  safeRemove: function(id, uid, admin) {
    db.serialize(function() {
      let whereClause = "WHERE id = " + id;
      if (!admin.includes(uid)) whereClause += " AND uid = " + uid;
      const query =
        "DELETE FROM Tournaments " +
        whereClause;
      db.run(query);
    });
  },
}

module.exports = TournamentModel;
