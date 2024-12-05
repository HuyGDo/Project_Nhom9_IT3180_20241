const express = require("express");
const router = express.Router();
const defaultController = require("../controllers/defaultController");

// router.all("/*", (req, res, next) => {
//     req.app.local.layout = "default";
//     next();
// });

router.get("/", defaultController.show);

module.exports = router;
