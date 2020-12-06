const db = require("../utils/database");
const genToken = require("../utils/tokenGenerator");
const params = require("../config/parameters");
const sendEmail = require('../utils/mailer');

/*
 * Structure: imported from vchess/User model
 */

const UserModel = {

  checkEmail: function(email) {
    return (!!email && !!(email.match(/^[\w.+-]+@[\w.+-]+$/)));
  },

  // Find one user by email or token
  getOne: function(by, value, cb, fields) {
    // TODO: all possible values are strings now
    const delimiter = (typeof value === "string" ? "'" : "");
    db.serialize(function() {
      const query =
        "SELECT " + (fields || "*") + " " +
        "FROM Users " +
        "WHERE " + by + " = " + delimiter + value + delimiter;
      db.get(query, cb);
    });
  },

  getByIds: function(ids, cb) {
    db.serialize(function() {
      const query =
        "SELECT id, name " +
        "FROM Users " +
        "WHERE id IN (" + ids + ")";
      db.all(query, cb);
    });
  },

  getAll: function(cb) {
    db.serialize(function() {
      const query =
        "SELECT id, name " +
        "FROM Users";
      db.all(query, cb);
    });
  },

  /////////
  // MODIFY

  setLoginToken: function(token, id) {
    db.serialize(function() {
      const query =
        "UPDATE Users " +
        "SET loginToken = '" + token + "',loginTime = " + Date.now() + " " +
        "WHERE id = " + id;
      db.run(query);
    });
  },

  // Set session token only if empty (first login)
  // NOTE: weaker security (but avoid to re-login everywhere after each logout)
  // TODO: option would be to reset all tokens periodically (every 3 months?)
  trySetSessionToken: function(id, cb) {
    db.serialize(function() {
      let query =
        "SELECT sessionToken " +
        "FROM Users " +
        "WHERE id = " + id;
      db.get(query, (err, ret) => {
        const token = ret.sessionToken || genToken(params.token.length);
        const setSessionToken =
          (!ret.sessionToken ? (", sessionToken = '" + token + "'") : "");
        query =
          "UPDATE Users " +
          // Also empty the login token to invalidate future attempts
          "SET loginToken = NULL, loginTime = NULL " +
          setSessionToken + " " +
          "WHERE id = " + id;
        db.run(query);
        cb(token);
      });
    });
  },

  updateSettings: function(user) {
    db.serialize(function() {
      const query =
        "UPDATE Users " +
        "SET email = '" + user.email + "'" +
        ", notify = " + !!user.notify + " " +
        "WHERE id = " + user.id;
      db.run(query);
    });
  },

  /////////////////
  // NOTIFICATIONS

  notify: function(user, message) {
    const subject = "tournament - notification";
    const body = "Hello " + user.name + " !" + `
` + message;
    sendEmail(params.mail.noreply, user.email, subject, body);
  },

  tryNotify: function(id, message) {
    UserModel.getOne("id", id, (err,user) => {
      if (!err && user.notify) UserModel.notify(user, message);
    }, "name, email");
  },

  ////////////
  // SYNC USERS WITH VCHESS: manually, before tournament

};

module.exports = UserModel;
