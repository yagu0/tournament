const db = require("../utils/database");

/*
 * Structure:
 *   tid: integer
 *   uid: integer
 *   elo: integer
 *   quit: boolean
 *   ban: boolean
 */

const PlayerModel = {

  checkPlayer: function(p) {
    return (
      !!p.tid && p.tid.toString().match(/^[0-9]+$/) &&
      !!p.elo && p.elo.toString().match(/^[0-9]+$/)
    );
  },

  checkBanQuit: function(o) {
    return (
      !!o.tid && o.tid.toString().match(/^[0-9]+$/) &&
      !!o.uid && o.uid.toString().match(/^[0-9]+$/)
    );
  },

  create: function(p, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Players " +
        "(uid, tid, elo, quit) " +
          "VALUES " +
        "(" + p.uid + "," + p.tid + "," + p.elo + "," + !!p.quit + ")";
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
      db.all(query, (err, players) => {
        cb(err, players || []);
      });
    });
  },

  modify: function(p, uid) {
    db.serialize(function() {
      const query =
        "UPDATE Players " +
        "SET elo = " + p.elo + " " +
        "WHERE tid = " + p.tid + " AND uid = " + uid;
      db.run(query);
    });
  },

  toggleBanquit: function(o) {
    db.serialize(function() {
      let query =
        "UPDATE Players " +
        "SET quit = " + !!o.quit + ", ban = " + !!o.ban + " " +
        "WHERE tid = " + o.tid + " AND uid = " + o.uid;
      db.run(query);
    });
  },

  remove: function(tid, uid) {
    db.serialize(function() {
      let query =
        "DELETE FROM Players " +
        "WHERE tid = " + tid + " AND uid = " + uid;
      db.run(query);
    });
  }

};

module.exports = PlayerModel;
