const db = require("../utils/database");
const genToken = require("../utils/tokenGenerator");
const params = require("../config/parameters");
const sendEmail = require('../utils/mailer');

/*
 * Structure:
 *   _id: integer
 *   firstName: varchar
 *   lastName: varchar
 *   email: varchar
 *   license: varchar
 *   club: varchar
 *   loginToken: token on server only
 *   loginTime: datetime (validity)
 *   sessionToken: token in cookies for authentication
 *   notify: boolean (send email notifications 1H before tournament)
 *   active: boolean (validated by admin)
 *   created: datetime
 */

const UserModel = {
  checkUser: function(o) {
    return (
      (!!o.firstName && !!o.firstName.match(/^[a-zA-Z-]+$/)) &&
      (!!o.lastName && !!o.firstName.match(/^[a-zA-Z'-]+$/)) &&
      UserModel.checkEmail(o.email) &&
      (!o.club || !!o.club.match(/^[\w' -]+$/)) &&
      (!o.license || !!o.license.match(/^[\w-]+$/))
    );
  },

  checkEmail: function(email) {
    return (!!email && !!email.match(/^[\w.+-]+@[\w.+-]+$/));
  },

  create: function(u, cb) {
    db.serialize(function() {
      const query =
        "INSERT INTO Users " +
        "(firstName, lastName, email, license, club, notify, created) " +
        "VALUES " +
        "('" +
          u.firstName + "','" + u.lastName + "','" + u.email + "','" +
          u.license + "','" + u.club + "'," + !!u.notify + "," + Date.now() +
        ")";
      db.run(query, function(err) {
        cb(err, { id: this.lastID });
      });
    });
  },

  // Find one user by email or token
  getOne: function(by, value, cb) {
    // TODO: all possible values are strings now
    const delimiter = (typeof value === "string" ? "'" : "");
    db.serialize(function() {
      const query =
        "SELECT * " +
        "FROM Users " +
        "WHERE " + by + " = " + delimiter + value + delimiter;
      db.get(query, cb);
    });
  },

  getByIds: function(ids, cb) {
    db.serialize(function() {
      const query =
        "SELECT id, firstName, lastName, club " +
        "FROM Users " +
        "WHERE id IN (" + ids + ")";
      db.all(query, cb);
    });
  },

  getAll: function(cb) {
    db.serialize(function() {
      const query =
        "SELECT id, firstName, lastName, club, license " +
        "FROM Users " +
        "WHERE active";
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
          "SET loginToken = NULL" +
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
        "SET firstName = '" + user.firstName + "'" +
        ", lastName = '" + user.lastName + "'" +
        ", email = '" + user.email + "'" +
        ", club = '" + user.club + "'" +
        ", license = '" + user.license + "'" +
        ", notify = " + !!user.notify + " " +
        "WHERE id = " + user.id;
      db.run(query);
    });
  },

  toggleActive: function(id, active) {
    db.serialize(function() {
      const query =
        "UPDATE Users " +
        "SET active = '" + active + "'" +
        "WHERE id = " + id;
      db.run(query);
    });
  },

  /////////////////
  // NOTIFICATIONS

  notify: function(user, message) {
    const subject = "tournament - notification";
    const body = "Hello " + user.firstName + " " + user.lastName + " !" + `
` + message;
    sendEmail(params.mail.noreply, user.email, subject, body);
  },

  tryNotify: function(id, message) {
    UserModel.getOne("id", id, (err,user) => {
      if (!err && user.notify) UserModel.notify(user, message);
    });
  },

  ////////////
  // CLEANING

  cleanUsersDb: function() {
    const tsNow = Date.now();
    // 86400000 = 24 hours in milliseconds
    const day = 86400000;
    db.serialize(function() {
      const query =
        "SELECT id, sessionToken, created, email, firstName, lastName " +
        "FROM Users";
      db.all(query, (err, users) => {
        let toRemove = [];
        users.forEach(u => {
          // Remove users unlogged for > 24h
          if (!u.sessionToken && tsNow - u.created > day)
          {
            toRemove.push(u.id);
            UserModel.notify(
              u,
              "Your account has been deleted because " +
              "you didn't log in for 24h after registration"
            );
          }
        });
        if (toRemove.length > 0) {
          db.run(
            "DELETE FROM Users " +
            "WHERE id IN (" + toRemove.join(",") + ")"
          );
        }
      });
    });
  },
};

module.exports = UserModel;
