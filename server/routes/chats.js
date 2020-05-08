let router = require("express").Router();
const access = require("../utils/access");
const ChatModel = require("../models/Chat");

router.post("/chats", access.logged, access.ajax, (req,res) => {
  const chat = {
    uid: req.userId,
    tid: req.body.tid,
    msg: req.body.msg
  };
  if (!!chat.tid && !!chat.tid.match(/^[0-9]+$/)) {
    ChatModel.create(chat, (err, ret) => {
      res.json(err || ret);
    });
  }
});

router.get("/chats", access.ajax, (req,res) => {
  const tid = req.query["id"];
  if (!!tid && !!tid.match(/^[0-9]+$/)) {
    ChatModel.getAll(tid, (err, chats) => {
      res.json(err || { chats: chats });
    });
  }
});

module.exports = router;
