const db = require("../utils/database");

/*
 * Structure:
 *   id: integer
 *   dtstart: datetime
 *   title: varchar
 *   website: varchar (limited choices)
 *   bothcol: boolean
 *   cadence: varchar
 *   completed: boolean
 *   nbRounds: integer >= 1
 */

const allowedWebsite = [
  "lichess",
  "vchess"
];

const TournamentModel = {
  checkTournament: function(t) {
    return (
      !!t.id && !!t.id.toString().match(/^[0-9]+$/) &&
      !!t.dtstart && !!t.dtstart.toString().match(/^[0-9]+$/) &&
      !!t.nbRounds && !!t.nbRounds.toString().match(/^[0-9]+$/) &&
      !!t.cadence && !!t.cadence.match(/^[\w -]+$/) &&
      allowedWebsite.includes(t.website)
    );
  },

  create: function(t, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Tournaments " +
        "(dtstart, title, website, bothcol, cadence, nbRounds) " +
          "VALUES " +
        "(" + t.dtstart + ", ?, '" + t.website + "'," +
            !!t.bothcol + ",'" + t.cadence  + "'," + t.nbRounds + ")";
      db.run(query, t.title, function(err) {
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

  getNext: function(cursor, cb) {
    db.serialize(function() {
      const query =
        "SELECT * " +
        "FROM Tournaments " +
        "WHERE dtstart < " + cursor + " " +
        "ORDER BY dtstart DESC " +
        "LIMIT 20"; //TODO: 20 is arbitrary
      db.all(query, (err, tournaments) => {
        cb(err, tournaments || []);
      });
    });
  },

  modify: function(t) {
    db.serialize(function() {
      const query =
        "UPDATE Tournament " +
        "SET dtstart = " + t.dtstart +
        ", title = '" + t.title + "'" +
        ", website = '" + t.website + "'" +
        ", bothcol = " + t.bothcol +
        ", cadence = '" + t.cadence + "'" +
        ", nbRounds = " + t.nbRounds + " " +
        "WHERE id = " + t.id;
      db.run(query);
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
