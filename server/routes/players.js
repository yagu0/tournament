let router = require("express").Router();
const access = require("../utils/access");
const params = require("../config/parameters");
const PlayerModel = require("../models/Player");

router.post("/players", access.logged, access.ajax, (req,res) => {
  let player = req.body.player;
  if (PlayerModel.checkPlayer(player)) {
    player.uid = req.userId;
    PlayerModel.create(player, (err, ret) => {
      res.json(err || ret);
    });
  }
});

router.get("/players", access.ajax, (req,res) => {
  const tid = req.query["tid"];
  if (!!tid && !!tid.match(/^[0-9]+$/)) {
    PlayerModel.getAll(tid, (err, players) => {
      res.json(err || {players: players});
    });
  }
});

router.put("/players", access.logged, access.ajax, (req,res) => {
  const obj = req.body.player;
  if (PlayerModel.checkPlayer(obj)) {
    PlayerModel.modify(obj, req.userId);
    res.json({});
  }
});

// Toggle ban or quit
router.put("/toggle", access.logged, access.ajax, (req,res) => {
  const obj = req.body.banQuit;
  if (
    PlayerModel.checkBanQuit(obj) &&
    (
      params.admin.includes(req.userId) ||
      (!obj.ban && obj.uid == req.userId)
    )
  ) {
    PlayerModel.toggle(obj);
    res.json({});
  }
});

router.delete("/players", access.logged, access.ajax, (req,res) => {
  const tid = req.query.tid;
  if (!!tid && !!tid.toString().match(/^[0-9]+$/)) {
    PlayerModel.remove(tid, req.userId);
    res.json({});
  }
});

module.exports = router;
