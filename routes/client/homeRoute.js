const express = require("express");
const router = express.Router();
const controller = require("../../controllers/homeController");

router.get("/", controller.show); // get this method to render view
module.exports = router;
