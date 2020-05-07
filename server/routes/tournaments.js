let router = require("express").Router();
const access = require("../utils/access");
const params = require("../config/parameters");
const TournamentModel = require("../models/Tournament");

router.post("/tournaments", access.logged, access.ajax, (req,res) => {
  if (TournamentModel.checkTournament(req.body.tour)) {
    const tournament = {
      dtstart: req.body.tour.dtstart,
      ttype: req.body.tour.ttype,
      cadence: req.body.tour.cadence
    };
    TournamentModel.create(tournament, (err, ret) => {
      res.json(err || ret);
    });
  }
  else res.json({});
});

router.get("/tournaments", access.ajax, (req,res) => {
  const tourId = req.query["id"];
  const cursor = req.query["cursor"];
  if (!!tourId && !!tourId.match(/^[0-9]+$/)) {
    TournamentModel.getOne(tourId, (err, tournament) => {
      res.json(err || {tournament: tournament});
    });
  }
  else if (!!cursor && !!cursor.match(/^[0-9]+$/)) {
    TournamentModel.getNext(cursor, (err, tournaments) => {
      res.json(err || { tournaments: tournaments });
    });
  }
});

router.put("/tournaments", access.logged, access.ajax, (req,res) => {
  let obj = req.body.tournament;
  if (TournamentModel.checkTournament(obj))
    TournamentModel.safeUpdate(obj, req.userId, params.admin);
  res.json({});
});

router.delete("/tournaments", access.logged, access.ajax, (req,res) => {
  const tid = req.query.id;
  if (tid.toString().match(/^[0-9]+$/))
    TournamentModel.safeRemove(tid, req.userId, params.admin);
  res.json({});
});

module.exports = router;
