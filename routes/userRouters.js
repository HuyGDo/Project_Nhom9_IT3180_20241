// filepath: routes/userRouters.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// List all users
router.get("/", userController.listUsers);

// View other users profile
router.get("/:id", userController.viewProfile);

// Follow to a user
router.post("/:id/follow", userController.followUser);

// Unfollow to a user
router.post("/:id/unfollow", userController.unfollowUser);

module.exports = router;
