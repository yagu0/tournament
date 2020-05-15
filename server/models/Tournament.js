const db = require("../utils/database");

/*
 * Structure:
 *   id: integer
 *   dtstart: datetime
 *   title: varchar
 *   website: varchar (limited choices)
 *   bothcol: boolean
 *   allRounds: boolean
 *   cadence: varchar
 *   frozen: boolean
 *   stage: integer
 *   nbRounds: integer >= 1
 */

const allowedWebsite = [
  "lichess",
  "vchess"
];

const TournamentModel = {
  checkTournament: function(t) {
    return (
      (!t.id || !!t.id.toString().match(/^[0-9]+$/)) &&
      !!t.dtstart && !!t.dtstart.toString().match(/^[0-9]+$/) &&
      !!t.nbRounds && !!t.nbRounds.toString().match(/^[0-9]+$/) &&
      !!t.cadence && !!t.cadence.match(/^[\w+ -]+$/) &&
      allowedWebsite.includes(t.website)
    );
  },

  create: function(t, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Tournaments " +
        "(dtstart, title, website, allRounds, bothcol, cadence, nbRounds) " +
          "VALUES " +
        "(" + t.dtstart + ", ?, '" + t.website + "'," + !!t.allRounds + "," +
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

  getRunningUpcoming: function(cb) {
    db.serialize(function() {
      const query =
        "SELECT * " +
        "FROM Tournaments " +
        "WHERE stage <= 3";
      db.all(query, (err, tournaments) => {
        cb(err, tournaments || []);
      });
    });
  },

  getNext: function(cursor, cb) {
    db.serialize(function() {
      const query =
        "SELECT * " +
        "FROM Tournaments " +
        "WHERE stage == 4 AND dtstart < " + cursor + " " +
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
        "UPDATE Tournaments " +
        "SET dtstart = " + t.dtstart +
        ", title = '" + t.title + "'" +
        ", website = '" + t.website + "'" +
        ", bothcol = " + !!t.bothcol +
        ", allRounds = " + !!t.allRounds +
        ", cadence = '" + t.cadence + "'" +
        ", nbRounds = " + t.nbRounds + " " +
        "WHERE id = " + t.id;
      db.run(query);
    });
  },

  toggleState: function(tid, o) {
    db.serialize(function() {
      let newValues =
        (
          o.frozen !== undefined
            ? "frozen = " + !!o.frozen + (!!o.stage ? "," : "")
            : ""
        ) +
        // Testing !!o.stage because no update to zero
        (!!o.stage ? "stage = " + o.stage : "");
      const query =
        "UPDATE Tournaments " +
        "SET " + newValues + " " +
        "WHERE id = " + tid;
      db.run(query);
    });
  },

  remove: function(id) {
    db.serialize(function() {
      const query =
        "DELETE FROM Tournaments " +
        "WHERE id = " + id;
      db.run(query);
    });
  }
};

module.exports = TournamentModel;