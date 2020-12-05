const db = require("../utils/database");

/*
 * Structure:
 *   tid: integer
 *   uid: integer
 *   msg: text
 *   added: datetime
 */

const ChatModel = {

  checkChat: function(c) {
    return (
      !!c.tid && c.tid.toString().match(/^[0-9]+$/) &&
      !!c.uid && c.uid.toString().match(/^[0-9]+$/)
    );
  },

  create: function(c, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Chats " +
        "(uid, tid, msg, added) " +
          "VALUES " +
        "(" + c.uid + "," + c.tid + ",?," + Date.now() + ")";
      db.run(query, c.msg, function(err) {
        cb(err, { id: this.lastID });
      });
    });
  },

  getAll: function(tid, cb) {
    db.serialize(function() {
      const query =
        "SELECT * " +
        "FROM Chats " +
        "WHERE tid = " + tid;
      db.all(query, (err, chats) => {
        cb(err, chats || []);
      });
    });
  }

};

module.exports = ChatModel;
