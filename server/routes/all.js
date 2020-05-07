let router = require("express").Router();

router.use("/", require("./users"));
router.use("/", require("./tournaments"));
router.use("/", require("./players"));

module.exports = router;
