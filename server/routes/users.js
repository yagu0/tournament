let router = require("express").Router();
const UserModel = require('../models/User');
const sendEmail = require('../utils/mailer');
const genToken = require("../utils/tokenGenerator");
const access = require("../utils/access");
const params = require("../config/parameters");

router.post('/register', access.unlogged, access.ajax, (req,res) => {
  const name = req.body.name;
  const email = req.body.email;
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
        setAndSendLoginToken("Welcome to " + params.siteURL, user, res);
        res.json({});
      }
    });
  }
});

// NOTE: this method is safe because the sessionToken must be guessed
router.get("/whoami", access.ajax, (req,res) => {
  const callback = (user) => {
    res.json(user);
  };
  if (!req.cookies.token) callback({});
  else if (req.cookies.token.match(/^[a-z0-9]+$/)) {
    UserModel.getOne("sessionToken", req.cookies.token, (err, user) => {
      callback(user || {});
    });
  }
});

// NOTE: this method is safe because only IDs and names are returned
router.get("/users", access.ajax, (req,res) => {
  const ids = req.query["ids"];
  // NOTE: slightly too permissive RegExp
  if (ids.match(/^([0-9]+,?)+$/)) {
    UserModel.getByIds(ids, (err, users) => {
      res.json({ users: users });
    });
  }
});

router.put('/update', access.logged, access.ajax, (req,res) => {
  const name = req.body.name;
  const email = req.body.email;
  if (UserModel.checkNameEmail({name: name, email: email})) {
    const user = {
      id: req.userId,
      name: name,
      email: email,
      notify: !!req.body.notify,
    };
    UserModel.updateSettings(user);
    res.json({});
  }
});

// Authentication-related methods:

// to: object user (to who we send an email)
function setAndSendLoginToken(subject, to, res) {
  // Set login token and send welcome(back) email with auth link
  const token = genToken(params.token.length);
  UserModel.setLoginToken(token, to.id);
  const body =
    "Hello " + to.name + " !" + `
` +
    "Access your account here: " +
    params.siteURL + "/#/authenticate/" + token + `
` +
    "Token will expire in " + params.token.expire/(1000*60) + " minutes."
  sendEmail(params.mail.noreply, to.email, subject, body);
}

router.get('/sendtoken', access.unlogged, access.ajax, (req,res) => {
  const nameOrEmail = decodeURIComponent(req.query.nameOrEmail);
  const type = (nameOrEmail.indexOf('@') >= 0 ? "email" : "name");
  if (UserModel.checkNameEmail({[type]: nameOrEmail})) {
    UserModel.getOne(type, nameOrEmail, (err,user) => {
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
          });
          res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            notify: user.notify,
            active: user.active
          });
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
