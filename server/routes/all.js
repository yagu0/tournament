let router = require("express").Router();

router.use("/", require("./users"));
router.use("/", require("./tournaments"));
router.use("/", require("./players"));
router.use("/", require("./games"));
router.use("/", require("./exempts"));
router.use("/", require("./chats"));

module.exports = router;
