let router = require("express").Router();
const access = require("../utils/access");
const params = require("../config/parameters");
const PlayerModel = require("../models/Player");

router.post("/players", access.logged, access.ajax, (req,res) => {
  const player = req.body.player;
  if (PlayerModel.checkPlayer(player)) {
    TournamentModel.create(player, (err, ret) => {
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
  let obj = req.body.player;
  if (PlayerModel.checkPlayer(obj)) {
    PlayerModel.safeUpdate(obj, req.userId, params.admin);
    res.json({});
  }
});

module.exports = router;
