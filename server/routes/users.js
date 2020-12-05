let router = require("express").Router();
const UserModel = require('../models/User');
const sendEmail = require('../utils/mailer');
const genToken = require("../utils/tokenGenerator");
const access = require("../utils/access");
const params = require("../config/parameters");

// NOTE: this method is safe because the sessionToken must be guessed
router.get("/whoami", access.ajax, (req,res) => {
  if (!req.cookies.token) res.json({});
  else if (req.cookies.token.match(/^[a-z0-9]+$/)) {
    UserModel.getOne("sessionToken", req.cookies.token, (err, user) => {
      res.json(user || {});
    }, "id, name, email");
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

// Authentication-related methods:

// to: object user (to who we send an email)
function setAndSendLoginToken(subject, to) {
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
  sendEmail(params.mail.noreply, to.email, subject, body);
}

router.get('/sendtoken', access.unlogged, access.ajax, (req,res) => {
  const email = decodeURIComponent(req.query.email);
  if (UserModel.checkEmail(email)) {
    UserModel.getOne("email", email, (err,user) => {
      access.checkRequest(res, err, user, "Unknown user", () => {
        setAndSendLoginToken("Token for " + params.siteURL, user);
        res.json({});
      });
    }, "id, name, email");
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
  }, "id, name, email");
});

router.get('/logout', access.logged, access.ajax, (req,res) => {
  res.clearCookie("token");
  res.json({});
});

module.exports = router;
