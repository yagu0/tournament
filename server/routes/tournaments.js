let router = require("express").Router();
const access = require("../utils/access");
const params = require("../config/parameters");
const TournamentModel = require("../models/Tournament");

router.post("/tournaments", access.logged, access.ajax, (req,res) => {
  const tournament = req.body.tournament;
  if (TournamentModel.checkTournament(tournament)) {
    TournamentModel.create(tournament, (err, ret) => {
      res.json(err || ret);
    });
  }
});

router.get("/tournaments", access.ajax, (req,res) => {
  const tourId = req.query["id"];
  const cursor = req.query["cursor"];
  if (!!tourId && !!tourId.toString().match(/^[0-9]+$/)) {
    TournamentModel.getOne(tourId, (err, tournament) => {
      res.json(err || { tournament: tournament });
    });
  }
  else if (!!cursor && !!cursor.toString().match(/^[0-9]+$/)) {
    TournamentModel.getNext(cursor, (err, tournaments) => {
      res.json(err || { tournaments: tournaments });
    });
  }
});

router.put("/tournaments", access.logged, access.ajax, (req,res) => {
  const obj = req.body.tournament;
  if (
    params.admin.includes(req.userId) &&
    TournamentModel.checkTournament(obj)
  ) {
    TournamentModel.modify(obj);
  }
  res.json({});
});

router.delete("/tournaments", access.logged, access.ajax, (req,res) => {
  const tid = req.query.id;
  if (
    !!tid && !!tid.toString().match(/^[0-9]+$/) &&
    params.admin.includes(req.userId)
  ) {
    TournamentModel.remove(tid);
    res.json({});
  }
});

module.exports = router;
