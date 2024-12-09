//routes/authRouters.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// router.all("/*", (req, res, next) => {
//     req.app.local.layout = "default";
//     next();
// });

router.get("/sign-in", authController.showSignIn);
router.post("/sign-in", authController.authenticate);

router.get("/sign-up", authController.showSignUp);
router.post("/sign-up", authController.createUser);

router.get("/log-out", authController.logOut);

module.exports = router;
