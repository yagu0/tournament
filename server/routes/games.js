let router = require("express").Router();
const access = require("../utils/access");
const params = require("../config/parameters");
const GameModel = require("../models/Game");

router.post("/games", access.logged, access.ajax, (req,res) => {
  const games = req.body.games;
  if (GameModel.checkGames(games)) {
    GameModel.create(games, (err, ret) => {
      res.json(err || ret);
    });
  }
});

router.get("/games", access.ajax, (req,res) => {
  const tid = req.query["tid"];
  if (!!tid && !!tid.match(/^[0-9]+$/)) {
    GameModel.getAll(tid, (err, games) => {
      res.json(err || { games: games });
    });
  }
});

router.put("/games", access.logged, access.ajax, (req,res) => {
  const game = req.body.game;
  if (GameModel.checkGame(game)) {
    GameModel.safeUpdate(game, req.userId, params.admin);
    res.json({});
  }
});

module.exports = router;
