let router = require("express").Router();
const access = require("../utils/access");
const params = require("../config/parameters");
const ExemptModel = require("../models/Exempt");

router.post("/exempts", access.logged, access.ajax, (req,res) => {
  const exempt = req.body.exempt;
  if (ExemptModel.checkExempt(exempt)) {
    ExemptModel.create(exempt, (err, ret) => {
      res.json(err || ret);
    });
  }
});

router.get("/exempts", access.ajax, (req,res) => {
  const tid = req.query["tid"];
  if (!!tid && !!tid.match(/^[0-9]+$/)) {
    ExemptModel.getAll(tid, (err, exempts) => {
      res.json(err || { exempts: exempts });
    });
  }
});

module.exports = router;
