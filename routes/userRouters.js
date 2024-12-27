// filepath: routes/userRouters.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const profileController = require("../controllers/profileController");
const auth = require("../middleware/authMiddleware");
const { uploadAvatar } = require("../services/uploadService");

// Me routes (profile routes)
router.get("/me", auth.requireAuth, auth.checkUser, userController.showUserInfo);
router.get("/me/stored/recipes", auth.requireAuth, userController.showStoredRecipes);
router.get("/me/following", auth.requireAuth, userController.getFollowing);
router.get("/me/followers", auth.requireAuth, userController.getFollowers);
router.get("/me/edit-profile", auth.requireAuth, profileController.showEditProfile);
router.post("/me/edit-profile", auth.requireAuth, uploadAvatar, profileController.updateProfile);

// User routes
router.get("/", userController.listUsers);
router.get("/:id", userController.viewProfile);
router.post("/:id/follow", auth.requireAuth, userController.followUser);
router.post("/:id/unfollow", auth.requireAuth, userController.unfollowUser);

module.exports = router;
