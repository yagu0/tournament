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

// Temporary: compute pairings on server (TODO: in browser instead)
const { exec } = require('child_process');
router.get("/compute_pairing", access.logged, access.ajax, (req,res) => {
  const edges = req.query["edges"];
  if (
    params.admin.includes(req.userId) &&
    !!edges.match(/^\[(\([0-9.,-]+\),?)+\]$/)
  ) {
    const cmd =
      'python -c "from mwmatching3 import maxWeightMatching;' +
      'print(maxWeightMatching(' + edges + ',maxcardinality=True))"';
    exec(cmd, { cwd: "./" }, (err, stdout, stderr) => {
      res.json({ assignment: stdout });
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

router.put("/toggle_state", access.logged, access.ajax, (req,res) => {
  const tid = req.body.tid;
  if (
    !!tid && !!tid.toString().match(/^[0-9]+$/) &&
    params.admin.includes(req.userId)
  ) {
    TournamentModel.toggleState(
      tid, { frozen: req.body.frozen, over: req.body.over });
    res.json({});
  }
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
