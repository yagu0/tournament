let router = require("express").Router();
const UserModel = require('../models/User');
const sendEmail = require('../utils/mailer');
const genToken = require("../utils/tokenGenerator");
const access = require("../utils/access");
const params = require("../config/parameters");

router.post('/register', access.unlogged, access.ajax, (req,res) => {
  let user = req.body.user;
  if (UserModel.checkUser(user)) {
    UserModel.create(user, (err, ret) => {
      if (!!err) {
        const msg = err.code == "SQLITE_CONSTRAINT"
          ? "Duplicated email or license number"
          : "User creation failed. Try again";
        res.json({ errmsg: msg });
      }
      else {
        user.id = ret.id;
        setAndSendLoginToken(
          "Welcome to " + params.siteURL, user, res, "signup");
        res.json({});
      }
    });
  }
});

// NOTE: this method is safe because the sessionToken must be guessed
router.get("/whoami", access.ajax, (req,res) => {
  if (!req.cookies.token) res.json({});
  else if (req.cookies.token.match(/^[a-z0-9]+$/)) {
    UserModel.getOne("sessionToken", req.cookies.token, (err, user) => {
      if (!user) res.json({});
      else {
        // Some fields shouldn't be passed to the app:
        delete user["loginToken"];
        delete user["loginTime"];
        delete user["sessionToken"];
        delete user["created"];
        res.json(user);
      }
    });
  }
});

// NOTE: this method is safe because only IDs and names are returned
router.get("/users", access.ajax, (req,res) => {
  const ids = req.query["ids"];
  // NOTE: slightly too permissive RegExp
  if (!!ids && !!ids.match(/^([0-9]+,?)+$/)) {
    UserModel.getByIds(ids, (err, users) => {
      res.json({ users: users });
    });
  }
  else {
    // Retrieve all users:
    UserModel.getAll((err, users) => {
      res.json({ users: users || [] });
    });
  }
});

router.put('/update', access.logged, access.ajax, (req,res) => {
  let user = req.body.user;
  if (UserModel.checkUser(user)) {
    user.id = req.userId; //in case of
    UserModel.updateSettings(user);
    res.json({});
  }
});

// Toggle active flag:
router.put('/de_activate', access.logged, access.ajax, (req,res) => {
  if (!params.admin.includes(req.userId)) return;
  const uid = req.body.uid;
  if (!!uid && !!uid.toString().match(/^[0-9]+$/)) {
    UserModel.toggleActive(uid, !!req.body.active);
    res.json({});
  }
});

// Authentication-related methods:

// to: object user (to who we send an email)
function setAndSendLoginToken(subject, to, res, signup) {
  // Set login token and send welcome(back) email with auth link
  const token = genToken(params.token.length);
  UserModel.setLoginToken(token, to.id);
  let body =
    "Hello " + to.firstName + " " + to.lastName + " !" + `
` +
    "Access your account here: " +
    params.siteURL + "/#/authenticate/" + token + `
` +
    "Token will expire in " + params.token.expire/(1000*60) + " minutes."
  if (!!signup) {
    body += `

` + "NOTE: account activation is not immediate. " +
      "Please wait a few hours (maximum, generally) " +
      "before you can join a tournament.";
    // Notify admins:
    params.admin_emails.forEach(email => {
      sendEmail(
        params.mail.noreply,
        email,
        "[tournament] New registration",
        to.firstName + " " + to.lastName + " just signed up."
      );
    });
  }
  sendEmail(params.mail.noreply, to.email, subject, body);
}

router.get('/sendtoken', access.unlogged, access.ajax, (req,res) => {
  const email = decodeURIComponent(req.query.email);
  if (UserModel.checkEmail(email)) {
    UserModel.getOne("email", email, (err,user) => {
      access.checkRequest(res, err, user, "Unknown user", () => {
        setAndSendLoginToken("Token for " + params.siteURL, user, res);
        res.json({});
      });
    });
  }
});

router.get('/authenticate', access.unlogged, access.ajax, (req,res) => {
  if (!req.query.token.match(/^[a-z0-9]+$/))
    return res.json({errmsg: "Bad token"});
  UserModel.getOne("loginToken", req.query.token, (err,user) => {
    access.checkRequest(res, err, user, "Invalid token", () => {
      // If token older than params.tokenExpire, do nothing
      if (Date.now() > user.loginTime + params.token.expire)
        res.json({errmsg: "Token expired"});
      else {
        // Generate session token (if not exists) + destroy login token
        UserModel.trySetSessionToken(user.id, (token) => {
          res.cookie("token", token, {
            httpOnly: true,
            secure: !!params.siteURL.match(/^https/),
            maxAge: params.cookieExpire,
            //sameSite: params.cookieSameSite
          });
          res.json(user);
        });
      }
    });
  });
});

router.get('/logout', access.logged, access.ajax, (req,res) => {
  res.clearCookie("token");
  res.json({});
});

module.exports = router;
